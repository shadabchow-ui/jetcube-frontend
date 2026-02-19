// src/hooks/usePdpLoader.ts
import * as React from "react";
import { useParams } from "react-router-dom";
import { useProductPdp } from "../pdp/ProductPdpContext";

type UsePdpLoaderResult = {
  product: any | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

// Single-call PDP loader (preferred). Supports both {ok,data} and raw.
async function fetchPdpFromApi(handle: string): Promise<any | null> {
  const url = `/api/pdp/${encodeURIComponent(handle)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && typeof json === "object" && "data" in json && json.ok !== false) {
      return (json as any).data;
    }
    return json;
  } catch {
    return null;
  }
}

export function usePdpLoader(handleOverride?: string): UsePdpLoaderResult {
  const params = useParams();
  const handle = (handleOverride ?? (params as any)?.slug ?? "") as string;

  // If ProductRoute already loaded and provided product via context, prefer that.
  const ctxProduct = useProductPdp();

  const [product, setProduct] = React.useState<any | null>(ctxProduct ?? null);
  const [loading, setLoading] = React.useState<boolean>(!ctxProduct && !!handle);
  const [error, setError] = React.useState<string | null>(null);
  const [nonce, setNonce] = React.useState(0);

  const reload = React.useCallback(() => setNonce((n) => n + 1), []);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!handle) {
        setProduct(null);
        setLoading(false);
        setError("Missing product handle");
        return;
      }

      // Already available in context (best path)
      if (ctxProduct) {
        setProduct(ctxProduct);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      const apiProduct = await fetchPdpFromApi(handle);

      if (cancelled) return;

      if (!apiProduct) {
        setProduct(null);
        setLoading(false);
        setError("Product not found");
        return;
      }

      setProduct(apiProduct);
      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [handle, ctxProduct, nonce]);

  return { product, loading, error, reload };
}

export default usePdpLoader;
