import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Production-safe defaults:
 * - Prefer same-origin /products/ (works with Pages -> R2 proxy)
 * - No gzip
 * - No shards
 *
 * If you *really* want to fetch directly from R2 public domain, set:
 *   VITE_PRODUCTS_BASE_URL="https://pub-...r2.dev/products/"
 */
export const PRODUCTS_BASE_URL: string =
  (import.meta as any).env?.VITE_PRODUCTS_BASE_URL ||
  "/products/";

type ProductPdpContextValue = {
  fetchProductBySlug: (slug: string) => Promise<any>;
  getProductUrlForSlug: (slug: string) => string | null;
  lastError: string | null;
};

const ProductPdpContext = createContext<ProductPdpContextValue | null>(null);

function cleanSlug(input: string): string {
  return (input || "").trim().replace(/^\/+|\/+$/g, "");
}

function normalizeBaseUrl(u: string): string {
  const s = (u || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s : `${s}/`;
}

function isAbsoluteUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

function buildJsonUrl(base: string, slug: string): string {
  const b = normalizeBaseUrl(base);
  const s = cleanSlug(slug);

  // If caller passed a full URL, keep it
  if (isAbsoluteUrl(s)) return s;

  // If caller passed "x.json", keep it; otherwise add ".json"
  const file = s.endsWith(".json") ? s : `${s}.json`;
  return `${b}${file.replace(/^\/+/, "")}`;
}

export function ProductPdpProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lastError, setLastError] = useState<string | null>(null);

  // Simple in-memory cache by slug so PDP navigation is fast
  const cacheRef = useRef<Map<string, any>>(new Map());

  const getProductUrlForSlug = (slug: string): string | null => {
    const s = cleanSlug(slug);
    if (!s) return null;
    return buildJsonUrl(PRODUCTS_BASE_URL, s);
  };

  const fetchProductBySlug = async (slug: string): Promise<any> => {
    const s = cleanSlug(slug);
    if (!s) throw new Error("Missing product slug/handle");

    // Cache hit
    const cached = cacheRef.current.get(s);
    if (cached) return cached;

    const url = getProductUrlForSlug(s);
    if (!url) throw new Error("Could not resolve product URL");

    try {
      setLastError(null);

      const res = await fetch(url, {
        cache: "no-cache",
      });

      if (!res.ok) {
        throw new Error(`PDP fetch failed (${res.status}) for ${url}`);
      }

      const json = await res.json();
      cacheRef.current.set(s, json);
      return json;
    } catch (err: any) {
      const msg = err?.message || "Failed to load PDP";
      setLastError(msg);
      throw err;
    }
  };

  const value = useMemo<ProductPdpContextValue>(
    () => ({
      fetchProductBySlug,
      getProductUrlForSlug,
      lastError,
    }),
    [lastError]
  );

  return (
    <ProductPdpContext.Provider value={value}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) {
    throw new Error("useProductPdp must be used within ProductPdpProvider");
  }
  return ctx;
}











 













 





