import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ShardMap = Record<string, string>;

type PdpContextValue = {
  getUrlForSlug: (slug: string) => Promise<string | null>;
  preloadShardForSlug: (slug: string) => Promise<void>;
  lastError: string | null;
  clearError: () => void;
};

const PdpContext = createContext<PdpContextValue | null>(null);

const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_PRODUCTS_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/products/";

// Keep existing INDEX_BASE_URL (some apps use it for other indexes)
const INDEX_BASE_URL =
  (import.meta as any).env?.VITE_INDEX_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/";

// ✅ NEW: point specifically at the new PDP shard directory
const PDP_INDEX_BASE_URL =
  (import.meta as any).env?.VITE_PDP_INDEX_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/pdp2/";

function computeShardForSlug(slug: string): string {
  const s = (slug || "").trim().toLowerCase();
  if (!s) return "_";

  // Special-case leading underscore buckets (optional)
  if (s.startsWith("_")) return "_";

  const first = s[0];
  const isAlnum = (c: string) => /[a-z0-9]/.test(c);

  if (!isAlnum(first)) return "_";

  // 1-char keys -> "a_"
  if (s.length === 1) return `${first}_`;

  const second = s[1];

  // If second is '-' or '_' we use "a-" shard
  if (second === "-" || second === "_") return `${first}-`;

  // If second is alnum we use "ab" shard
  if (isAlnum(second)) return `${first}${second}`;

  // Otherwise fallback "a_"
  return `${first}_`;
}

function normalizeProductUrl(raw: string): string {
  if (!raw) return raw;
  // If shard stores full URL, keep it
  if (/^https?:\/\//i.test(raw)) return raw;

  // Otherwise treat as relative object path like "products/batch-11a/slug.json.gz"
  const rel = raw.replace(/^\/+/, "");
  const base = PRODUCTS_BASE_URL.endsWith("/") ? PRODUCTS_BASE_URL : `${PRODUCTS_BASE_URL}/`;
  // If rel already starts with products/, avoid double "products/products"
  if (rel.startsWith("products/")) {
    // base already includes /products/, so strip leading "products/"
    return `${base}${rel.slice("products/".length)}`;
  }
  return `${base}${rel}`;
}

async function fetchShard(shard: string): Promise<ShardMap> {
  const shardFile = `${shard}.json.gz`;
  const shardUrl = `${PDP_INDEX_BASE_URL}${shardFile}`;

  const res = await fetch(shardUrl, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch shard ${shardFile}: ${res.status}`);
  }

  const json = (await res.json()) as ShardMap;
  return json || {};
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const shardCacheRef = useRef<Map<string, ShardMap>>(new Map());
  const inflightRef = useRef<Map<string, Promise<ShardMap>>>(new Map());

  const [lastError, setLastError] = useState<string | null>(null);

  const clearError = useCallback(() => setLastError(null), []);

  const preloadShardForSlug = useCallback(async (slug: string) => {
    const shard = computeShardForSlug(slug);

    if (shardCacheRef.current.has(shard)) return;

    if (inflightRef.current.has(shard)) {
      await inflightRef.current.get(shard);
      return;
    }

    const p = fetchShard(shard)
      .then((map) => {
        shardCacheRef.current.set(shard, map);
        inflightRef.current.delete(shard);
        return map;
      })
      .catch((err) => {
        inflightRef.current.delete(shard);
        throw err;
      });

    inflightRef.current.set(shard, p);
    await p;
  }, []);

  const getUrlForSlug = useCallback(
    async (slug: string): Promise<string | null> => {
      const clean = (slug || "").trim();
      if (!clean) return null;

      const shard = computeShardForSlug(clean);

      try {
        let map = shardCacheRef.current.get(shard);

        if (!map) {
          await preloadShardForSlug(clean);
          map = shardCacheRef.current.get(shard);
        }

        const raw = map?.[clean];
        if (!raw) return null;

        return normalizeProductUrl(raw);
      } catch (e: any) {
        const msg = e?.message || String(e);
        setLastError(msg);
        return null;
      }
    },
    [preloadShardForSlug]
  );

  const value = useMemo<PdpContextValue>(
    () => ({
      getUrlForSlug,
      preloadShardForSlug,
      lastError,
      clearError,
    }),
    [getUrlForSlug, preloadShardForSlug, lastError, clearError]
  );

  return <PdpContext.Provider value={value}>{children}</PdpContext.Provider>;
}

export function useProductPdp() {
  const ctx = useContext(PdpContext);
  if (!ctx) {
    throw new Error("useProductPdp must be used within ProductPdpProvider");
  }
  return ctx;
}









 













 





