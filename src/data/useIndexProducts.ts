import { useEffect, useMemo, useState } from "react";
import pako from "pako";

export type IndexProduct = {
  slug?: string;
  handle?: string;
  url_slug?: string;

  title?: string;
  name?: string;

  brand?: string;
  vendor?: string;

  category?: string;

  image?: string | null;
  image_url?: string | null;

  price?: number | string | null;
  currency?: string | null;

  searchable?: string;
};

export type ProductCardData = {
  slug: string;
  title: string;
  brand?: string;
  category?: string;
  image?: string | null;
  price?: string | null;
};

const INDEX_URL = "/indexes/_index.cards.json";

function firstString(...vals: any[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function looksLikeGzip(bytes: Uint8Array) {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

async function fetchJsonPossiblyGzipped(url: string): Promise<any> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
  }

  // IMPORTANT: do NOT use res.text() here; the payload is gzipped bytes.
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  let text: string;
  try {
    if (looksLikeGzip(bytes)) {
      const inflated = pako.ungzip(bytes);
      text = new TextDecoder("utf-8").decode(inflated);
    } else {
      text = new TextDecoder("utf-8").decode(bytes);
    }
  } catch (e) {
    // If something weird happens, last resort try text()
    text = await res.text();
  }

  const trimmed = text.trim();

  // Small safety: if Cloudflare ever returns HTML error pages, this helps debugging.
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new Error(`Expected JSON but received HTML from ${url}`);
  }

  try {
    return JSON.parse(trimmed);
  } catch (e: any) {
    // include a tiny preview to help diagnose if needed
    const preview = trimmed.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`Invalid JSON from ${url}: ${e?.message || e}. Preview: ${preview}`);
  }
}

function normalizeItem(raw: IndexProduct): ProductCardData | null {
  if (!raw || typeof raw !== "object") return null;

  const slug =
    firstString(raw.slug, raw.handle, raw.url_slug) ??
    "";

  const title =
    firstString(raw.title, raw.name) ??
    "";

  if (!slug || !title) return null;

  const brand = firstString(raw.brand, raw.vendor);
  const category = firstString(raw.category);
  const image = (firstString(raw.image, raw.image_url) ?? null) as string | null;

  let price: string | null = null;
  if (raw.price !== undefined && raw.price !== null) {
    if (typeof raw.price === "number") price = String(raw.price);
    else if (typeof raw.price === "string" && raw.price.trim()) price = raw.price.trim();
  }

  return { slug, title, brand, category, image, price };
}

export function useIndexProducts() {
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchJsonPossiblyGzipped(INDEX_URL);

        // Your index might be either an array OR an object wrapper
        const arr: IndexProduct[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const normalized = arr
          .map(normalizeItem)
          .filter(Boolean) as ProductCardData[];

        if (!cancelled) {
          setItems(normalized);
        }
      } catch (e: any) {
        if (!cancelled) {
          setItems([]);
          setError(e?.message || String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const bySlug = useMemo(() => {
    const m = new Map<string, ProductCardData>();
    for (const p of items) m.set(p.slug, p);
    return m;
  }, [items]);

  return { items, bySlug, loading, error };
}
