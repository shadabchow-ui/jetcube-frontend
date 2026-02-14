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
  version?: string;
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
const ProductDataContext = createContext<any | null>(null);

let INDEX_CACHE: IndexItem[] | IndexManifest | null = null;
let INDEX_PROMISE: Promise<IndexItem[] | IndexManifest> | null = null;

const SHARD_CACHE: Record<string, PdpShard> = {};
const SHARD_PROMISES: Record<string, Promise<PdpShard | null>> = {};

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

    const candidates = [
      "indexes/pdp2/_index.json.gz",
      "indexes/pdp2/_index.json",
      "indexes/_index.json.gz",
      "indexes/_index.json",
    ].map((rel) => joinUrl(R2_BASE, rel));

    INDEX_PROMISE = (async () => {
      let data: any = null;
      let usedUrl: string | null = null;

      for (const u of candidates) {
        const attempted = await fetchJsonStrict<any>(u, "Index fetch", {
          allow404: true,
        });
        if (attempted !== null) {
          data = attempted;
          usedUrl = u;
          break;
        }
      }

      if (!usedUrl) {
        throw new Error(
          `Global PDP index not found. Tried: ${candidates.join(", ")}`
        );
      }

      console.log("[ProductPdpContext] Index loaded:", usedUrl);

      // Support both array format and manifest { base, shards }
      if (Array.isArray(data)) {
        INDEX_CACHE = data as IndexItem[];
      } else if (
        data &&
        typeof data === "object" &&
        data.shards &&
        typeof data.shards === "object" &&
        !Array.isArray(data.shards)
      ) {
        INDEX_CACHE = data as IndexManifest;
      } else {
        throw new Error("Index is not an array or valid manifest");
      }

      return INDEX_CACHE!;
    })().catch((err) => {
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

    const relCandidates = [
      `indexes/pdp2/${shardKey}.json.gz`,
      `indexes/pdp2/${shardKey}.json`,
      `indexes/pdp_paths/${shardKey}.json.gz`, // legacy
      `indexes/pdp_paths/${shardKey}.json`, // legacy
    ];

    const urls = relCandidates.map((rel) => joinUrl(R2_BASE, rel));
    console.log("[ProductPdpContext] Fetching shard candidates:", urls);

    SHARD_PROMISES[shardKey] = (async () => {
      for (const u of urls) {
        const data = await fetchJsonStrict<PdpShard>(u, "Shard fetch", {
          allow404: true,
        });
        if (data !== null) {
          SHARD_CACHE[shardKey] = data;
          console.log(`[ProductPdpContext] Shard ${shardKey} loaded from ${u}`);
          return data;
        }
      }
      console.warn(
        `[ProductPdpContext] Shard ${shardKey} not found in any known location`
      );
      return null;
    })().catch((err) => {
      console.warn(`[ProductPdpContext] Shard ${shardKey} failed:`, err);
      return null;
    });

    return SHARD_PROMISES[shardKey];
  }

  return (
    <ProductPdpContext.Provider
      value={{ loadIndexOnce, loadPdpShard, fetchJson: (url: string) => fetchJsonStrict(url) }}
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

export function useProductPdp() {
  return useContext(ProductDataContext);
}
