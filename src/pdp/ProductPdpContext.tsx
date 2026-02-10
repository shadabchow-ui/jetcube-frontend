import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Product = {
  slug: string;
  title: string;
  price: number;
  image?: string | null;
  category?: string | null;
  path: string;
  [key: string]: any;
};

type PdpContextValue = {
  product: Product | null;
  loading: boolean;
  error: string | null;
  loadBySlug: (slug: string) => Promise<void>;
};

const PdpContext = createContext<PdpContextValue | null>(null);

const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // in-memory cache to avoid double fetch
  const cacheRef = useRef<Record<string, Product>>({});

  async function loadBySlug(slug: string) {
    if (!slug) return;

    if (cacheRef.current[slug]) {
      setProduct(cacheRef.current[slug]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const indexUrl = `${R2_PUBLIC_BASE}/indexes/_index.json.gz`;
      const indexRes = await fetch(indexUrl);
      if (!indexRes.ok) throw new Error(`Index fetch failed: ${indexRes.status}`);

      const index = await indexRes.json();
      const item = index.find((i: any) => i.slug === slug);

      if (!item?.path) {
        throw new Error(`Slug not found in index: ${slug}`);
      }

      const productUrl = `${R2_PUBLIC_BASE}/${item.path}`;
      const res = await fetch(productUrl);

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Expected JSON but got ${contentType}. First bytes: ${text.slice(0, 80)}`);
      }

      const data = await res.json();
      cacheRef.current[slug] = data;
      setProduct(data);
    } catch (err: any) {
      console.error("PDP load failed:", err);
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(
    () => ({
      product,
      loading,
      error,
      loadBySlug,
    }),
    [product, loading, error]
  );

  return <PdpContext.Provider value={value}>{children}</PdpContext.Provider>;
}

export function useProductPdp() {
  const ctx = useContext(PdpContext);
  if (!ctx) {
    throw new Error("useProductPdp must be used within ProductPdpProvider");
  }
  return ctx;
}















 













 





