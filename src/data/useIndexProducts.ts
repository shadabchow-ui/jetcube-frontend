import { useEffect, useState } from "react";
import { R2_BASE, joinUrl } from "../config/r2";

/* -------------------------------------------------
   Types
------------------------------------------------- */

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

  // IMPORTANT: keep raw image payload (string | object | array)
  image?: any;

  category?: any;
  category_path?: any;
  category_keys?: any;
};

export type UseIndexProductsReturn = {
  items: IndexProduct[];
  loading: boolean;
  error: string | null;
};

/* -------------------------------------------------
   Constants
------------------------------------------------- */

// ✅ where the cards index lives
const INDEX_CARDS_PATH =
  import.meta.env.VITE_INDEX_CARDS_PATH || "/indexes/_index.cards.json.gz";

// optional cache-bust (set to anything when you redeploy indexes)
const INDEX_VERSION = import.meta.env.VITE_INDEX_VERSION || "";

function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

const CARDS_INDEX_URL = (() => {
  const url = joinUrl(R2_BASE, INDEX_CARDS_PATH);
  return INDEX_VERSION ? `${url}?v=${encodeURIComponent(INDEX_VERSION)}` : url;
})();

/* -------------------------------------------------
   Utils
------------------------------------------------- */

async function fetchJsonStrict(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} loading ${url}`);
  }

  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  // Guard against Vite / SPA HTML fallback
  if (
    ct.includes("text/html") ||
    text.trim().startsWith("<!DOCTYPE") ||
    text.trim().startsWith("<html")
  ) {
    throw new Error(`Expected JSON but received HTML from ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON returned from ${url}`);
  }
}

function toNumberMaybe(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/* -------------------------------------------------
   Hook
------------------------------------------------- */

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
        const json = await fetchJsonStrict(CARDS_INDEX_URL);

        if (!Array.isArray(json)) {
          throw new Error("_index.cards.json must be an array");
        }

        const normalized: IndexProduct[] = json
          .map((p: any) => {
            if (!p || typeof p !== "object") return null;

            const handle = p.handle || p.slug || p.asin || p.id || null;
            if (!handle) return null;

            // ✅ DON'T DROP IMAGE DATA:
            // - keep p.image as-is (string/object/array)
            // - also fall back to common alternates
            const imageRaw =
              p.image ?? p.images ?? p.img ?? p.image_url ?? p.primary_image ?? null;

            return {
              handle,
              title: typeof p.title === "string" ? p.title : handle,
              image: imageRaw,
              price: toNumberMaybe(p.price) ?? p.price ?? null,
              was_price: toNumberMaybe(p.was_price) ?? p.was_price ?? null,
              rating: toNumberMaybe(p.rating) ?? p.rating ?? null,
              rating_count: toNumberMaybe(p.rating_count) ?? p.rating_count ?? null,
              category: p.category ?? null,
              category_path: p.category_path ?? null,
              category_keys: p.category_keys ?? null,
            };
          })
          .filter(Boolean) as IndexProduct[];

        if (!cancelled) setItems(normalized);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load cards index");
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
