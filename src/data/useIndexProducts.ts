import { useEffect, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

export type IndexProduct = {
  handle?: string;
  slug?: string;
  asin?: string;
  id?: string;

  title?: string;

  price?: number | string;
  was_price?: number | string;

  rating?: number | string;
  rating_count?: number | string;

  image?: string | null;
  images?: any;
  gallery_images?: any;
  category?: string;
  category_path?: string[];
};

export type UseIndexProductsReturn = {
  items: IndexProduct[];
  loading: boolean;
  error: string | null;
};

/* =========================================================
   CONFIG — 🔴 THIS IS THE IMPORTANT PART
========================================================= */

/**
 * MUST be your PUBLIC R2 bucket domain.
 * Relative paths WILL break on Cloudflare Pages.
 */
const R2_INDEX_URLS = [
  "https://pub-jetcube-assets.r2.dev/indexes/_index.json",
  "https://pub-jetcube-assets.r2.dev/indexes/search_index.enriched.json",
];

/* =========================================================
   HELPERS
========================================================= */

function isHtmlResponse(text: string, contentType: string | null): boolean {
  return (
    contentType?.includes("text/html") ||
    text.trim().startsWith("<!DOCTYPE") ||
    text.trim().startsWith("<html")
  );
}

async function fetchJsonStrict(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  const contentType = res.headers.get("content-type");
  const text = await res.text();

  if (isHtmlResponse(text, contentType)) {
    throw new Error(`Expected JSON but got HTML from ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}`);
  }
}

async function fetchFirstWorking(urls: string[]): Promise<any> {
  let lastError: any = null;

  for (const url of urls) {
    try {
      return await fetchJsonStrict(url);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All index fetch attempts failed");
}

function toNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickImage(p: any): string | null {
  const candidates = [
    p?.image,
    p?.image_url,
    p?.main_image,
    p?.thumbnail,
    Array.isArray(p?.images) ? p.images[0] : null,
    Array.isArray(p?.gallery_images) ? p.gallery_images[0] : null,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
    if (c && typeof c === "object") {
      const u = c.url || c.src || c.href || c.hiRes || c.large;
      if (typeof u === "string" && u.trim()) return u;
    }
  }

  return null;
}

/* =========================================================
   HOOK
========================================================= */

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
        const json = await fetchFirstWorking(R2_INDEX_URLS);

        const raw: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? json.items
          : [];

        const normalized: IndexProduct[] = raw
          .map((p: any) => {
            if (typeof p === "string") {
              return {
                handle: p,
                title: p,
                image: null,
              };
            }

            const handle =
              p.handle || p.slug || p.asin || p.id || "";

            if (!handle) return null;

            return {
              ...p,
              handle,
              title: typeof p.title === "string" ? p.title : handle,
              image: pickImage(p),
              price:
                toNumber(p.price ?? p.current_price ?? p.sale_price) ??
                p.price,
              was_price:
                toNumber(p.was_price ?? p.wasPrice ?? p.list_price) ??
                p.was_price,
              rating: toNumber(p.rating) ?? p.rating,
              rating_count:
                toNumber(p.rating_count ?? p.ratingCount) ??
                p.rating_count,
            };
          })
          .filter(Boolean) as IndexProduct[];

        if (!cancelled) {
          setItems(normalized);
        }
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

