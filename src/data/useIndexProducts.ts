import { useEffect, useState } from "react";

/* ============================================================
   Types
   ============================================================ */

export type IndexProduct = {
  handle?: string;
  slug?: string;
  asin?: string;
  id?: string;

  title?: string;

  // pricing
  price?: number | string;
  current_price?: number | string;
  sale_price?: number | string;
  list_price?: number | string;
  was_price?: number | string;
  wasPrice?: number | string;

  rating?: number | string;
  rating_count?: number | string;
  ratingCount?: number | string;

  // images
  image?: any;
  image_url?: any;
  imageUrl?: any;
  thumbnail?: any;
  images?: any;
  gallery_images?: any;

  // passthrough
  [key: string]: any;
};

export type UseIndexProductsReturn = {
  items: IndexProduct[];
  loading: boolean;
  error: string | null;
};

/* ============================================================
   Image helpers (unchanged behavior)
   ============================================================ */

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
    if (first && typeof first === "object") {
      return readUrlFromMaybeObj(first);
    }
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

/* ============================================================
   Number helpers (unchanged behavior)
   ============================================================ */

function toNumberMaybe(v: unknown): number | null {
  if (v === null || v === undefined) return null;

  if (typeof v === "number" && Number.isFinite(v)) return v;

  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

/* ============================================================
   JSON loader (FIXED)
   ============================================================ */

async function fetchIndexJson(): Promise<any[]> {
  const res = await fetch("/indexes/_index.json", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load /indexes/_index.json (${res.status})`);
  }

  const text = await res.text();

  // Guard against SPA fallback (index.html)
  if (text.trim().startsWith("<")) {
    throw new Error("Expected JSON but got HTML for /indexes/_index.json");
  }

  const json = JSON.parse(text);

  if (!Array.isArray(json)) {
    throw new Error("Invalid index format: expected array");
  }

  return json;
}

/* ============================================================
   Hook
   ============================================================ */

export function useIndexProducts(): UseIndexProductsReturn {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const arr = await fetchIndexJson();

        const normalized: IndexProduct[] = arr
          .map((p: any) => {
            if (!p || typeof p !== "object") return null;

            const handle =
              (typeof p.handle === "string" && p.handle) ||
              (typeof p.slug === "string" && p.slug) ||
              (typeof p.asin === "string" && p.asin) ||
              (typeof p.id === "string" && p.id) ||
              "";

            if (!handle) return null;

            return {
              ...p,
              handle,
              image: pickProductImage(p),
              price:
                toNumberMaybe(
                  p.price ?? p.current_price ?? p.sale_price
                ) ??
                p.price ??
                p.current_price ??
                p.sale_price,
              was_price:
                toNumberMaybe(
                  p.was_price ?? p.wasPrice ?? p.list_price
                ) ??
                p.was_price ??
                p.wasPrice ??
                p.list_price,
              rating: toNumberMaybe(p.rating) ?? p.rating,
              rating_count:
                toNumberMaybe(
                  p.rating_count ?? p.ratingCount
                ) ??
                p.rating_count ??
                p.ratingCount,
              title:
                typeof p.title === "string" && p.title
                  ? p.title
                  : handle,
            };
          })
          .filter(Boolean) as IndexProduct[];

        if (!cancelled) {
          setItems(normalized);
        }
      } catch (err: any) {
        console.error("useIndexProducts error:", err);
        if (!cancelled) {
          setError(err?.message || "Failed to load product index");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
