import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

type PdpContextType = {
  getUrlForSlug: (slug: string) => Promise<string | null>;
  preloadShardForSlug: (slug: string) => Promise<void>;
  lastError: string | null;
  clearError: () => void;
};

const ProductPdpContext = createContext<PdpContextType | null>(null);

// ---- CONFIG ----
// Base URL where shards live (your bucket path already includes `indexes/`)
const INDEX_BASE_URL =
  (import.meta as any).env?.VITE_INDEX_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes";

// Base URL where product JSON lives (used only if shard values are relative paths)
const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_PRODUCTS_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";
// ----------------

type ShardMap = Record<string, string>;

// In-memory shard cache so we don’t refetch the same shard over and over
const SHARD_CACHE: Map<string, ShardMap> = new Map();

/**
 * Your generator uses TWO-LETTER shard keys:
 * - first 2 letters of the slug, lowercased
 * - if not alpha (or too short), shard = "xx"
 *
 * Examples:
 *  "fringe-cowboy..." -> "fr"
 *  "zzheels-..."      -> "zz"
 *  "1-something"      -> "xx"
 */
function getShardKey(slug: string): string {
  const s = (slug || "").trim().toLowerCase();
  if (s.length < 2) return "xx";
  const key = s.slice(0, 2);
  return /^[a-z]{2}$/.test(key) ? key : "xx";
}

async function fetchShard(shardKey: string): Promise<ShardMap> {
  if (SHARD_CACHE.has(shardKey)) return SHARD_CACHE.get(shardKey)!;

  const url = `${INDEX_BASE_URL}/pdp_paths/${shardKey}.json`;

  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch shard ${shardKey}: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as ShardMap;
  SHARD_CACHE.set(shardKey, json);
  return json;
}

/**
 * Normalize whatever is stored in the shard value:
 * - If it's absolute (http/https), return a safely-encoded URL (handles spaces)
 * - If it's relative, resolve against PRODUCTS_BASE_URL
 */
function normalizeProductUrl(rawPathOrUrl: string): string {
  const raw = (rawPathOrUrl || "").trim();
  if (!raw) return raw;

  // Absolute URL
  if (/^https?:\/\//i.test(raw)) {
    // encodeURI keeps URL structure but encodes spaces and other unsafe chars
    return encodeURI(raw);
  }

  // Relative path (e.g. "products/batch-1a/part_03/foo.json.gz")
  const cleaned = raw.replace(/^\//, "");
  return new URL(cleaned, PRODUCTS_BASE_URL.endsWith("/") ? PRODUCTS_BASE_URL : `${PRODUCTS_BASE_URL}/`).toString();
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [lastError, setLastError] = useState<string | null>(null);

  const clearError = useCallback(() => setLastError(null), []);

  const preloadShardForSlug = useCallback(async (slug: string) => {
    try {
      const shardKey = getShardKey(slug);
      await fetchShard(shardKey);
    } catch (e: any) {
      setLastError(e?.message || String(e));
    }
  }, []);

  const getUrlForSlug = useCallback(async (slug: string): Promise<string | null> => {
    try {
      const shardKey = getShardKey(slug);
      const shard = await fetchShard(shardKey);

      const raw = shard[slug];
      if (!raw) return null;

      return normalizeProductUrl(raw);
    } catch (e: any) {
      setLastError(e?.message || String(e));
      return null;
    }
  }, []);

  const value = useMemo<PdpContextType>(
    () => ({
      getUrlForSlug,
      preloadShardForSlug,
      lastError,
      clearError,
    }),
    [getUrlForSlug, preloadShardForSlug, lastError, clearError]
  );

  return <ProductPdpContext.Provider value={value}>{children}</ProductPdpContext.Provider>;
}

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdp must be used within ProductPdpProvider");
  return ctx;
}








