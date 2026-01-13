import { useEffect, useMemo, useState } from "react";
import { ungzip } from "pako";

export type IndexProduct = {
  handle?: string;
  slug?: string;
  title?: string;

  // common image fields
  image?: string | null;
  image_url?: string | null;
  main_image?: string | null;

  // arrays used by various generators
  images?: any;
  gallery?: any;

  // extra fields (optional)
  price?: number | null;
  was_price?: number | null;
  rating?: number | null;
  rating_count?: number | null;

  // allow unknown keys safely
  [k: string]: any;
};

type UseIndexProductsResult = {
  items: IndexProduct[];
  loading: boolean;
  error: string | null;
};

// ✅ R2 public base (same pattern you already use elsewhere)
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

// Where the cards file lives.
// If you serve from the site root as "/_index.cards.json", keep default.
// If you serve from "/indexes/_index.cards.json", set VITE_INDEX_CARDS_PATH.
const INDEX_CARDS_PATH =
  import.meta.env.VITE_INDEX_CARDS_PATH || "/_index.cards.json";

// optional version-busting
const INDEX_VERSION = import.meta.env.VITE_SEARCH_INDEX_VERSION || "";

function safeStr(v: any): string {
  return typeof v === "string" ? v : "";
}

function isProbablyUrl(s: string): boolean {
  if (!s) return false;
  return (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("//") ||
    s.startsWith("/")
  );
}

function normalizeUrl(u: string): string {
  let s = safeStr(u).trim();
  if (!s) return "";

  // protocol-relative (//m.media-amazon.com/...)
  if (s.startsWith("//")) s = "https:" + s;

  // sometimes people accidentally store without protocol but with domain
  if (!s.startsWith("http://") && !s.startsWith("https://") && s.includes(".") && !s.startsWith("/")) {
    // best-effort; if it's actually a relative filename, this won't help,
    // but it won't break either.
    s = "https://" + s;
  }

  return s;
}

function firstStringFromUnknown(x: any): string {
  if (!x) return "";
  if (typeof x === "string") return x;

  // arrays of strings or objects
  if (Array.isArray(x)) {
    for (const v of x) {
      const s = firstStringFromUnknown(v);
      if (s) return s;
    }
    return "";
  }

  // objects like { url }, { src }, { href }
  if (typeof x === "object") {
    const candidates = [
      x.url,
      x.src,
      x.href,
      x.image,
      x.image_url,
      x.main_image,
      x.original,
      x.large,
      x.medium,
      x.small,
    ];
    for (const c of candidates) {
      const s = firstStringFromUnknown(c);
      if (s) return s;
    }
  }

  return "";
}

function pickBestImage(raw: any): string {
  if (!raw) return "";

  // direct fields
  const direct = [
    raw.image,
    raw.image_url,
    raw.main_image,
    raw.thumbnail,
    raw.thumb,
    raw.primary_image,
    raw.hero_image,
    raw.heroImage,
    raw.imageUrl,
    raw.img,
  ];

  for (const v of direct) {
    const s = firstStringFromUnknown(v);
    if (s && isProbablyUrl(s)) return normalizeUrl(s);
  }

  // arrays / galleries
  const arrCandidates = [raw.images, raw.gallery, raw.media, raw.photos, raw.image_list];
  for (const v of arrCandidates) {
    const s = firstStringFromUnknown(v);
    if (s && isProbablyUrl(s)) return normalizeUrl(s);
  }

  // sometimes nested like raw.product.image, raw.pdp.images, etc.
  const nested = [
    raw.product,
    raw.pdp,
    raw.data,
    raw.item,
    raw.card,
  ];
  for (const n of nested) {
    const s = firstStringFromUnknown(n);
    if (s && isProbablyUrl(s)) return normalizeUrl(s);
  }

  return "";
}

function isGzipBuffer(buf: ArrayBuffer): boolean {
  const u8 = new Uint8Array(buf);
  return u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b;
}

function buildUrl(): string {
  const base = String(R2_PUBLIC_BASE || "").replace(/\/+$/, "");
  const path = String(INDEX_CARDS_PATH || "").startsWith("/")
    ? INDEX_CARDS_PATH
    : "/" + INDEX_CARDS_PATH;

  let url = `${base}${path}`;
  if (INDEX_VERSION) {
    url += (url.includes("?") ? "&" : "?") + "v=" + encodeURIComponent(INDEX_VERSION);
  }
  return url;
}

export function useIndexProducts(): UseIndexProductsResult {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => buildUrl(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(url, {
          // allow browser caching; use version string to bust if needed
          cache: "default",
        });

        if (!res.ok) {
          throw new Error(`Index fetch failed: ${res.status} ${res.statusText}`);
        }

        // ✅ read body ONCE
        const buf = await res.arrayBuffer();

        let text = "";
        if (isGzipBuffer(buf)) {
          const unzipped = ungzip(new Uint8Array(buf));
          text = new TextDecoder("utf-8").decode(unzipped);
        } else {
          text = new TextDecoder("utf-8").decode(new Uint8Array(buf));
        }

        const parsed = JSON.parse(text);

        const arr: any[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.items)
            ? parsed.items
            : Array.isArray(parsed?.data)
              ? parsed.data
              : [];

        const normalized: IndexProduct[] = arr.map((raw) => {
          const r: IndexProduct = (raw && typeof raw === "object") ? { ...raw } : {};

          // slug/handle sanity
          const handle = safeStr(r.handle) || safeStr(r.slug) || safeStr((raw as any)?.url_slug);
          const slug = safeStr(r.slug) || safeStr(r.handle) || handle;

          // title sanity
          const title = safeStr(r.title) || safeStr((raw as any)?.name) || safeStr((raw as any)?.product_title);

          // ✅ image extraction
          const img = pickBestImage(r) || pickBestImage(raw);

          // write back into common fields so ProductCard can use any
          r.handle = handle || r.handle;
          r.slug = slug || r.slug;
          r.title = title || r.title;

          if (img) {
            r.image = img;
            r.image_url = img;
            if (!r.main_image) r.main_image = img;
          } else {
            // keep explicit nulls to avoid “No image” logic relying on undefined
            r.image = r.image ?? null;
            r.image_url = r.image_url ?? null;
            r.main_image = r.main_image ?? null;
          }

          return r;
        });

        if (!cancelled) {
          setItems(normalized);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ? String(e.message) : "Failed to load index");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { items, loading, error };
}
