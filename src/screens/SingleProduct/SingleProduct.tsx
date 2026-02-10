import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useProductPdp } from "../../pdp/ProductPdpContext";

// We re-declare this here just for display purposes in the debug section
const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_R2_PRODUCTS_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/products";

export default function SingleProduct() {
  const { slug } = useParams<{ slug: string }>();

  const { preloadShardForSlug, fetchProductBySlug, lastError, clearError } =
    useProductPdp();

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Normalize slug once
  const cleanSlug = useMemo(() => (slug ? slug.trim() : ""), [slug]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cleanSlug) {
        setFetchError("Product not found (missing slug).");
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);
      setProduct(null);
      clearError();

      try {
        // 1. Preload the shard to ensure we have the map
        await preloadShardForSlug(cleanSlug);

        // 2. Fetch the actual product data
        const { data } = await fetchProductBySlug(cleanSlug);
        
        if (cancelled) return;

        if (data) {
          setProduct(data);
        } else {
          throw new Error("Product data was empty");
        }
        
        setLoading(false);
      } catch (err: any) {
        if (cancelled) return;

        const msg =
          err?.message ||
          "Product failed to load. The product JSON may be missing, or the index map does not contain this slug.";

        setFetchError(msg);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [cleanSlug, preloadShardForSlug, fetchProductBySlug, clearError]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Loading…
        </div>
        <div style={{ opacity: 0.75 }}>
          Pulling product JSON from R2…
        </div>
      </div>
    );
  }

  // Error State
  if (fetchError || lastError || !product) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            padding: 16,
            border: "1px solid rgba(255,0,0,0.25)",
            borderRadius: 12,
            backgroundColor: "rgba(255,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "#b91c1c" }}>
            Product failed to load
          </div>
          <div style={{ marginTop: 8 }}>
            {fetchError || lastError || "Unknown error"}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              opacity: 0.85,
              wordBreak: "break-all",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Slug
            </div>
            <code>{cleanSlug}</code>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Logic ---

  const images: string[] =
    Array.isArray(product?.images) && product.images.length
      ? product.images
      : [];

  const price =
    product?.price ??
    product?.price_num ??
    product?.variants?.[0]?.price ??
    null;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left Column: Images */}
        <div>
          {images.length ? (
            <img
              src={images[0]}
              alt={product?.title || cleanSlug}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.08)",
              }}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: "100%",
                paddingTop: "70%",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.08)",
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f9f9f9"
              }}
            >
              No image
            </div>
          )}

          {images.length > 1 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 10,
                marginTop: 12,
              }}
            >
              {images.slice(0, 10).map((src, idx) => (
                <img
                  key={`${src}-${idx}`}
                  src={src}
                  alt={`${product?.title || cleanSlug} ${idx + 1}`}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.08)",
                    cursor: "pointer"
                  }}
                  loading="lazy"
                  onClick={() => {
                      // Optional: You could add state here to change the main image
                      // but for now we just render them.
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Right Column: Details */}
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            {product?.title || cleanSlug}
          </h1>

          {product?.brand ? (
            <div style={{ marginTop: 6, opacity: 0.8 }}>
              Brand: {product.brand}
            </div>
          ) : null}

          {price != null ? (
            <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700 }}>
              {typeof price === 'number' ? `$${price.toFixed(2)}` : price}
            </div>
          ) : null}

          {product?.description ? (
            <p style={{ marginTop: 12, opacity: 0.9, lineHeight: 1.45 }}>
              {product.description}
            </p>
          ) : null}

          {Array.isArray(product?.about_this_item) &&
          product.about_this_item.length ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                About this item
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.92 }}>
                {product.about_this_item.slice(0, 12).map((t: string, i: number) => (
                  <li key={`${i}-${t}`} style={{ marginBottom: 6 }}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Debug / Source Info */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #eee", fontSize: 12, opacity: 0.7 }}>
            <div style={{ marginBottom: 4 }}>
               Source base: <code>{PRODUCTS_BASE_URL}</code>
            </div>
            <details>
                <summary style={{ cursor: 'pointer' }}>Raw JSON</summary>
                <pre style={{ marginTop: 8, overflow: 'auto', maxHeight: 200, background: '#f5f5f5', padding: 8, borderRadius: 6 }}>
                    {JSON.stringify(product, null, 2)}
                </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}





















