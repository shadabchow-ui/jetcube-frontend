// src/data/useIndexProducts.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { ungzip } from "pako";

export type IndexProduct = {
  handle: string;
  slug?: string;
  url_slug?: string;

  title: string;
  brand?: string;
  category?: string;

  image?: string | null;
  image_url?: string | null;

  price?: number | string | null;
  was_price?: number | string | null;

  searchable?: string;
};

type State = {
  items: IndexProduct[];
  loading: boolean;
  error: string | null;
};

function isGzip(bytes: Uint8Array) {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function decodeMaybeGzip(bytes: Uint8Array) {
  // If Cloudflare serves gzip bytes but forgets the header, browsers won't auto-decompress.
  if (isGzip(bytes)) {
    const unzipped = ungzip(bytes);
    return new TextDecoder("utf-8").decode(unzipped);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

function safeString(v: any) {
  return typeof v === "string" ? v : "";
}

function pickHandle(r: any) {
  // accept legacy + new pipelines
  return (
    safeString(r?.handle) ||
    safeString(r?.slug) ||
    safeString(r?.url_slug) ||
    safeString(r?.product_handle) ||
    safeString(r?.id) ||
    ""
  );
}

function pickTitle(r: any) {
  return safeString(r?.title) || safeString(r?.name) || safeString(r?.product_title) || "";
}

function normalizeRecord(r: any): IndexProduct | null {
  const handle = pickHandle(r);
  const title = pickTitle(r);

  // Without these, Home.tsx builds cards from p.handle and HomeRow filters them out.
  if (!handle || !title) return null;

  const image =
    (typeof r?.image_url === "string" && r.image_url) ||
    (typeof r?.image === "string" && r.image) ||
    (typeof r?.primary_image === "string" && r.primary_image) ||
    null;

  return {
    handle,
    slug: safeString(r?.slug) || undefined,
    url_slug: safeString(r?.url_slug) || undefined,

    title,
    brand: safeString(r?.brand) || undefined,
    category: safeString(r?.category) || undefined,

    image: image,
    image_url: image,

    price: r?.price ?? null,
    was_price: r?.was_price ?? r?.compare_at_price ?? null,

    searchable: safeString(r?.searchable) || undefined,
  };
}

async function fetchIndexJson(url: string, signal?: AbortSignal) {
  const res = await fetch(url, {
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    throw new Error(`Index fetch failed: HTTP ${res.status}`);
  }

  const ab = await res.arrayBuffer();
  const bytes = new Uint8Array(ab);

  let text = decodeMaybeGzip(bytes);
  text = text.replace(/^\uFEFF/, "").trim(); // strip BOM just in case

  // If content is still brotli/gzip bytes without headers, JSON.parse will fail here.
  // The gzip case is handled above; for anything else we surface the first chars.
  try {
    return JSON.parse(text);
  } catch (e: any) {
    const preview = text.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(`Invalid JSON from index (${url}). Preview: ${preview}`);
  }
}

export function useIndexProducts() {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const run = async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));

        // IMPORTANT: this must match the path you curl/see in Network:
        // https://ventari.net/indexes/_index.cards.json
        const url = "/indexes/_index.cards.json";

        const json = await fetchIndexJson(url, ac.signal);

        const arr: any[] = Array.isArray(json)
          ? json
          : Array.isArray((json as any)?.items)
          ? (json as any).items
          : Array.isArray((json as any)?.data)
          ? (json as any).data
          : [];

        const items = arr.map(normalizeRecord).filter(Boolean) as IndexProduct[];

        setState({
          items,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (ac.signal.aborted) return;
        setState({
          items: [],
          loading: false,
          error: err?.message ? String(err.message) : "Unknown error",
        });
      }
    };

    run();

    return () => {
      ac.abort();
    };
  }, []);

  return useMemo(
    () => ({
      items: state.items,
      loading: state.loading,
      error: state.error,
    }),
    [state.items, state.loading, state.error]
  );
}
