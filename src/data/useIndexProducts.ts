import { useEffect, useMemo, useState } from "react";
import { ungzip } from "pako";

export type IndexProduct = {
  handle: string;
  slug: string;
  title: string;

  image: string | null;

  price?: number | null;
  was_price?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  category?: string | null;
  brand?: string | null;

  searchable?: string;
};

type AnyObj = Record<string, any>;

// ✅ R2 public base + optional version-busting (minimal + safe)
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

const INDEX_CARDS_PATH =
  import.meta.env.VITE_INDEX_CARDS_PATH || "/indexes/_index.cards.json";

function safeStr(v: any): string {
  return typeof v === "string" ? v : "";
}

function normalizeText(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function normalizeImageUrl(raw: any): string | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    for (const it of raw) {
      const u = normalizeImageUrl(it);
      if (u) return u;
    }
    return null;
  }

  if (typeof raw === "object") {
    const o = raw as AnyObj;
    const candidate =
      o.url ??
      o.src ??
      o.href ??
      o.image ??
      o.image_url ??
      o.imageUrl ??
      o.main ??
      o.main_image ??
      o.primary ??
      o.primary_image ??
      o.primaryImage;
    return normalizeImageUrl(candidate);
  }

  const s = String(raw).trim();
  if (!s) return null;

  if (s.startsWith("data:")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("https://")) return s;
  if (s.startsWith("http://")) return s.replace(/^http:\/\//i, "https://");

  if (s.startsWith("/")) return s;

  return joinUrl(R2_PUBLIC_BASE, s);
}

function pickImage(item: AnyObj): string | null {
  const direct =
    item.image ??
    item.img ??
    item.image_url ??
    item.imageUrl ??
    item.main_image ??
    item.mainImage ??
    item.primary_image ??
    item.primaryImage ??
    item.thumbnail ??
    item.thumb ??
    item.preview ??
    item.preview_image ??
    item.previewImage;

  const fromDirect = normalizeImageUrl(direct);
  if (fromDirect) return fromDirect;

  const arrays =
    item.images ?? item.gallery ?? item.image_urls ?? item.imageUrls ?? null;

  const fromArrays = normalizeImageUrl(arrays);
  if (fromArrays) return fromArrays;

  const nested =
    item.media ??
    item.assets ??
    item.primary ??
    item.hero ??
    item.cover ??
    item.card ??
    null;

  const fromNested = normalizeImageUrl(nested);
  if (fromNested) return fromNested;

  return null;
}

function pickHandleSlug(item: AnyObj): { handle: string; slug: string } {
  const handle =
    safeStr(item.handle) ||
    safeStr(item.slug) ||
    safeStr(item.url_slug) ||
    safeStr(item.urlSlug) ||
    safeStr(item.id) ||
    "";

  const slug =
    safeStr(item.slug) ||
    safeStr(item.url_slug) ||
    safeStr(item.urlSlug) ||
    handle;

  return { handle, slug };
}

function pickTitle(item: AnyObj): string {
  return (
    safeStr(item.title) ||
    safeStr(item.name) ||
    safeStr(item.product_title) ||
    safeStr(item.productTitle) ||
    safeStr(item.label) ||
    ""
  );
}

function normalizeItem(raw: AnyObj): IndexProduct | null {
  const { handle, slug } = pickHandleSlug(raw);
  const title = pickTitle(raw);

  if (!handle || !slug || !title) return null;

  const image = pickImage(raw);

  const brand = safeStr(raw.brand) || safeStr(raw.brand_name) || null;
  const category =
    safeStr(raw.category) || safeStr(raw.cat) || safeStr(raw.category_name) || null;

  const price =
    typeof raw.price === "number" ? raw.price : raw.price ? Number(raw.price) : null;

  const was_price =
    typeof raw.was_price === "number"
      ? raw.was_price
      : raw.was_price
      ? Number(raw.was_price)
      : null;

  const rating =
    typeof raw.rating === "number" ? raw.rating : raw.rating ? Number(raw.rating) : null;

  const rating_count =
    typeof raw.rating_count === "number"
      ? raw.rating_count
      : raw.rating_count
      ? Number(raw.rating_count)
      : null;

  const searchable = normalizeText([title, brand || "", category || ""].join(" "));

  return {
    handle,
    slug,
    title,
    image,
    price,
    was_price,
    rating,
    rating_count,
    brand,
    category,
    searchable,
  };
}

/**
 * ✅ Reads response body exactly once, then tries:
 * 1) decode utf-8 text -> JSON.parse
 * 2) ungzip bytes -> JSON.parse
 */
async function fetchJsonMaybeGzip(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);

  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Try plain JSON text first
  try {
    let text = new TextDecoder("utf-8").decode(bytes);
    // strip BOM if present
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    return JSON.parse(text);
  } catch {
    // Try gzipped JSON
    const inflated = ungzip(bytes, { to: "string" }) as unknown as string;
    return JSON.parse(inflated);
  }
}

export function useIndexProducts() {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const cardsUrl = useMemo(() => INDEX_CARDS_PATH, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchJsonMaybeGzip(cardsUrl);

        const arr: AnyObj[] = Array.isArray(data)
          ? data
          : Array.isArray((data as AnyObj)?.items)
          ? (data as AnyObj).items
          : [];

        const normalized: IndexProduct[] = [];
        for (const raw of arr) {
          const n = normalizeItem(raw);
          if (n) normalized.push(n);
        }

        if (!cancelled) setItems(normalized);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load index cards");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cardsUrl]);

  return { items, loading, error };
}
