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
 * - VITE_R2_PUBLIC_BASE_URL: e.g. https://pub-xxxx.r2.dev
 * - VITE_R2_PRODUCTS_BASE_URL: optional override (defaults to {public}/products)
 * - VITE_R2_INDEX_BASE_URL: optional override (defaults to {public}/indexes)
 */
const PUBLIC_R2_BASE_URL =
  (import.meta as any).env?.VITE_R2_PUBLIC_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_R2_PRODUCTS_BASE_URL ||
  `${PUBLIC_R2_BASE_URL}/products`;

const INDEX_BASE_URL =
  (import.meta as any).env?.VITE_R2_INDEX_BASE_URL ||
  `${PUBLIC_R2_BASE_URL}/indexes`;

/**
 * Prefer a single map if present:
 * - /indexes/pdp_path_map.json.gz
 *
 * Otherwise fallback to shard maps:
 * - /indexes/pdp2/{shard}.json.gz
 *
 * To tolerate stale builds, we also try the legacy folder:
 * - /indexes/pdp_paths/{shard}.json(.gz)
 */
const PDP_PATH_MAP_URLS = [
  `${INDEX_BASE_URL}/pdp_path_map.json.gz`,
  `${INDEX_BASE_URL}/pdp_path_map.json`,
];

const PDP_SHARD_BASE_URLS = [
  `${INDEX_BASE_URL}/pdp2/`,
  `${INDEX_BASE_URL}/pdp_paths/`,
];

function isAbsoluteUrl(s: string) {
  return /^https?:\/\//i.test(s);
}

function normalizeProductUrl(raw: string) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  if (isAbsoluteUrl(trimmed)) return trimmed;

  const clean = trimmed.replace(/^\//, "");
  return `${PRODUCTS_BASE_URL}/${clean}`;
}

async function fetchJsonMaybeGzip(url: string): Promise<any> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${url}`);
  }

  const contentEncoding = (res.headers.get("content-encoding") || "").toLowerCase();
  const isGz = url.endsWith(".gz") || contentEncoding.includes("gzip");

  if (!isGz) {
    return await res.json();
  }

  // If server sets Content-Encoding: gzip, fetch auto-decompresses and res.json() works.
  try {
    return await res.json();
  } catch {
    // If it's truly a raw *.gz without Content-Encoding, decompress in the browser.
  }

  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS || !res.body) {
    const txt = await res.text();
    return JSON.parse(txt);
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
        const urls = [`${base}${key}.json.gz`, `${base}${key}.json`];
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

      // 3) Last resort (will 404 with your current batch layout, but avoids crashing)
      return `${PRODUCTS_BASE_URL}/${s}.json.gz`;
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








 













 





