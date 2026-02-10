import React, { createContext, useContext, useEffect, useState } from "react";
import pako from "pako";

const R2_BASE = "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";
export const PRODUCTS_BASE_URL = R2_BASE;
const INDEX_URL = `${R2_BASE}/indexes/_index.json.gz`;

export type IndexItem = {
  slug: string;
  title?: string;
  price?: number | string;
  image?: string;
  path: string;
};

type PdpContextType = {
  index: IndexItem[];
  indexLoaded: boolean;
};

const ProductPdpContext = createContext<PdpContextType>({
  index: [],
  indexLoaded: false,
});

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<IndexItem[]>([]);
  const [indexLoaded, setIndexLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadIndex() {
      try {
        const res = await fetch(INDEX_URL);
        const buf = await res.arrayBuffer();
        const json = JSON.parse(
          pako.ungzip(new Uint8Array(buf), { to: "string" })
        );
        if (!cancelled) {
          setIndex(json);
          setIndexLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load index", err);
      }
    }

    loadIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProductPdpContext.Provider value={{ index, indexLoaded }}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export function useProductIndex() {
  return useContext(ProductPdpContext);
}















 













 





