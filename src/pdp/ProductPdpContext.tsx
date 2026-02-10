import React, { createContext, useContext, useMemo, useRef, useState } from "react";

/**
 * ============================================================
 * R2 BASE URLS
 * ============================================================
 * Notes:
 * - We support multiple env var names for safety/backwards-compat.
 * - Make sure defaults include a trailing slash when used as a base.
 */

const PUBLIC_R2_BASE_URL =
  (import.meta as any).env?.VITE_PUBLIC_R2_BASE_URL ||
  (import.meta as any).env?.VITE_R2_PUBLIC_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

export const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_PRODUCTS_BASE_URL ||
  (import.meta as any).env?.VITE_R2_PRODUCTS_BASE_URL ||
  (import.meta as any).env?.VITE_R2_PRODUCTS_BASE ||
  `${PUBLIC_R2_BASE_URL}/products/`;

/**
 * This is the one you referenced:
 * "https://...r2.dev/indexes/pdp2/"
 */
export const PDP_INDEX_BASE_URL =
  (import.meta as any).env?.VITE_PDP_INDEX_BASE_URL ||
  (import.meta as any).env?.VITE_R2_PDP_INDEX_BASE_URL ||
  `${PUBLIC_R2_BASE_URL}/indexes/pdp2/`;

/**
 * Optional: if you want to use one single map instead of shards
 * (your R2 shows pdp_path_map.json.gz at the bucket root)
 */
export const PDP_PATH_MAP_URL =
  (import.meta as any).env?.VITE_PDP_PATH_MAP_URL ||
  `${PUBLIC_R2_BASE_URL}/pdp_path_map.json.gz`;

/**
 * ============================================================
 * Types
 * ============================================================
 */
type PdpIndexMap = Record<string, string>;

type ProductPdpContextValue = {
  fetchProductBySlug: (slug: string) => Promise<any>;
  getProductUrlForSlug: (slug: string) => Promise<string | null>;
  lastError: string | null;
};

const ProductPdpContext = createContext<ProductPdpContextValue | null>(null);

/**
 * ============================================================
 * Helpers
 * ============================================================
 */
function cleanSlug(input: string): string {
  return (input || "").trim().replace(/^\/+|\/+$/g, "");
}

function normalizeBaseUrl(u: string): string {
  const s = (u || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s : `${s}/`;
}

function normalizeProductUrl(maybeUrl: string): string {
  const s = (maybeUrl || "").trim();
  if (!s) return s;

  // Already absolute
  if (/^https?:\/\//i.test(s)) return s;

  // If it looks like a file path
  const base = normalizeBaseUrl(PRODUCTS_BASE_URL);
  if (!base) return s;
  return `${base}${s.replace(/^\/+/, "")}`;
}

/**
 * Download and parse JSON, supporting .json.gz files.
 * Uses browser DecompressionStream when available.
 */
async function fetchJsonMaybeGzip(url: string): Promise<any> {
  const res = await fetch(url, { cache: "force-cache" as RequestCache });
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${url}`);
  }

  // If it's not gz, normal json
  if (!/\.json\.gz(\?|$)/i.test(url)) {
    return await res.json();
  }

  // GZ path: try DecompressionStream
  const ds = (window as any).DecompressionStream;
  if (!ds) {
    // Fallback: try text then JSON (works if server auto-decompresses)
    const txt = await res.text();
    return JSON.parse(txt);
  }

  const stream = res.body;
  if (!stream) throw new Error(`No response body for ${url}`);

  const decompressed = stream.pipeThrough(new ds("gzip"));
  const ab = await new Response(decompressed).arrayBuffer();
  const text = new TextDecoder().decode(ab);
  return JSON.parse(text);
}

/**
 * ============================================================
 * Shard file name logic MUST match your R2 filenames:
 * - "0-..." => "0-.json.gz"
 * - "00..." => "00.json.gz"
 * - "a..."  => "_a.json.gz"
 * ============================================================
 */
function getPdpShardFileName(slug: string): string {
  const s = cleanSlug(slug).toLowerCase();
  if (!s) return "_misc.json.gz";

  const c1 = s[0] || "";
  const c2 = s[1] || "";

  // digits:
  //  - "0-" => "0-.json.gz"
  //  - "00" => "00.json.gz"
  if (c1 >= "0" && c1 <= "9") {
    if (c2 === "-" || (c2 >= "0" && c2 <= "9")) {
      return `${c1}${c2}.json.gz`;
    }
    // fallback if only single digit
    return `${c1}.json.gz`;
  }

  // letters => "_a.json.gz"
  if (c1 >= "a" && c1 <= "z") {
    return `_${c1}.json.gz`;
  }

  return "_misc.json.gz";
}

/**
 * ============================================================
 * Provider
 * ============================================================
 */
export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [lastError, setLastError] = useState<string | null>(null);

  // Cache shards by filename
  const shardCacheRef = useRef<Map<string, PdpIndexMap>>(new Map());

  // Optional: cache the big one-file map
  const pathMapRef = useRef<PdpIndexMap | null>(null);
  const pathMapLoadedRef = useRef<boolean>(false);

  const loadShard = async (slug: string): Promise<PdpIndexMap> => {
    const fileName = getPdpShardFileName(slug);

    const cached = shardCacheRef.current.get(fileName);
    if (cached) return cached;

    const base = normalizeBaseUrl(PDP_INDEX_BASE_URL);
    const shardUrl = `${base}${fileName}`;

    const json = await fetchJsonMaybeGzip(shardUrl);
    const map = (json || {}) as PdpIndexMap;

    shardCacheRef.current.set(fileName, map);
    return map;
  };

  const loadPathMapOnce = async (): Promise<PdpIndexMap | null> => {
    if (pathMapLoadedRef.current) return pathMapRef.current;
    pathMapLoadedRef.current = true;

    try {
      const json = await fetchJsonMaybeGzip(PDP_PATH_MAP_URL);
      pathMapRef.current = (json || {}) as PdpIndexMap;
      return pathMapRef.current;
    } catch {
      // If it fails, we just won't use it.
      pathMapRef.current = null;
      return null;
    }
  };

  const getProductUrlForSlug = async (slug: string): Promise<string | null> => {
    const s = cleanSlug(slug);
    if (!s) return null;

    // If you prefer the single file map, try it first (fast + simple)
    const bigMap = await loadPathMapOnce();
    if (bigMap && bigMap[s]) {
      return normalizeProductUrl(bigMap[s]);
    }

    // Otherwise shard lookup
    const shard = await loadShard(s);
    const found = shard?.[s];
    return found ? normalizeProductUrl(found) : null;
  };

  const fetchProductBySlug = async (slug: string): Promise<any> => {
    setLastError(null);

    const url = await getProductUrlForSlug(slug);
    if (!url) {
      throw new Error(`Slug not found in PDP index: ${cleanSlug(slug)}`);
    }

    const product = await fetchJsonMaybeGzip(url);
    return product;
  };

  const value = useMemo<ProductPdpContextValue>(
    () => ({
      fetchProductBySlug,
      getProductUrlForSlug,
      lastError,
    }),
    [lastError]
  );

  return (
    <ProductPdpContext.Provider value={value}>
      {children}
    </ProductPdpContext.Provider>
  );
}

/**
 * ============================================================
 * Hook
 * ============================================================
 */
export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) {
    throw new Error("useProductPdp must be used inside <ProductPdpProvider>");
  }
  return ctx;
}











 













 





