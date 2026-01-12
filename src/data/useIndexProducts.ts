import { useEffect, useState } from "react";
import { ungzip } from "pako";

type IndexProduct = {
  handle?: string;
  slug?: string;
  title?: string;
  image?: string;
  image_url?: string;
  main_image?: string;
  images?: string[];
  gallery?: string[];
  price?: number;
  was_price?: number;
  rating?: number;
  rating_count?: number;
  badge?: string;
  category?: string;
  category_path?: string[];
  [key: string]: any;
};

export function useIndexProducts() {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/indexes/_index.cards.json");

        if (!res.ok) {
          throw new Error(`Index fetch failed: ${res.status}`);
        }

        // ⚠️ Cloudflare serves gzipped bytes without headers
        const buffer = await res.arrayBuffer();

        // Decode gzip explicitly
        const jsonText = ungzip(new Uint8Array(buffer), { to: "string" });
        const data = JSON.parse(jsonText);

        if (!Array.isArray(data)) {
          throw new Error("Index payload is not an array");
        }

        if (!cancelled) {
          setItems(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load index products:", err);
          setError("Failed to load products");
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
