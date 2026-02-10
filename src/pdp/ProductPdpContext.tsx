// src/pdp/ProductPdpContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

export type Product = {
  slug: string;
  path: string;
};

type PdpContextType = {
  index: Product[] | null;
  loading: boolean;
  error: string | null;
};

const ProductPdpContext = createContext<PdpContextType | null>(null);

export const PRODUCTS_BASE_URL =
  import.meta.env.VITE_PRODUCTS_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

const INDEX_PATH = "/indexes/_index.json.gz";

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadIndex = async () => {
      try {
        const res = await fetch(`${PRODUCTS_BASE_URL}${INDEX_PATH}`, {
          headers: { "Accept-Encoding": "gzip" },
        });

        if (!res.ok) {
          throw new Error(`Index fetch failed: ${res.status}`);
        }

        const data = await res.json();
        setIndex(data.items || data);
      } catch (err: any) {
        setError(err.message || "Failed to load index");
      } finally {
        setLoading(false);
      }
    };

    loadIndex();
  }, []);

  return (
    <ProductPdpContext.Provider value={{ index, loading, error }}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdp must be used within ProductPdpProvider");
  return ctx;
}











 













 





