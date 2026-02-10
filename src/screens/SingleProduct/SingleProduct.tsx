import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductPdpProvider, useProductPdp } from "../../pdp/ProductPdpContext";

function cleanSlug(input: string) {
  return (input || "").trim().replace(/^\/+|\/+$/g, "");
}

function SingleProductInner() {
  const params = useParams();
  const raw =
    (params as any)?.handle ||
    (params as any)?.slug ||
    "";
  const handle = useMemo(() => cleanSlug(raw), [raw]);

  const { fetchProductBySlug, getProductUrlForSlug, lastError } = useProductPdp();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setFetchError(null);
      setProduct(null);

      try {
        const p = await fetchProductBySlug(handle);
        if (!cancelled) setProduct(p);
      } catch (e: any) {
        if (!cancelled) setFetchError(e?.message || "Failed to load product");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (handle) run();
    else {
      setIsLoading(false);
      setFetchError("Missing product handle/slug in route");
    }

    return () => {
      cancelled = true;
    };
  }, [handle, fetchProductBySlug]);

  const resolvedUrl = useMemo(() => getProductUrlForSlug(handle), [handle, getProductUrlForSlug]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        Loading product…
      </div>
    );
  }

  if (fetchError || lastError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-[900px] w-full">
          <h1 className="text-xl font-semibold mb-2">PDP failed to load</h1>
          <div className="text-red-600 text-sm mb-4">
            {fetchError || lastError}
          </div>

          <div className="text-xs opacity-70 space-y-1">
            <div>
              <strong>Handle:</strong> {handle || "(missing)"}
            </div>
            <div>
              <strong>PRODUCTS_BASE_URL:</strong> {PRODUCTS_BASE_URL}
            </div>
            <div>
              <strong>Resolved URL:</strong> {resolvedUrl || "(null)"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        No product data.
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {product.title || product.name || handle}
        </h1>
        <div className="text-sm opacity-70 mt-1">
          {product.brand ? `Brand: ${product.brand}` : null}
        </div>
      </div>

      {/* Quick proof the correct JSON is loading */}
      <div className="text-xs opacity-70">
        <div><strong>Resolved URL:</strong> {resolvedUrl}</div>
      </div>

      {/* Minimal JSON view (keep for debugging; remove later) */}
      <pre className="bg-black/90 text-white text-xs rounded-lg p-4 overflow-auto">
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}

export default function SingleProduct() {
  return (
    <ProductPdpProvider>
      <SingleProductInner />
    </ProductPdpProvider>
  );
}
























