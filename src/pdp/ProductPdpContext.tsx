import React, { createContext, useContext } from "react";

export const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

type IndexItem = {
  slug: string;
  path: string;
  title?: string;
  price?: number;
  image?: string | null;
  category?: string;
};

type PdpShard = Record<string, string>;

type Ctx = {
  loadIndexOnce: () => Promise<IndexItem[]>;
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
let INDEX_CACHE: IndexItem[] | null = null;
let INDEX_PROMISE: Promise<IndexItem[]> | null = null;

const SHARD_CACHE: Record<string, PdpShard> = {};
const SHARD_PROMISES: Record<string, Promise<PdpShard | null>> = {};

async function internalFetchJson(url: string) {
  const res = await fetch(url, { cache: "force-cache" });

  const ct = (res.headers.get("content-type") || "").toLowerCase();

  // Reject HTML fallback (Cloudflare SPA fallback or 404 page)
  if (ct.includes("text/html")) {
    throw new Error(
      `Expected JSON but received text/html at ${url}. ` +
        `The file may be missing from R2 or served without correct Content-Type.`
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} error fetching ${url}: ${text.slice(0, 100)}`);
  }

  const text = await res.text();

  // Extra guard: body starts with HTML
  if (text.trim().startsWith("<")) {
    throw new Error(`Expected JSON but got HTML at ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`JSON parse failed at ${url}`);
  }
}

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

    const url = `${R2_PUBLIC_BASE}/indexes/_index.json.gz`;
    console.log("[ProductPdpContext] Fetching global index:", url);

    INDEX_PROMISE = internalFetchJson(url)
      .then((data) => {
        // Support both array format and manifest { version, base, shards }
        if (Array.isArray(data)) {
          INDEX_CACHE = data;
        } else if (data && typeof data === "object" && Array.isArray(data.shards)) {
          // Manifest format — store as-is for now; callers handle shape
          INDEX_CACHE = data as any;
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
    if (!shardKey || shardKey.length < 2) return null;
    if (SHARD_CACHE[shardKey]) return SHARD_CACHE[shardKey];
    if (SHARD_PROMISES[shardKey]) return SHARD_PROMISES[shardKey];

    const url = `${R2_PUBLIC_BASE}/indexes/pdp_paths/${shardKey}.json.gz`;
    console.log("[ProductPdpContext] Fetching shard:", url);

    SHARD_PROMISES[shardKey] = internalFetchJson(url)
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
      value={{ loadIndexOnce, loadPdpShard, fetchJson: internalFetchJson }}
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




















 













 





