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
const INDEX_BASE_URL =
  (import.meta as any).env?.VITE_INDEX_BASE_URL ||
  (typeof window !== "undefined" ? new URL("/indexes", window.location.origin).toString() : "/indexes");

const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_PRODUCTS_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";
// ----------------

type ShardMap = Record<string, string>;
const SHARD_CACHE: Map<string, ShardMap> = new Map();

function normalizeSlug(slug: string): string {
  try { return decodeURIComponent(String(slug || "")).trim().toLowerCase(); }
  catch { return String(slug || "").trim().toLowerCase(); }
}

function shardCandidatesForSlug(slug: string): string[] {
  const s = normalizeSlug(slug);
  if (!s) return ["xx"];
  const c1 = s.slice(0, 1);
  const c2 = s.slice(0, 2);
  const out: string[] = [];
  if (c2.length === 2) out.push(c2);
  if (c1) out.push(`_${c1}`);
  if (c1) out.push(c1);
  out.push("xx");
  return Array.from(new Set(out));
}

async function readGzipJson(res: Response): Promise<any> {
  const buf = await res.arrayBuffer();
  if (typeof (globalThis as any).DecompressionStream !== "undefined") {
    const ds = new (globalThis as any).DecompressionStream("gzip");
    const stream = new Blob([buf]).stream().pipeThrough(ds);
    const text = await new Response(stream).text();
    return JSON.parse(text);
  }
  throw new Error("Shard is .json.gz but DecompressionStream is unavailable. Add a gzip fallback (fflate/pako) or serve shards as .json with Content-Encoding:gzip.");
}

async function fetchShardByKey(shardKey: string): Promise<ShardMap> {
  if (SHARD_CACHE.has(shardKey)) return SHARD_CACHE.get(shardKey)!;
  const url = `${INDEX_BASE_URL}/pdp_paths/${shardKey}.json.gz`;
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to fetch shard ${shardKey}: ${res.status} ${res.statusText}`);
  const json = (await readGzipJson(res)) as ShardMap;
  SHARD_CACHE.set(shardKey, json);
  return json;
}

async function fetchShardForSlug(slug: string): Promise<{ shardKey: string; shard: ShardMap }> {
  let lastErr: any = null;
  for (const key of shardCandidatesForSlug(slug)) {
    try { return { shardKey: key, shard: await fetchShardByKey(key) }; }
    catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("Unable to load any shard candidate");
}

function normalizeProductUrl(rawPathOrUrl: string): string {
  const raw = (rawPathOrUrl || "").trim();
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return encodeURI(raw);
  const cleaned = raw.replace(/^\//, "");
  return new URL(cleaned, PRODUCTS_BASE_URL.endsWith("/") ? PRODUCTS_BASE_URL : `${PRODUCTS_BASE_URL}/`).toString();
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [lastError, setLastError] = useState<string | null>(null);
  const clearError = useCallback(() => setLastError(null), []);
  const preloadShardForSlug = useCallback(async (slug: string) => {
    try { await fetchShardForSlug(slug); } catch (e: any) { setLastError(e?.message || String(e)); }
  }, []);
  const getUrlForSlug = useCallback(async (slug: string): Promise<string | null> => {
    try {
      const norm = normalizeSlug(slug);
      const { shard } = await fetchShardForSlug(norm);
      const raw = shard[norm];
      if (!raw) return null;
      return normalizeProductUrl(raw);
    } catch (e: any) {
      setLastError(e?.message || String(e));
      return null;
    }
  }, []);
  const value = useMemo<PdpContextType>(() => ({ getUrlForSlug, preloadShardForSlug, lastError, clearError }), [getUrlForSlug, preloadShardForSlug, lastError, clearError]);
  return (
    <ProductPdpContext.Provider value={value}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdp must be used within ProductPdpProvider");
  return ctx;
}




 





