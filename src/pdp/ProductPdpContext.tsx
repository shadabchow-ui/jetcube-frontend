import React, { createContext, useContext, useMemo, useRef, useState } from "react";

/**
 * STRICT production rule:
 * Always fetch flat JSON from same-origin:
 *   /products/{handle}.json
 *
 * No gzip, no batch folders, no shards, no R2 public domain.
 */
const PRODUCTS_BASE_URL = "/products/";

type ProductPdpContextValue = {
  fetchProductByHandle: (handle: string) => Promise<any>;
  getUrlForHandle: (handle: string) => string | null;
  lastError: string | null;
};

const Ctx = createContext<ProductPdpContextValue | null>(null);

function cleanHandle(input: string): string {
  return (input || "").trim().replace(/^\/+|\/+$/g, "");
}

function buildUrl(handle: string): string | null {
  const h = cleanHandle(handle);
  if (!h) return null;
  const file = h.endsWith(".json") ? h : `${h}.json`;
  return `${PRODUCTS_BASE_URL}${file}`.replace(/\/{2,}/g, "/");
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [lastError, setLastError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, any>>(new Map());

  const getUrlForHandle = (handle: string) => buildUrl(handle);

  const fetchProductByHandle = async (handle: string) => {
    const h = cleanHandle(handle);
    if (!h) throw new Error("Missing product handle");

    const cached = cacheRef.current.get(h);
    if (cached) return cached;

    const url = buildUrl(h);
    if (!url) throw new Error("Could not resolve product URL");

    setLastError(null);

    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      throw new Error(`PDP fetch failed (${res.status}) at ${url}`);
    }

    // If this ever returns HTML, it's a routing/404 problem
    const text = await res.text();
    if (text.trim().startsWith("<")) {
      throw new Error(`Expected JSON at ${url} but got HTML (missing file or misrouted)`);
    }

    const json = JSON.parse(text);
    cacheRef.current.set(h, json);
    return json;
  };

  const value = useMemo(
    () => ({ fetchProductByHandle, getUrlForHandle, lastError }),
    [lastError]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProductPdp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProductPdp must be used within ProductPdpProvider");
  return ctx;
}









 













 





