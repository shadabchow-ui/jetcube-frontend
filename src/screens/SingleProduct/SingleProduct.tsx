import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useProductPdp } from "../pdp/ProductPdpContext";

/**
 * PDP screen:
 * - Pulls slug from route
 * - Preloads the shard map for the slug (fast)
 * - Fetches the product JSON via ProductPdpContext (resolves batch path + handles .json.gz)
 */

export default function SingleProduct() {
  const { slug } = useParams();
  const { product, isLoading, error, preloadShardForSlug, fetchProductBySlug } = useProductPdp();

  const cleanSlug = useMemo(() => {
    const raw = (slug ?? "").trim();
    try {
      return decodeURIComponent(raw).trim().toLowerCase();
    } catch {
      return raw.toLowerCase();
    }
  }, [slug]);

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLocalError(null);

      if (!cleanSlug) {
        setLocalError("Missing product slug");
        return;
      }

      try {
        // Small optimization: load the shard index first
        await preloadShardForSlug(cleanSlug);

        // Then load the product
        await fetchProductBySlug(cleanSlug);
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === "AbortError") return;
        setLocalError(e?.message || "Failed to load product");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [cleanSlug, preloadShardForSlug, fetchProductBySlug]);

  if (localError || error) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ background: "#2b0b0b", border: "1px solid #6b1a1a", padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Product failed to load</div>
          <div style={{ opacity: 0.9 }}>{localError || error}</div>
          <div style={{ marginTop: 10, opacity: 0.8, fontSize: 12 }}>
            Slug: <code>{cleanSlug || "(empty)"}</code>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div style={{ padding: 16, opacity: 0.9 }}>
        Loading product…
      </div>
    );
  }

  // Render your existing PDP layout here.
  // Keeping this minimal since you already have the full PDP UI in your codebase.
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: 0, marginBottom: 8 }}>{product?.title || product?.name || "Untitled product"}</h2>
      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        {product?.brand ? <span>Brand: {product.brand}</span> : null}
      </div>

      <pre style={{ whiteSpace: "pre-wrap", opacity: 0.9 }}>
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}





















