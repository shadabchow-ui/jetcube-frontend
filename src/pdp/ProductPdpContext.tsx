import { createContext, useContext } from "react";

export const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

let INDEX_CACHE: any[] | null = null;
let INDEX_PROMISE: Promise<any[]> | null = null;

async function fetchIndex(): Promise<any[]> {
  const url = `${R2_PUBLIC_BASE}/indexes/_index.json.gz`;
  const res = await fetch(url, { cache: "force-cache" });

  const text = await res.text();
  if (text.trim().startsWith("<")) {
    throw new Error("Index returned HTML (wrong R2 path)");
  }

  return JSON.parse(text);
}

export function useProductPdpContext() {
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

  return { loadIndexOnce };
}


















 













 





