import React, { createContext, useContext } from "react";
import { R2_BASE, joinUrl, fetchJsonStrict } from "../config/r2";


type IndexItem = {
  slug: string;
  path: string;
  title?: string;
  price?: number;
  image?: string | null;
  category?: string;
};

type PdpShard = Record<string, string>;

type IndexManifest = {
  version: number;
  base: string;
  shards: Record<string, string>;
};

type Ctx = {
  loadIndexOnce: () => Promise<IndexItem[] | IndexManifest>;
  loadPdpShard: (shardKey: string) => Promise<PdpShard | null>;
  fetchJson: (url: string) => Promise<any>;
};

const ProductPdpContext = createContext<Ctx | null>(null);

/* ────────────────────────────────────────────────────────
   NEW: Product DATA context (consumed by useProductPdp)
   ──────────────────────────────────────────────────────── */
const ProductDataContext = createContext<any>(null);

/**
 * useProductPdp — returns the loaded product object.
 * Every PDP section component calls this.
 */
export function useProductPdp(): any {
  const product = useContext(ProductDataContext);
  if (!product) {
    throw new Error(
      "useProductPdp must be used inside a <ProductPdpProvider product={…}>"
    );
  }
  return product;
}

/* ────────────────────────────────────────────────────────
   Caches (unchanged)
   ──────────────────────────────────────────────────────── */
let INDEX_CACHE: (IndexItem[] | IndexManifest) | null = null;
let INDEX_PROMISE: Promise<IndexItem[] | IndexManifest> | null = null;

const SHARD_CACHE: Record<string, PdpShard> = {};
const SHARD_PROMISES: Record<string, Promise<PdpShard | null>> = {};

/* ────────────────────────────────────────────────────────
   Provider
   ──────────────────────────────────────────────────────── */
export function ProductPdpProvider({
  product,
  children,
}: {
  product?: any;
  children: React.ReactNode;
}) {
  async function loadIndexOnce() {
    if (INDEX_CACHE) return INDEX_CACHE;
    if (INDEX_PROMISE) return INDEX_PROMISE;

    const url = joinUrl(R2_BASE, "indexes/_index.json.gz");
    console.log("[ProductPdpContext] Fetching global index:", url);

    INDEX_PROMISE = fetchJsonStrict(url)
      .then((data: any) => {
        // Support both array format and manifest { version, base, shards }
        if (Array.isArray(data)) {
          INDEX_CACHE = data as IndexItem[];
        } else if (
          data &&
          typeof data === "object" &&
          data.shards &&
          typeof data.shards === "object" &&
          !Array.isArray(data.shards)
        ) {
          // Manifest format
          INDEX_CACHE = data as IndexManifest;
        } else {
          throw new Error("Index is not an array or valid manifest");
        }
        console.log("[ProductPdpContext] Index loaded successfully");
        return INDEX_CACHE!;
      })
      .catch((err) => {
        console.error("[ProductPdpContext] Index load failed:", err);
        INDEX_PROMISE = null;
        throw err;
      });

    return INDEX_PROMISE;
  }

  async function loadPdpShard(shardKey: string) {
    if (!shardKey) return null;
    if (SHARD_CACHE[shardKey]) return SHARD_CACHE[shardKey];
    if (SHARD_PROMISES[shardKey]) return SHARD_PROMISES[shardKey];

    const url = joinUrl(R2_BASE, `indexes/pdp_paths/${shardKey}.json.gz`);
    console.log("[ProductPdpContext] Fetching shard:", url);

    SHARD_PROMISES[shardKey] = fetchJsonStrict<PdpShard>(url)
      .then((data) => {
        SHARD_CACHE[shardKey] = data;
        console.log(`[ProductPdpContext] Shard ${shardKey} loaded`);
        return data;
      })
      .catch((err) => {
        console.warn(`[ProductPdpContext] Shard ${shardKey} not found or failed:`, err);
        return null;
      });

    return SHARD_PROMISES[shardKey];
  }

  return (
    <ProductPdpContext.Provider
      value={{ loadIndexOnce, loadPdpShard, fetchJson: fetchJsonStrict }}
    >
      <ProductDataContext.Provider value={product ?? null}>
        {children}
      </ProductDataContext.Provider>
    </ProductPdpContext.Provider>
  );
}

export function useProductPdpContext() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx)
    throw new Error("useProductPdpContext must be used inside ProductPdpProvider");
  return ctx;
}
