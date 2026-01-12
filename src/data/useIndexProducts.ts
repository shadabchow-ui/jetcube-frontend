import { useEffect, useState } from "react";
import { ungzip } from "pako";

export type IndexProduct = {
  handle: string;
  title: string;
  image: string | null;
  price?: number;
  was_price?: number;
  rating?: number;
  rating_count?: number;
};

const INDEX_URL = "/indexes/_index.cards.json";

function isGzip(buf: Uint8Array) {
  return buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

function normalizeProduct(raw: any): IndexProduct | null {
  const handle =
    raw.handle ||
    raw.slug ||
    raw.id ||
    raw.sku ||
    null;

  if (!handle) return null;

  const image =
    raw.image ||
    raw.image_url ||
    raw.main_image ||
    (Array.isArray(raw.images) ? raw.images[0] : null) ||
    (Array.isArray(raw.gallery) ? raw.gallery[0] : null) ||
    null;

  return {
    handle,
    title: raw.title || raw.name || handle,
    image,
    price: raw.price,
    was_price: raw.was_price,
    rating: raw.rating,
    rating_count: raw.rating_count,
  };
}

export function useIndexProducts() {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(INDEX_URL, { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`Index fetch failed: ${res.status}`);
        }

        const buffer = new Uint8Array(await res.arrayBuffer());

        let jsonText: string;

        if (isGzip(buffer)) {
          jsonText = new TextDecoder().decode(ungzip(buffer));
        } else {
          jsonText = new TextDecoder().decode(buffer);
        }

        let data: any;
        try {
          data = JSON.parse(jsonText);
        } catch {
          throw new Error("Index payload is not valid JSON");
        }

        let rawItems: any[] = [];

        if (Array.isArray(data)) rawItems = data;
        else if (Array.isArray(data.items)) rawItems = data.items;
        else if (Array.isArray(data.cards)) rawItems = data.cards;
        else if (Array.isArray(data.index)) rawItems = data.index;
        else throw new Error("Unknown index structure");

        const normalized = rawItems
          .map(normalizeProduct)
          .filter(Boolean) as IndexProduct[];

        if (!cancelled) {
          setItems(normalized);
          setError(null);
        }
      } catch (err: any) {
        console.error("Index load error:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load index");
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


