import { useEffect, useState } from "react";

export type IndexProduct = {
  handle?: string;
  slug?: string;
  asin?: string;
  id?: string;

  title?: string;

  // pricing (varies by build)
  price?: number | string;
  current_price?: number | string;
  sale_price?: number | string;
  list_price?: number | string;
  was_price?: number | string;
  wasPrice?: number | string;

  rating?: number | string;
  rating_count?: number | string;
  ratingCount?: number | string;

  // images (varies by build)
  image?: any;
  image_url?: any;
  imageUrl?: any;
  thumbnail?: any;
  images?: any;
  gallery_images?: any;
};

export type UseIndexProductsReturn = {
  items: IndexProduct[];
  loading: boolean;
  error: string | null;
};

function readUrlFromMaybeObj(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "object") {
    const anyV = v as any;
    const s =
      anyV?.url || anyV?.src || anyV?.href || anyV?.hiRes || anyV?.large;
    if (typeof s === "string" && s.trim()) return s.trim();
  }
  return null;
}

function getFirstFromImages(images: unknown): string | null {
  if (!images) return null;

  if (typeof images === "string") return images.trim() || null;

  if (Array.isArray(images)) {
    const first = images[0] as any;
    if (typeof first === "string") return first.trim() || null;
    if (first && typeof first === "object") return readUrlFromMaybeObj(first);
  }

  if (typeof images === "object") {
    const anyImgs = images as any;
    if (Array.isArray(anyImgs.images)) return getFirstFromImages(anyImgs.images);
  }

  return null;
}

function pickProductImage(p: any): string | null {
  const candidates: any[] = [
    p?.thumbnail,
    p?.image,
    p?.image_url,
    p?.imageUrl,
    p?.img,
    p?.primary_image,
    p?.main_image,
    Array.isArray(p?.images) ? p.images : null,
    Array.isArray(p?.gallery_images) ? p.gallery_images : null,
  ];

  for (const c of candidates) {
    const u1 = readUrlFromMaybeObj(c);
    if (u1) return u1;

    const u2 = getFirstFromImages(c);
    if (u2) return u2;
  }

  return null;
}

function toNumberMaybe(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function fetchJsonSafe(url: string): Promise<any> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);

  const ct = r.headers.get("content-type") || "";
  const text = await r.text();

  // Vite/SPA fallback returns HTML for wrong paths — catch that clearly.
  if (
    ct.includes("text/html") ||
    text.trim().startsWith("<!DOCTYPE") ||
    text.trim().startsWith("<html")
  ) {
    const first = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(
      `Expected JSON but got HTML for ${url}. First chars: ${first}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    const first = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`Failed to parse JSON for ${url}. First chars: ${first}`);
  }
}

async function fetchFirstJson(urls: string[]): Promise<any> {
  let lastErr: any = null;
  for (const u of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fetchJsonSafe(u);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Failed to fetch JSON");
}

/* -----------------------------
 * R2 INDEX URLS (PRODUCTION)
 * -----------------------------
 * We must use absolute R2 URLs because relative paths WILL break on Cloudflare Pages.
 */
const R2_INDEX_URLS = [
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/_index.json",
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/search_index.enriched.json",
];

export function useIndexProducts(): UseIndexProductsReturn {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // ✅ Prefer the real product index (has images + category_keys after your normalize step)
        const json = await fetchFirstJson(R2_INDEX_URLS);

        let arr: any[] = [];
        if (Array.isArray(json)) arr = json;
        else if (
          json &&
          typeof json === "object" &&
          Array.isArray((json as any).items)
        )
          arr = (json as any).items;
        else arr = [];

        // If index is a list of strings (bad/old build), keep it usable.
        const normalized: IndexProduct[] = arr
          .map((p: any) => {
            if (typeof p === "string") {
              return { handle: p, slug: p, asin: p, title: p };
            }

            const handle =
              (typeof p?.handle === "string" && p.handle) ||
              (typeof p?.slug === "string" && p.slug) ||
              (typeof p?.asin === "string" && p.asin) ||
              (typeof p?.id === "string" && p.id) ||
              "";

            return {
              ...p,
              handle,
              // normalize a single “best” image into `image` so cards always render
              image: pickProductImage(p),
              // normalize price fields a bit (optional)
              price:
                toNumberMaybe(p?.price ?? p?.current_price ?? p?.sale_price) ??
                (p?.price ?? p?.current_price ?? p?.sale_price),
              was_price:
                toNumberMaybe(p?.was_price ?? p?.wasPrice ?? p?.list_price) ??
                (p?.was_price ?? p?.wasPrice ?? p?.list_price),
              rating: toNumberMaybe(p?.rating) ?? p?.rating,
              rating_count:
                toNumberMaybe(p?.rating_count ?? p?.ratingCount) ??
                (p?.rating_count ?? p?.ratingCount),
              title: typeof p?.title === "string" ? p.title : handle,
            } as IndexProduct;
          })
          .filter((x) => x && typeof x === "object" && (x.handle || x.slug || x.asin));

        if (!cancelled) setItems(normalized);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load product index");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}

export default useIndexProducts;


