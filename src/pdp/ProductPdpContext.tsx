import React, { createContext, useContext, useRef } from "react";

export const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

type IndexItem = {
  slug: string;
  path: string;
};

type PdpContextType = {
  loadIndexOnce: () => Promise<IndexItem[]>;
};

const Ctx = createContext<PdpContextType | null>(null);

let INDEX_CACHE: IndexItem[] | null = null;
let INDEX_PROMISE: Promise<IndexItem[]> | null = null;

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  async function loadIndexOnce(): Promise<IndexItem[]> {
    if (INDEX_CACHE) return INDEX_CACHE;
    if (INDEX_PROMISE) return INDEX_PROMISE;

    INDEX_PROMISE = (async () => {
      const url = `${R2_PUBLIC_BASE}/indexes/_index.json.gz`;
      const res = await fetch(url);
      const text = await res.text();

      if (text.trim().startsWith("<")) {
        throw new Error("Index fetch returned HTML – R2 path broken");
      }

      const data = JSON.parse(text);
      INDEX_CACHE = data;
      return data;
    })();

    return INDEX_PROMISE;
  }

  return (
    <Ctx.Provider value={{ loadIndexOnce }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProductPdpContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProductPdpContext must be used inside ProductPdpProvider");
  return ctx;
}



















 













 





