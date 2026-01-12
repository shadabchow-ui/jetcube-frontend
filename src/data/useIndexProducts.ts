import { useEffect, useMemo, useState } from "react";
import pako from "pako";

export type IndexProduct = {
  // common identity fields across old/new pipelines
  handle?: string;
  slug?: string;
  url_slug?: string;

  title?: string;
  name?: string;

  // image field variations
  imageUrl?: string | null;
  image?: string | null;
  image_url?: string | null;
  image_src?: string | null;

  brand?: string;
  category?: string;
  category_path?: string;

  // optional precomputed search blob
  searchable?: string;
};

type HookState = {
  items: IndexProduct[];
  loading: boolean;
  error: string | null;
};

const SEARCH_INDEX_VERSION = import.meta.env.VITE_SEARCH_INDEX_VERSION || "";

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function firstNonEmpty(...vals: unknown[]): string {
  for (const v of vals) {
    const s = safeStr(v).trim();
    if (s) return s;
  }
  return "";
}

function stripToJson(text: string): string {
  const t = text.trimStart();

  // handle XSSI guards like ")]}',\n"
  const xssi = t.startsWith(")]}',") ? t.slice(t.indexOf("\n") + 1) : t;

  // try to slice from first { or [ to last } or ]
  const startObj = xssi.indexOf("{");
  const startArr = xssi.indexOf("[");
  const start =
    startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr);

  if (start === -1) return xssi;

  const endObj = xssi.lastIndexOf("}");
  const endArr = xssi.lastIndexOf("]");
  const end = Math.max(endObj, endArr);

  if (end === -1 || end <= start) return xssi.slice(start);

  return xssi.slice(start, end + 1);
}

function coerceToArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.cards)) return data.cards;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
}

function normalizeItem(raw: any): IndexProduct | null {
  if (!raw || typeof raw !== "object") return null;

  const handle = firstNonEmpty(raw.handle, raw.slug, raw.url_slug);
  const title = firstNonEmpty(raw.title, raw.name);
  const imageUrl = firstNonEmpty(raw.imageUrl, raw.image, raw.image_url, raw.image_src);
  const brand = firstNonEmpty(raw.brand);
  const category = firstNonEmpty(raw.category);
  const category_path = firstNonEmpty(raw.category_path);

  const searchable =
    firstNonEmpty(raw.searchable) ||
    [title, brand, category, category_path, handle].filter(Boolean).join(" ").toLowerCase();

  return {
    handle: raw.handle,
    slug: raw.slug,
    url_slug: raw.url_slug,

    title,
    name: raw.name,

    imageUrl: imageUrl || null,
    image: raw.image ?? null,
    image_url: raw.image_url ?? null,
    image_src: raw.image_src ?? null,

    brand,
    category,
    category_path,
    searchable,
  };
}

async function fetchIndexText(url: string): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      // helps some edges not serve odd encodings
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Index fetch failed (${res.status})`);
  }

  const buf = new Uint8Array(await res.arrayBuffer());

  // If Cloudflare served raw gzip bytes (no content-encoding header),
  // the payload starts with gzip magic 1F 8B.
  const isGzip = buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;

  if (isGzip) {
    const out = pako.ungzip(buf);
    return new TextDecoder("utf-8").decode(out);
  }

  // If it’s already decompressed (normal case), decode as UTF-8.
  return new TextDecoder("utf-8").decode(buf);
}

export function useIndexProducts(): HookState {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    const base = new URL("/indexes/_index.cards.json", window.location.origin).toString();
    return SEARCH_INDEX_VERSION ? `${base}?v=${encodeURIComponent(SEARCH_INDEX_VERSION)}` : base;
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const rawText = await fetchIndexText(url);
        const cleaned = stripToJson(rawText);

        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // last attempt: sometimes there’s a BOM/garbage before JSON
          parsed = JSON.parse(stripToJson(cleaned));
        }

        const arr = coerceToArray(parsed);
        const normalized: IndexProduct[] = [];

        for (const x of arr) {
          const n = normalizeItem(x);
          if (n) normalized.push(n);
        }

        if (!alive) return;

        setItems(normalized);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setItems([]);
        setLoading(false);
        setError(e?.message || "Failed to load index");
      }
    })();

    return () => {
      alive = false;
    };
  }, [url]);

  return { items, loading, error };
}



