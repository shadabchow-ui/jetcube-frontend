import React, { createContext, useContext, useEffect, useRef, useState } from "react";

export const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

export const INDEX_URL = `${R2_PUBLIC_BASE}/indexes/_index.json.gz`;

export type IndexItem = {
  slug: string;
  title: string;
  price: number;
  image: string | null;
  category: string;
  path: string; // products/batch-x/slug.json.gz
};

type ProductPdpContextType = {
  index: IndexItem[] | null;
  loadIndexOnce: () => Promise<IndexItem[]>;
};

const ProductPdpContext = createContext<ProductPdpContextType | null>(null);

let INDEX_CACHE: IndexItem[] | null = null;
let INDEX_PROMISE: Promise<IndexItem[]> | null = null;

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<IndexItem[] | null>(INDEX_CACHE);

  async function loadIndexOnce() {
    if (INDEX_CACHE) return INDEX_CACHE;
    if (INDEX_PROMISE) return INDEX_PROMISE;

    INDEX_PROMISE = (async () => {
      const res = await fetch(INDEX_URL, { cache: "force-cache" });
      if (!res.ok) throw new Error("Failed to load _index.json.gz");
      const data = await res.json();
      INDEX_CACHE = data;
      setIndex(data);
      return data;
    })();

    return INDEX_PROMISE;
  }

  return (
    <ProductPdpContext.Provider value={{ index, loadIndexOnce }}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export function useProductPdpContext() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdpContext must be used inside ProductPdpProvider");
  return ctx;
}
















 













 





