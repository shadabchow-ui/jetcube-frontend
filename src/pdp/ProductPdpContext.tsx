import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type PDPIndex = Record<string, string>;

type ProductPdpContextValue = {
  productUrl: string | null;
  loading: boolean;
  error: string | null;
  resolveBySlug: (slug: string) => Promise<void>;
};

const ProductPdpContext = createContext<ProductPdpContextValue | null>(null);

const R2_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

// 🔴 ONLY CHANGE: pdp_paths -> pdp2
const PDP_INDEX_BASE = `${R2_BASE}/indexes/pdp2`;

export const ProductPdpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shardCache = useRef<Record<string, PDPIndex>>({});

  const getShardKey = (slug: string) => {
    const ch = slug?.[0]?.toLowerCase() || "_";
    return `${ch}.json.gz`;
  };

  const fetchShard = async (shardKey: string): Promise<PDPIndex> => {
    if (shardCache.current[shardKey]) {
      return shardCache.current[shardKey];
    }

    const url = `${PDP_INDEX_BASE}/${shardKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load PDP shard: ${url}`);
    }

    const text = await res.text();
    const data = JSON.parse(text) as PDPIndex;
    shardCache.current[shardKey] = data;
    return data;
  };

  const resolveBySlug = async (slug: string) => {
    setLoading(true);
    setError(null);
    setProductUrl(null);

    try {
      const shardKey = getShardKey(slug);
      const shard = await fetchShard(shardKey);
      const url = shard[slug];

      if (!url) {
        throw new Error(`Slug not found in shard: ${slug}`);
      }

      setProductUrl(url);
    } catch (err: any) {
      setError(err?.message || "Failed to resolve PDP");
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ productUrl, loading, error, resolveBySlug }),
    [productUrl, loading, error]
  );

  return <ProductPdpContext.Provider value={value}>{children}</ProductPdpContext.Provider>;
};

export const useProductPdp = () => {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) {
    throw new Error("useProductPdp must be used within ProductPdpProvider");
  }
  return ctx;
};





 





