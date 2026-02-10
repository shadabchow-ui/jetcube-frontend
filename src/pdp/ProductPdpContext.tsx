import React, { createContext, useContext, useRef } from "react";

export const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c64a8ace8be57ce3e4d65.r2.dev";

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

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const cacheRef = useRef<IndexItem[] | null>(null);
  const promiseRef = useRef<Promise<IndexItem[]> | null>(null);

  async function loadIndexOnce(): Promise<IndexItem[]> {
    if (cacheRef.current) return cacheRef.current;
    if (promiseRef.current) return promiseRef.current;

    const url = `${R2_PUBLIC_BASE}/indexes/_index.json.gz`;

    promiseRef.current = (async () => {
      const res = await fetch(url, { cache: "force-cache" });
      const text = await res.text();

      if (text.trim().startsWith("<")) {
        throw new Error("Index URL returned HTML (bad R2 path or missing file)");
      }

      const data = JSON.parse(text);
      cacheRef.current = data;
      return data;
    })();

    return promiseRef.current;
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

















 













 





