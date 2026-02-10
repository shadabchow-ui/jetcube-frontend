// src/pdp/ProductPdpContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

export const R2_BASE =
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

const INDEX_URL = `${R2_BASE}/indexes/_index.json.gz`;

export type IndexItem = {
  slug: string;
  path: string;
  title?: string;
  price?: number;
  image?: string | null;
};

type Product = any;

type Ctx = {
  product: Product | null;
  loading: boolean;
  error: string | null;
  loadBySlug: (slug: string) => Promise<void>;
};

const ProductPdpContext = createContext<Ctx | null>(null);

export const ProductPdpProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [index, setIndex] = useState<IndexItem[] | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load index once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(INDEX_URL);
        if (!res.ok) throw new Error("Failed to load index");
        const data = await res.json();
        if (!cancelled) setIndex(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadBySlug = async (slug: string) => {
    if (!index) return;
    setLoading(true);
    setError(null);
    try {
      const item = index.find((i) => i.slug === slug);
      if (!item) throw new Error("Product not found in index");

      const url = `${R2_BASE}/${item.path}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch product JSON");
      const data = await res.json();
      setProduct(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductPdpContext.Provider
      value={{ product, loading, error, loadBySlug }}
    >
      {children}
    </ProductPdpContext.Provider>
  );
};

export const useProductPdp = () => {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdp must be used inside ProductPdpProvider");
  return ctx;
};














 













 





