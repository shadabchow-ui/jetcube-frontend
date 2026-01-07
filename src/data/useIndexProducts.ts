import { useEffect, useState } from "react";

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

  image?: string | null;

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

// 🚨 HARD LOCK: cards index ONLY
const CARDS_INDEX_URL = "/indexes/_index.cards.json";

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

            const handle =
              p.handle || p.slug || p.asin || p.id || null;

            if (!handle) return null;

            return {
              handle,
              title: typeof p.title === "string" ? p.title : handle,
              image: typeof p.image === "string" ? p.image : null,
              price:
                toNumberMaybe(p.price) ??
                p.price ??
                null,
              was_price:
                toNumberMaybe(p.was_price) ??
                p.was_price ??
                null,
              rating:
                toNumberMaybe(p.rating) ??
                p.rating ??
                null,
              rating_count:
                toNumberMaybe(p.rating_count) ??
                p.rating_count ??
                null,
              category: p.category ?? null,
              category_path: p.category_path ?? null,
              category_keys: p.category_keys ?? null,
            };
          })
          .filter(Boolean) as IndexProduct[];

        if (!cancelled) {
          setItems(normalized);
        }
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


