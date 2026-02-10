import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductPdpProvider, useProductPdp } from "../../pdp/ProductPdpContext";

function clean(input: string) {
  return (input || "").trim();
}

function Inner() {
  const params = useParams();
  const raw = (params as any)?.handle || (params as any)?.slug || "";
  const handle = useMemo(() => clean(raw), [raw]);

  const { fetchProductByHandle, getUrlForHandle, lastError } = useProductPdp();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const resolvedUrl = useMemo(
    () => getUrlForHandle(handle),
    [handle, getUrlForHandle]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      setProduct(null);

      try {
        const data = await fetchProductByHandle(handle);
        if (!cancelled) setProduct(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (handle) run();
    else {
      setLoading(false);
      setErr("Missing :handle in route");
    }

    return () => {
      cancelled = true;
    };
  }, [handle, fetchProductByHandle]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading…</div>;
  }

  if (err || lastError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-[900px] w-full">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
            <div className="font-semibold mb-1">Product failed to load</div>
            <div className="text-sm">{err || lastError}</div>
            <div className="text-xs mt-3 opacity-80">
              <div><b>handle</b>: {handle || "(missing)"}</div>
              <div><b>resolved url</b>: {resolvedUrl || "(null)"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">{product?.title || handle}</h1>
      <div className="text-xs opacity-70">
        <b>Resolved URL:</b> {resolvedUrl}
      </div>

      {/* Debug JSON (remove later) */}
      <pre className="bg-black/90 text-white text-xs rounded-lg p-4 overflow-auto">
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}

export default function SingleProduct() {
  return (
    <ProductPdpProvider>
      <Inner />
    </ProductPdpProvider>
  );
}
























