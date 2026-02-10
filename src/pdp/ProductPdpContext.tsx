import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type AnyRecord = Record<string, any>;
type UrlMap = Record<string, string>;

type ProductPdpContextValue = {
  /** Resolve a PDP slug to a concrete product JSON URL in R2 */
  getUrlForSlug: (slug: string) => Promise<string>;
  /** Preload the relevant index shard (and/or global map) for a slug */
  preloadShardForSlug: (slug: string) => Promise<void>;
  /** Fetch + parse the product JSON for a slug (handles *.json.gz) */
  fetchProductBySlug: (slug: string) => Promise<{ url: string; data: AnyRecord }>;
  /** Last error message (if any) */
  lastError: string | null;
  /** Clear last error */
  clearError: () => void;
};

const ProductPdpContext = createContext<ProductPdpContextValue | null>(null);

/**
 * Base URLs
 *
 * Supported envs (you asked for these):
 * - VITE_PRODUCTS_BASE_URL: e.g. https://pub-xxxx.r2.dev/products/
 * - VITE_PDP_INDEX_BASE_URL: e.g. https://pub-xxxx.r2.dev/indexes/pdp2/
 *
 * Also supported (optional/back-compat):
 * - VITE_R2_PUBLIC_BASE_URL: e.g. https://pub-xxxx.r2.dev
 * - VITE_R2_PRODUCTS_BASE_URL: override products base (no trailing slash required)
 * - VITE_R2_INDEX_BASE_URL: override indexes base (no trailing slash required)
 */
const ENV = (import.meta as any).env || {};

const PUBLIC_R2_BASE_URL =
  ENV.VITE_R2_PUBLIC_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

// ✅ user-requested name supported first
const PRODUCTS_BASE_URL =
  ENV.VITE_PRODUCTS_BASE_URL ||
  ENV.VITE_R2_PRODUCTS_BASE_URL ||
  `${PUBLIC_R2_BASE_URL}/products/`;

// Keep an indexes root too
const INDEX_BASE_URL =
  ENV.VITE_R2_INDEX_BASE_URL ||
  `${PUBLIC_R2_BASE_URL}/indexes/`;

// ✅ user-requested name supported (shard folder base)
const PDP_INDEX_BASE_URL =
  ENV.VITE_PDP_INDEX_BASE_URL ||
  `${INDEX_BASE_URL}pdp2/`;

/**
 * Prefer a single map if present:
 * - /indexes/pdp_path_map.json.gz
 *
 * Otherwise fallback to shard maps:
 * - /indexes/pdp2/{shard}.json.gz
 *
 * Optional legacy fallback:
 * - /indexes/pdp_paths/{shard}.json(.gz)
 */
const PDP_PATH_MAP_URLS = [
  `${INDEX_BASE_URL}pdp_path_map.json.gz`,
  `${INDEX_BASE_URL}pdp_path_map.json`,
];

const PDP_SHARD_BASE_URLS = [
  PDP_INDEX_BASE_URL,              // /indexes/pdp2/
  `${INDEX_BASE_URL}pdp2/`,        // also try explicit
  `${INDEX_BASE_URL}pdp_paths/`,   // legacy
];

function isAbsoluteUrl(s: string) {
  return /^https?:\/\//i.test(s);
}

function normalizeProductUrl(raw: string) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";

  if (isAbsoluteUrl(trimmed)) return trimmed;

  // allow either "batch-x/slug.json.gz" or "/products/batch-x/slug.json.gz"
  const clean = trimmed.replace(/^\//, "");
  const base = PRODUCTS_BASE_URL.endsWith("/") ? PRODUCTS_BASE_URL : `${PRODUCTS_BASE_URL}/`;
  return `${base}${clean.replace(/^products\//, "")}`;
}

async function fetchJsonMaybeGzip(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${url}`);
  }

  const contentEncoding = (res.headers.get("content-encoding") || "").toLowerCase();
  const isGz = url.endsWith(".gz") || contentEncoding.includes("gzip");

  // If not gz, normal JSON
  if (!isGz) return await res.json();

  // If server properly sets Content-Encoding: gzip, fetch auto-decompresses and res.json() works.
  try {
    return await res.json();
  } catch {
    // Continue to manual gzip decode below
  }

  // Manual gzip decode using DecompressionStream (Chrome/Edge supported).
  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS || !res.body) {
    // This will fail if the response is raw gzip bytes, but we give a clear error.
    throw new Error(
      `This *.json.gz was served without Content-Encoding:gzip and this browser can't decompress it. ` +
        `Fix: upload with Content-Encoding:gzip OR serve uncompressed JSON. URL: ${url}`
    );
  }

  const ds = new DS("gzip");
  const decompressed = new Response(res.body.pipeThrough(ds));
  const text = await decompressed.text();
  return JSON.parse(text);
}

function computeShardForSlug(slug: string) {
  const s = (slug || "").trim().toLowerCase();
  if (!s) return "";

  // digit-hyphen: "0-xxxxx" -> "0-"
  if (/^\d-/.test(s)) return `${s[0]}-`;

  // two-digit prefix shards (optional future): "00..." -> "00"
  if (/^\d\d/.test(s)) return s.slice(0, 2);

  // single leading digit: "0abc..." -> "0"
  if (/^\d/.test(s)) return s[0];

  // fallback: first character
  return s[0];
}

async function tryFetchMap(urls: string[]): Promise<UrlMap | null> {
  for (const url of urls) {
    try {
      const obj = await fetchJsonMaybeGzip(url);
      if (obj && typeof obj === "object") return obj as UrlMap;
    } catch {
      // try next
    }
  }
  return null;
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [lastError, setLastError] = useState<string | null>(null);

  const clearError = useCallback(() => setLastError(null), []);

  // Global map (slug -> full URL)
  const pathMapRef = useRef<Map<string, string> | null>(null);
  const pathMapInflightRef = useRef<Promise<Map<string, string>> | null>(null);

  // Shard cache (shard -> map)
  const shardCacheRef = useRef<Map<string, Map<string, string>>>(new Map());
  const shardInflightRef = useRef<Map<string, Promise<Map<string, string>>>>(
    new Map()
  );

  const loadPathMap = useCallback(async () => {
    if (pathMapRef.current) return pathMapRef.current;
    if (pathMapInflightRef.current) return pathMapInflightRef.current;

    pathMapInflightRef.current = (async () => {
      const obj = await tryFetchMap(PDP_PATH_MAP_URLS);
      const m = new Map<string, string>();
      if (obj) {
        for (const [k, v] of Object.entries(obj)) {
          if (typeof k === "string" && typeof v === "string" && v.trim()) {
            m.set(k, normalizeProductUrl(v));
          }
        }
      }
      pathMapRef.current = m;
      return m;
    })();

    return pathMapInflightRef.current;
  }, []);

  const loadShard = useCallback(async (shard: string) => {
    const key = (shard || "").trim().toLowerCase();
    if (!key) return new Map<string, string>();

    const cached = shardCacheRef.current.get(key);
    if (cached) return cached;

    const inflight = shardInflightRef.current.get(key);
    if (inflight) return inflight;

    const p = (async () => {
      for (const base of PDP_SHARD_BASE_URLS) {
        const baseClean = base.endsWith("/") ? base : `${base}/`;
        const urls = [`${baseClean}${key}.json.gz`, `${baseClean}${key}.json`];
        const obj = await tryFetchMap(urls);
        if (obj) {
          const m = new Map<string, string>();
          for (const [k, v] of Object.entries(obj)) {
            if (typeof k === "string" && typeof v === "string" && v.trim()) {
              m.set(k, normalizeProductUrl(v));
            }
          }
          shardCacheRef.current.set(key, m);
          shardInflightRef.current.delete(key);
          return m;
        }
      }

      // Cache empty to avoid repeated 404 loops
      const empty = new Map<string, string>();
      shardCacheRef.current.set(key, empty);
      shardInflightRef.current.delete(key);
      return empty;
    })();

    shardInflightRef.current.set(key, p);
    return p;
  }, []);

  const preloadShardForSlug = useCallback(
    async (slug: string) => {
      const s = (slug || "").trim();
      if (!s) return;

      // Warm global map in the background (safe if missing)
      void loadPathMap();

      // Also warm shard map
      const shard = computeShardForSlug(s);
      if (shard) void loadShard(shard);
    },
    [loadPathMap, loadShard]
  );

  const getUrlForSlug = useCallback(
    async (slug: string) => {
      const s = (slug || "").trim();
      if (!s) return "";

      // 1) Global map (best)
      try {
        const pm = await loadPathMap();
        const fromGlobal = pm.get(s);
        if (fromGlobal) return fromGlobal;
      } catch {
        // ignore
      }

      // 2) Shard lookup
      const shard = computeShardForSlug(s);
      try {
        const shardMap = await loadShard(shard);
        const fromShard = shardMap.get(s);
        if (fromShard) return fromShard;
      } catch {
        // ignore
      }

      // 3) Last resort
      const base = PRODUCTS_BASE_URL.endsWith("/") ? PRODUCTS_BASE_URL : `${PRODUCTS_BASE_URL}/`;
      return `${base}${s}.json.gz`;
    },
    [loadPathMap, loadShard]
  );

  const fetchProductBySlug = useCallback(
    async (slug: string) => {
      const url = await getUrlForSlug(slug);
      if (!url) throw new Error("Missing slug");

      try {
        const data = await fetchJsonMaybeGzip(url);
        return { url, data };
      } catch (e: any) {
        setLastError(e?.message || "Failed to load product JSON");
        throw e;
      }
    },
    [getUrlForSlug]
  );

  const value = useMemo<ProductPdpContextValue>(
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
    <ProductPdpContext.Provider value={value}>{children}</ProductPdpContext.Provider>
  );
}

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdp must be used inside ProductPdpProvider");
  return ctx;
}










 













 





