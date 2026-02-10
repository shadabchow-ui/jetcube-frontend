import React, { createContext, useContext, useMemo, useRef, useState } from "react";

/**
 * Production-safe:
 * Always fetch PDP JSON from same-origin flat path:
 *   /products/{handle}.json
 */
export const PRODUCTS_BASE_URL = "/products/";

type ProductPdpContextValue = {
  fetchProductByHandle: (handleOrUrl: string) => Promise<any>;
  getUrlForHandle: (handleOrUrl: string) => string | null;
  lastError: string | null;
};

const Ctx = createContext<ProductPdpContextValue | null>(null);

function cleanHandle(input: string): string {
  return (input || "")
    .trim()
    // If a full URL was passed, extract the filename
    .replace(/^https?:\/\/[^/]+\//, "")
    // Strip folders like products/batch X/part YY/
    .replace(/^products\/.*?\//, "")
    .replace(/^.*\/products\/.*?\//, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.json(\.gz)?$/i, "");
}

function buildUrl(handleOrUrl: string): string | null {
  const h = cleanHandle(handleOrUrl);
  if (!h) return null;
  return `${PRODUCTS_BASE_URL}${h}.json`.replace(/\/{2,}/g, "/");
}

export function ProductPdpProvider({ children }: { children: React.ReactNode }) {
  const [lastError, setLastError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, any>>(new Map());

  const getUrlForHandle = (handleOrUrl: string) => buildUrl(handleOrUrl);

  const fetchProductByHandle = async (handleOrUrl: string) => {
    const url = buildUrl(handleOrUrl);
    if (!url) throw new Error("Could not resolve PDP JSON URL");

    const cacheKey = url;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) return cached;

    setLastError(null);

    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      throw new Error(`PDP fetch failed (${res.status}) at ${url}`);
    }

    const text = await res.text();

    // Guard against HTML (routing/404)
    if (text.trim().startsWith("<")) {
      throw new Error(`Expected JSON but got HTML at ${url}`);
    }

    const json = JSON.parse(text);
    cacheRef.current.set(cacheKey, json);
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









 













 





