import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

// --- Types ---
type AnyRecord = Record<string, any>;
type ShardMap = Record<string, string>;

type ProductPdpContextValue = {
  /** Resolve a PDP slug to a concrete product JSON URL in R2 */
  getUrlForSlug: (slug: string) => Promise<string | null>;
  /** Preload the relevant index shard for a slug */
  preloadShardForSlug: (slug: string) => Promise<void>;
  /** Fetch + parse the product JSON for a slug */
  fetchProductBySlug: (slug: string) => Promise<{ url: string; data: AnyRecord }>;
  /** Last error message (if any) */
  lastError: string | null;
  /** Clear last error */
  clearError: () => void;
};

const ProductPdpContext = createContext<ProductPdpContextValue | null>(null);

// --- Configuration ---
const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_R2_PRODUCTS_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/products/";

const PDP_INDEX_BASE_URL =
  (import.meta as any).env?.VITE_PDP_INDEX_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/pdp2/";

// --- Helpers ---

function computeShardForSlug(slug: string): string {
  const s = (slug || "").trim().toLowerCase();
  if (!s) return "_";

  const first = s[0];
  if (!/[a-z0-9]/.test(first)) return "_";
  if (s.length === 1) return `${first}_`;

  const second = s[1];
  if (second === "-" || second === "_") return `${first}-`;
  if (/[a-z0-9]/.test(second)) return `${first}${second}`;

  return `${first}_`;
}

function normalizeProductUrl(raw: string): string {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  // Clean relative path: remove leading slashes and "products/" prefix if present
  const rel = raw.replace(/^\/+/, "").replace(/^products\//, "");
  const base = PRODUCTS_BASE_URL.endsWith("/") ? PRODUCTS_BASE_URL : `${PRODUCTS_BASE_URL}/`;
  return `${base}${rel}`;
}

async function fetchJsonSafe(url: string): Promise<any> {
  // CRITICAL: "no-store" bypasses the stuck cache that was causing your issues.
  // We do NOT use manual GZIP decompression here because the browser handles 
  // Content-Encoding: gzip automatically. Manual streams caused the crash.
  const res = await fetch(url, { cache: "no-store" });
  
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

// --- Provider ---

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [lastError, setLastError] = useState<string | null>(null);
  const clearError = useCallback(() => setLastError(null), []);

  // Cache for shards: slug -> URL
  const shardCacheRef = useRef<Map<string, ShardMap>>(new Map());
  const inflightRef = useRef<Map<string, Promise<ShardMap>>>(new Map());

  const preloadShardForSlug = useCallback(async (slug: string) => {
    const shard = computeShardForSlug(slug);

    if (shardCacheRef.current.has(shard)) return;
    if (inflightRef.current.has(shard)) {
      await inflightRef.current.get(shard);
      return;
    }

    // Construct URL for the shard file
    const shardUrl = `${PDP_INDEX_BASE_URL}${shard}.json.gz`;

    const p = fetchJsonSafe(shardUrl)
      .then((data) => {
        shardCacheRef.current.set(shard, data || {});
        inflightRef.current.delete(shard);
        return data;
      })
      .catch((err) => {
        inflightRef.current.delete(shard);
        console.warn(`Shard load failed for ${shard}:`, err);
        // Cache empty so we don't loop forever
        shardCacheRef.current.set(shard, {});
        return {};
      });

    inflightRef.current.set(shard, p);
    await p;
  }, []);

  const getUrlForSlug = useCallback(
    async (slug: string): Promise<string | null> => {
      const clean = (slug || "").trim();
      if (!clean) return null;

      const shard = computeShardForSlug(clean);

      // Ensure shard is loaded
      if (!shardCacheRef.current.has(shard)) {
        await preloadShardForSlug(clean);
      }

      const map = shardCacheRef.current.get(shard);
      const rawPath = map?.[clean];

      if (!rawPath) return null;
      return normalizeProductUrl(rawPath);
    },
    [preloadShardForSlug]
  );

  const fetchProductBySlug = useCallback(
    async (slug: string) => {
      try {
        const url = await getUrlForSlug(slug);
        
        if (!url) {
          // If not found in shard, try fallback direct URL (just in case)
          const fallbackUrl = `${PRODUCTS_BASE_URL}${slug}.json.gz`;
           // Check if fallback exists by trying to fetch it
           try {
             const data = await fetchJsonSafe(fallbackUrl);
             return { url: fallbackUrl, data };
           } catch {
             throw new Error(`Product not found in index for slug: ${slug}`);
           }
        }

        const data = await fetchJsonSafe(url);
        return { url, data };
      } catch (e: any) {
        setLastError(e.message);
        throw e;
      }
    },
    [getUrlForSlug]
  );

  const value = useMemo(
    () => ({
      getUrlForSlug,
      preloadShardForSlug,
      fetchProductBySlug,
      lastError,
      clearError,
    }),
    [getUrlForSlug, preloadShardForSlug, fetchProductBySlug, lastError, clearError]
  );

  return (
    <ProductPdpContext.Provider value={value}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) {
    throw new Error("useProductPdp must be used within ProductPdpProvider");
  }
  return ctx;
}








 













 





