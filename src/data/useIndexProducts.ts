import { useEffect, useState } from "react";

/* =========================
   Types
========================= */

export type IndexProduct = {
  handle?: string;
  slug?: string;
  asin?: string;
  id?: string;

  title?: string;

  price?: number | string;
  current_price?: number | string;
  sale_price?: number | string;
  list_price?: number | string;
  was_price?: number | string;
  wasPrice?: number | string;

  rating?: number | string;
  rating_count?: number | string;
  ratingCount?: number | string;

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

/* =========================
   Helpers
========================= */

function readUrlFromMaybeObj(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.trim() || null;

  if (typeof v === "object") {
    const anyV = v as any;
    const s =
      anyV?.url ||
      anyV?.src ||
      anyV?.href ||
      anyV?.hiRes ||
      anyV?.large;
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
    if (Array.isArray(anyImgs.images)) {
      return getFirstFromImages(anyImgs.images);
    }
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

/* =========================
   Safe fetch helpers
========================= */

async function fetchJsonSoft(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;

    const text = await res.text();
    const ct = res.headers.get("content-type") || "";

    // Cloudflare / SPA fallback guard
    if (
      ct.includes("text/html") ||
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html")
    ) {
      console.warn(`[index] HTML returned for ${url}, skipping`);
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      console.warn(`[index] Invalid JSON for ${url}`);
      return null;
    }
  } catch {
    return null;
  }
}

async function fetchFirstAvailable(urls: string[]): Promise<any | null> {
  for (const url of urls) {
    const json = await fetchJsonSoft(url);
    if (json) return json;
  }
  return null;
}

/* =========================
   Hook
========================= */

export function useIndexProducts(): UseIndexProductsReturn {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null); // homepage never hard-errors

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const json = await fetchFirstAvailable([
        "/indexes/_index.json",
        "/products/_index.json",
        "/indexes/search_index.enriched.json",
      ]);

      if (cancelled) return;

      if (!json) {
        setItems([]);
        setLoading(false);
        return;
      }

      let arr: any[] = [];
      if (Array.isArray(json)) arr = json;
      else if (json && typeof json === "object" && Array.isArray(json.items)) {
        arr = json.items;
      }

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
            title: typeof p?.title === "string" ? p.title : handle,
            image: pickProductImage(p),
            price:
              toNumberMaybe(
                p?.price ?? p?.current_price ?? p?.sale_price
              ) ??
              (p?.price ?? p?.current_price ?? p?.sale_price),
            was_price:
              toNumberMaybe(
                p?.was_price ?? p?.wasPrice ?? p?.list_price
              ) ??
              (p?.was_price ?? p?.wasPrice ?? p?.list_price),
            rating: toNumberMaybe(p?.rating) ?? p?.rating,
            rating_count:
              toNumberMaybe(p?.rating_count ?? p?.ratingCount) ??
              (p?.rating_count ?? p?.ratingCount),
          } as IndexProduct;
        })
        .filter(
          (x) =>
            x &&
            typeof x === "object" &&
            (x.handle || x.slug || x.asin)
        );

      setItems(normalized);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}

export default useIndexProducts;




