import React, { createContext, useContext, useMemo, useState } from "react";

type AnyObj = Record<string, any>;
type ShardMap = Record<string, string>;

type ProductPdpContextShape = {
  product: AnyObj | null;
  loading: boolean;
  error: string | null;

  /** Fetch product JSON for this slug using sharded slug → URL map */
  loadBySlug: (slug: string) => Promise<AnyObj | null>;

  /** Clear current product/error */
  clear: () => void;
};

const ProductPdpContext = createContext<ProductPdpContextShape | null>(null);

const R2_BASE_URL =
  (import.meta as any)?.env?.VITE_R2_BASE_URL ||
  (import.meta as any)?.env?.VITE_R2_PUBLIC_BASE_URL ||
  "";

const INDEX_BASE_URL =
  (import.meta as any)?.env?.VITE_INDEX_BASE_URL ||
  (import.meta as any)?.env?.VITE_R2_INDEX_BASE_URL ||
  (R2_BASE_URL ? `${R2_BASE_URL}/indexes` : "");

const SHARD_CACHE = new Map<string, ShardMap>();

function shardKeyFromSlug(slug: string): string {
  const s = String(slug || "").trim().toLowerCase();
  const ch = s[0] || "_";
  if (ch >= "a" && ch <= "z") return ch;
  if (ch >= "0" && ch <= "9") return "0";
  return "_";
}

/** Read JSON from a .json.gz response (Cloudflare serves gzip content; browser auto-decompresses body bytes). */
async function readGzipJson(res: Response): Promise<any> {
  // Many deployments rely on CF auto-decompression; res.json() works if server sets correct headers.
  // Keep it robust: try json(), fall back to text() parsing.
  try {
    return await res.json();
  } catch {
    const t = await res.text();
    return JSON.parse(t);
  }
}

async function fetchShardByKey(shardKey: string): Promise<ShardMap> {
  if (SHARD_CACHE.has(shardKey)) return SHARD_CACHE.get(shardKey)!;
  const url = `${INDEX_BASE_URL}/pdp2/${shardKey}.json.gz`;
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to fetch shard ${shardKey}: ${res.status} ${res.statusText}`);
  const json = (await readGzipJson(res)) as ShardMap;
  SHARD_CACHE.set(shardKey, json);
  return json;
}

async function resolveProductUrlFromSlug(slug: string): Promise<string | null> {
  const key = shardKeyFromSlug(slug);
  const shard = await fetchShardByKey(key);
  const url = shard[String(slug)];
  return url || null;
}

async function fetchProductJson(url: string): Promise<AnyObj> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch product JSON: ${res.status} ${res.statusText}`);
  return (await res.json()) as AnyObj;
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [product, setProduct] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = () => {
    setProduct(null);
    setError(null);
    setLoading(false);
  };

  const loadBySlug = async (slug: string) => {
    const s = String(slug || "").trim();
    if (!s) return null;

    setLoading(true);
    setError(null);

    try {
      const productUrl = await resolveProductUrlFromSlug(s);
      if (!productUrl) {
        throw new Error(`Slug not found in PDP index: ${s}`);
      }

      const json = await fetchProductJson(productUrl);
      setProduct(json);
      return json;
    } catch (e: any) {
      setProduct(null);
      setError(e?.message || "Failed to load product");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<ProductPdpContextShape>(
    () => ({
      product,
      loading,
      error,
      loadBySlug,
      clear,
    }),
    [product, loading, error]
  );

  return <ProductPdpContext.Provider value={value}>{children}</ProductPdpContext.Provider>;
}

export function useProductPdpContext() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdpContext must be used inside <ProductPdpProvider>");
  return ctx;
}

export default function useProductPdp() {
  const ctx = useProductPdpContext();
  return ctx.product;
}






 





