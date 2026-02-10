import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import pako from "pako";

/**
 * Product PDP data is stored as gzipped JSON on R2.
 * We resolve slug -> exact product URL via small shard index maps, then fetch + parse the product.
 *
 * IMPORTANT:
 * - The app should NOT try to guess batch folders. Always resolve via an index map first.
 * - If a product URL is *.json.gz and the object is NOT served with Content-Encoding: gzip,
 *   we must decompress manually (pako / DecompressionStream).
 */

type ProductRecord = any;

type ProductPdpContextValue = {
  product: ProductRecord | null;
  isLoading: boolean;
  error: string | null;
  fetchProductBySlug: (slug: string) => Promise<ProductRecord>;
  preloadShardForSlug: (slug: string) => Promise<void>;
};

const ProductPdpContext = createContext<ProductPdpContextValue | null>(null);

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdp must be used inside <ProductPdpProvider />");
  return ctx;
}

/* ============================
   Config
   ============================ */

const PUBLIC_R2_BASE_URL =
  (import.meta as any).env?.VITE_PUBLIC_R2_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

const INDEXES_BASE_URL = `${PUBLIC_R2_BASE_URL}/indexes`;
const PRODUCTS_BASE_URL = `${PUBLIC_R2_BASE_URL}/products`;

// Your current shard folder:
const PDP_SHARD_DIR = "pdp2";

/**
 * Optional legacy/alt maps. If these files do NOT exist, they will just 404 and be ignored.
 * (Leaving them here is fine, but removing them reduces noise + network.)
 */
const PDP_PATH_MAP_URLS: string[] = [
  `${INDEXES_BASE_URL}/pdp_path_map.json.gz`,
  `${INDEXES_BASE_URL}/pdp_paths.json.gz`,
];

/**
 * Shard maps: indexes/pdp2/<shard>.json.gz
 * Each shard file is a JSON object: { "<slug>": "<full product url>" }
 */
const PDP_SHARD_BASE_URLS: string[] = [
  `${INDEXES_BASE_URL}/${PDP_SHARD_DIR}`,
];

/* ============================
   Helpers
   ============================ */

function normalizeSlug(raw: string) {
  const s = (raw ?? "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  // decode URI-encoded segments safely
  try {
    return decodeURIComponent(s).trim().toLowerCase();
  } catch {
    return s.toLowerCase();
  }
}

function computeShardForSlug(slug: string) {
  // Your shards look like: "0-.json.gz", "a-.json.gz", "_a.json.gz", etc.
  const s = normalizeSlug(slug);
  if (!s) return "_a"; // fallback shard

  const c = s[0];
  // Special-case leading underscore to match your existing files: _a.json.gz, _i.json.gz, etc.
  if (c === "_") {
    // second char decides which underscore shard
    const c2 = s[1] ?? "a";
    if (/[a-z0-9]/.test(c2)) return `_${c2}`;
    return "_a";
  }

  // digit or letter shard: "0-", "a-", ...
  if (/[a-z0-9]/.test(c)) return `${c}-`;
  return "_a";
}

function isPlainObject(x: any) {
  return x && typeof x === "object" && !Array.isArray(x);
}

/**
 * Fetch JSON from a URL that may be:
 * - plain JSON
 * - gzipped JSON with Content-Encoding: gzip (browser auto-decompresses)
 * - a *.gz object without Content-Encoding (we must decompress ourselves)
 */
async function fetchJsonMaybeGzip(url: string, signal?: AbortSignal): Promise<any> {
  const res = await fetch(url, { signal, cache: "force-cache" });

  if (!res.ok) {
    const msg = `${res.status} ${res.statusText}`;
    throw new Error(`Fetch failed: ${msg} (${url})`);
  }

  // If server correctly sets Content-Encoding: gzip + Content-Type: application/json,
  // res.json() will just work.
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const ce = (res.headers.get("content-encoding") || "").toLowerCase();
  const looksGz =
    ce.includes("gzip") || url.endsWith(".gz") || ct.includes("gzip") || ct.includes("application/octet-stream");

  // First try the cheap path: if it *isn't* gz (or the browser already decoded), res.json() works.
  if (!looksGz) return res.json();

  // If browser already decoded gzip because Content-Encoding was set, res.json() works too.
  // Try it first (it's fast) and fall back to manual decompress if it throws.
  try {
    return await res.json();
  } catch {
    // manual path
  }

  const buf = await res.arrayBuffer();
  const u8 = new Uint8Array(buf);

  // Prefer DecompressionStream if available (stream-safe), else pako (works everywhere).
  const hasDS = typeof (window as any).DecompressionStream === "function";

  if (hasDS) {
    try {
      const ds = new (window as any).DecompressionStream("gzip");
      const stream = new Blob([u8]).stream().pipeThrough(ds);
      const text = await new Response(stream).text();
      return JSON.parse(text);
    } catch (e) {
      // fall through to pako
    }
  }

  try {
    const out = pako.ungzip(u8, { to: "string" }) as unknown as string;
    return JSON.parse(out);
  } catch (e: any) {
    throw new Error(`Failed to decode gzip JSON (${url}): ${e?.message || String(e)}`);
  }
}

/* ============================
   Index map loading (cached)
   ============================ */

const MAP_CACHE = new Map<string, Record<string, string>>();
const MAP_INFLIGHT = new Map<string, Promise<Record<string, string>>>();

async function tryFetchMap(url: string, signal?: AbortSignal) {
  try {
    const data = await fetchJsonMaybeGzip(url, signal);
    if (!isPlainObject(data)) return null;

    // Ensure {slug:url} string map
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof k === "string" && typeof v === "string") out[k] = v;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

async function loadShardMapForSlug(slug: string, signal?: AbortSignal) {
  const shard = computeShardForSlug(slug);

  // cache key per shard (since we have 1 base URL)
  const cacheKey = `${PDP_SHARD_DIR}:${shard}`;

  if (MAP_CACHE.has(cacheKey)) return MAP_CACHE.get(cacheKey)!;
  if (MAP_INFLIGHT.has(cacheKey)) return MAP_INFLIGHT.get(cacheKey)!;

  const promise = (async () => {
    // 1) Try small “global” maps if present
    for (const u of PDP_PATH_MAP_URLS) {
      const m = await tryFetchMap(u, signal);
      if (m) {
        MAP_CACHE.set("global", m);
        return m;
      }
    }

    // 2) Try shard map(s)
    for (const base of PDP_SHARD_BASE_URLS) {
      const url = `${base}/${shard}.json.gz`;
      const m = await tryFetchMap(url, signal);
      if (m) {
        MAP_CACHE.set(cacheKey, m);
        return m;
      }
    }

    // Nothing found
    return {};
  })();

  MAP_INFLIGHT.set(cacheKey, promise);

  try {
    const m = await promise;
    return m;
  } finally {
    MAP_INFLIGHT.delete(cacheKey);
  }
}

/* ============================
   Product fetcher
   ============================ */

async function resolveProductUrl(slug: string, signal?: AbortSignal) {
  const s = normalizeSlug(slug);
  if (!s) return null;

  const map = await loadShardMapForSlug(s, signal);

  // direct match
  if (map[s]) return map[s];

  // Sometimes keys are stored without decoding differences; try a couple soft variants.
  const variants = new Set<string>();
  variants.add(s.replace(/%2F/g, "/"));
  variants.add(s.replace(/\s+/g, "-"));
  variants.add(s.replace(/-+/g, "-"));

  for (const v of variants) {
    if (map[v]) return map[v];
  }

  // If we loaded the global map, try that too.
  const global = MAP_CACHE.get("global");
  if (global?.[s]) return global[s];

  return null;
}

async function fetchProductJson(productUrl: string, signal?: AbortSignal) {
  const data = await fetchJsonMaybeGzip(productUrl, signal);
  if (!isPlainObject(data)) throw new Error("Product JSON is not an object");
  return data;
}

/* ============================
   Provider
   ============================ */

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const preloadShardForSlug = useCallback(async (slug: string) => {
    const ac = new AbortController();
    // do not stomp the main fetch controller
    await loadShardMapForSlug(slug, ac.signal);
  }, []);

  const fetchProductBySlug = useCallback(async (slugRaw: string) => {
    const slug = normalizeSlug(slugRaw);

    // cancel any in-flight PDP request
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setError(null);

    try {
      const resolvedUrl = await resolveProductUrl(slug, ac.signal);

      if (!resolvedUrl) {
        // LAST resort – only helps if products are in /products/<slug>.json.gz (no batch folders)
        const guess = `${PRODUCTS_BASE_URL}/${slug}.json.gz`;
        const prod = await fetchProductJson(guess, ac.signal);
        setProduct(prod);
        setIsLoading(false);
        return prod;
      }

      const prod = await fetchProductJson(resolvedUrl, ac.signal);
      setProduct(prod);
      setIsLoading(false);
      return prod;
    } catch (e: any) {
      if (e?.name === "AbortError") throw e;
      const msg = e?.message || "Unknown error loading product";
      setProduct(null);
      setError(msg);
      setIsLoading(false);
      throw e;
    }
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const value = useMemo(
    () => ({ product, isLoading, error, fetchProductBySlug, preloadShardForSlug }),
    [product, isLoading, error, fetchProductBySlug, preloadShardForSlug]
  );

  return <ProductPdpContext.Provider value={value}>{children}</ProductPdpContext.Provider>;
}









 













 





