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
  image?: string;

  path?: string;
  category?: string;
  category_keys?: string[];

  brand?: string;
};

/* =========================================================
   HOOK
========================================================= */

export function useIndexProducts() {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/indexes/_index.json", {
          cache: "no-cache",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const text = await res.text();

        if (!text || text.trim().startsWith("<")) {
          throw new Error("Invalid JSON response");
        }

        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
          throw new Error("Index JSON is not an array");
        }

        if (!cancelled) {
          setItems(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load index");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}

export default useIndexProducts;


