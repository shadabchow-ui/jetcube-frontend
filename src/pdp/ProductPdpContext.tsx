import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Products base URL (actual product JSON .json.gz files)
 */
const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_PRODUCTS_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/products/";

/**
 * Generic indexes base URL
 */
const INDEX_BASE_URL =
  (import.meta as any).env?.VITE_INDEX_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes";

// PDP shard index directory (slug -> product json url)
const PDP_INDEX_BASE_URL =
  (import.meta as any).env?.VITE_PDP_INDEX_BASE_URL || `${INDEX_BASE_URL}/pdp2/`;

type PdpIndexMap = Record<string, string>;

type ProductPdpContextValue = {
  getUrlForSlug: (slug: string) => Promise<string | null>;
  preloadShardForSlug: (slug: string) => Promise<void>;
  hasShardForSlug: (slug: string) => boolean;
  productsBaseUrl: string;
  indexBaseUrl: string;
};

const ProductPdpContext = createContext<ProductPdpContextValue | null>(null);

function shardKeyForSlug(slug: string): string {
  if (!slug) return "_";
  const first = slug[0].toLowerCase();
  if (first >= "0" && first <= "9") return `${first}-`;
  if (first >= "a" && first <= "z") return first;
  return "_";
}

async function fetchGzipJson(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await res.json();
  }

  // If it's gzipped, most browsers still won't auto-decompress for JSON parsing
  // unless served with correct headers. We handle both:
  const buf = await res.arrayBuffer();

  // Try to decode as text and JSON parse (works if the server auto-decompressed)
  try {
    const text = new TextDecoder("utf-8").decode(buf);
    return JSON.parse(text);
  } catch {
    // If it is truly gzip-compressed bytes, we need a decompressor.
    // Modern browsers support DecompressionStream.
    if (typeof (window as any).DecompressionStream === "function") {
      const ds = new (window as any).DecompressionStream("gzip");
      const stream = new Blob([buf]).stream().pipeThrough(ds);
      const decompressed = await new Response(stream).arrayBuffer();
      const text = new TextDecoder("utf-8").decode(decompressed);
      return JSON.parse(text);
    }
    throw new Error(
      `Unable to parse JSON from ${url}. Server may be returning gzip bytes without decompression support.`
    );
  }
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const shardCacheRef = useRef<Map<string, PdpIndexMap>>(new Map());
  const inflightRef = useRef<Map<string, Promise<PdpIndexMap>>>(new Map());
  const [loadedShards, setLoadedShards] = useState<Set<string>>(new Set());

  const loadShard = useCallback(async (shardKey: string): Promise<PdpIndexMap> => {
    const cached = shardCacheRef.current.get(shardKey);
    if (cached) return cached;

    const inflight = inflightRef.current.get(shardKey);
    if (inflight) return inflight;

    const p = (async () => {
      // NOTE: shards are now under indexes/pdp2/
      const shardUrl = `${PDP_INDEX_BASE_URL}${shardKey}.json.gz`;
      const json = await fetchGzipJson(shardUrl);

      // shard JSON is expected to be { slug: "https://.../products/batch-..../slug.json.gz" }
      const map: PdpIndexMap = json || {};
      shardCacheRef.current.set(shardKey, map);

      setLoadedShards((prev) => {
        const next = new Set(prev);
        next.add(shardKey);
        return next;
      });

      return map;
    })();

    inflightRef.current.set(shardKey, p);
    try {
      return await p;
    } finally {
      inflightRef.current.delete(shardKey);
    }
  }, []);

  const preloadShardForSlug = useCallback(
    async (slug: string) => {
      const key = shardKeyForSlug(slug);
      await loadShard(key);
    },
    [loadShard]
  );

  const hasShardForSlug = useCallback(
    (slug: string) => {
      const key = shardKeyForSlug(slug);
      return loadedShards.has(key);
    },
    [loadedShards]
  );

  const getUrlForSlug = useCallback(
    async (slug: string): Promise<string | null> => {
      const key = shardKeyForSlug(slug);
      const shard = await loadShard(key);

      const direct = shard?.[slug];
      if (direct) return direct;

      // Backward-compat: if a shard stored a relative path, normalize to absolute
      const rel = shard?.[slug];
      if (rel && typeof rel === "string" && !rel.startsWith("http")) {
        const cleaned = rel.replace(/^\/+/, "");
        // If it already starts with products/, resolve against the products base
        if (cleaned.startsWith("products/")) {
          return `${PRODUCTS_BASE_URL}${cleaned.replace(/^products\//, "")}`;
        }
        // Otherwise treat as under products/
        return `${PRODUCTS_BASE_URL}${cleaned}`;
      }

      return null;
    },
    [loadShard]
  );

  const value = useMemo<ProductPdpContextValue>(
    () => ({
      getUrlForSlug,
      preloadShardForSlug,
      hasShardForSlug,
      productsBaseUrl: PRODUCTS_BASE_URL,
      indexBaseUrl: INDEX_BASE_URL,
    }),
    [getUrlForSlug, preloadShardForSlug, hasShardForSlug]
  );

  return <ProductPdpContext.Provider value={value}>{children}</ProductPdpContext.Provider>;
}

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdp must be used within ProductPdpProvider");
  return ctx;
}









 













 





