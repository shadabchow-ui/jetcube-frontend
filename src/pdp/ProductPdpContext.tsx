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

type Ctx = {
  loadIndexOnce: () => Promise<IndexItem[]>;
};

const ProductPdpContext = createContext<Ctx | null>(null);

let INDEX_CACHE: IndexItem[] | null = null;
let INDEX_PROMISE: Promise<IndexItem[]> | null = null;

async function fetchIndex(): Promise<IndexItem[]> {
  const url = `${R2_PUBLIC_BASE}/indexes/_index.json.gz`;
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Index fetch failed: ${res.status}`);
  return res.json();
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  async function loadIndexOnce() {
    if (INDEX_CACHE) return INDEX_CACHE;
    if (!INDEX_PROMISE) {
      INDEX_PROMISE = fetchIndex().then((data) => {
        INDEX_CACHE = data;
        return data;
      });
    }
    return INDEX_PROMISE;
  }

  return (
    <ProductPdpContext.Provider value={{ loadIndexOnce }}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export function useProductPdpContext() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdpContext must be used inside ProductPdpProvider");
  return ctx;
}




















 













 





