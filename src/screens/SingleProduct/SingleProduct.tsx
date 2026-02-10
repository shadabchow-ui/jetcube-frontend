import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useProductPdp } from "../../pdp/ProductPdpContext";

/**
 * Diagnostic base urls (safe + optional).
 * Keeping these here helps you debug in the UI if needed.
 */
const PUBLIC_R2_BASE_URL =
  (import.meta as any).env?.VITE_PUBLIC_R2_BASE_URL ||
  (import.meta as any).env?.VITE_R2_PUBLIC_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

const PRODUCTS_BASE_URL =
  (import.meta as any).env?.VITE_PRODUCTS_BASE_URL ||
  (import.meta as any).env?.VITE_R2_PRODUCTS_BASE_URL ||
  `${PUBLIC_R2_BASE_URL}/products/`;

const PDP_INDEX_BASE_URL =
  (import.meta as any).env?.VITE_PDP_INDEX_BASE_URL ||
  (import.meta as any).env?.VITE_R2_PDP_INDEX_BASE_URL ||
  `${PUBLIC_R2_BASE_URL}/indexes/pdp2/`;

function cleanSlug(input: string) {
  return (input || "").trim().replace(/^\/+|\/+$/g, "");
}

export default function SingleProduct() {
  const params = useParams();
  const slug = (params as any)?.slug || "";
  const clean = useMemo(() => cleanSlug(slug), [slug]);

  const { fetchProductBySlug, lastError } = useProductPdp();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setFetchError(null);
      setProduct(null);

      try {
        const p = await fetchProductBySlug(clean);
        if (!cancelled) setProduct(p);
      } catch (e: any) {
        if (!cancelled) {
          setFetchError(e?.message || "Failed to load product");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (clean) run();
    else {
      setIsLoading(false);
      setFetchError("Missing product slug");
    }

    return () => {
      cancelled = true;
    };
  }, [clean, fetchProductBySlug]);

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Loading product…
        </div>
        <div style={{ opacity: 0.75, marginTop: 6 }}>
          Pulling product JSON from R2…
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          <div>
            <strong>PRODUCTS_BASE_URL:</strong> {PRODUCTS_BASE_URL}
          </div>
          <div>
            <strong>PDP_INDEX_BASE_URL:</strong> {PDP_INDEX_BASE_URL}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || lastError || !product) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            padding: 16,
            border: "1px solid rgba(255,0,0,0.25)",
            borderRadius: 12,
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
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Slug</div>
            <code>{clean}</code>
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              opacity: 0.7,
              wordBreak: "break-all",
            }}
          >
            <div>
              <strong>PRODUCTS_BASE_URL:</strong> {PRODUCTS_BASE_URL}
            </div>
            <div>
              <strong>PDP_INDEX_BASE_URL:</strong> {PDP_INDEX_BASE_URL}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images: string[] =
    Array.isArray(product?.images) && product.images.length
      ? product.images
      : [];

  const price =
    product?.price ??
    product?.price_num ??
    product?.variants?.[0]?.price ??
    null;

  const title = product?.title || product?.name || clean;
  const description =
    product?.description ||
    product?.body_html ||
    product?.details ||
    "";

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Images */}
        <div>
          {images.length ? (
            <img
              src={images[0]}
              alt={title}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: "100%",
                paddingTop: "70%",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                  alt={`${title} ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: 56,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>
            {title}
          </div>

          <div style={{ marginTop: 10, fontSize: 20, fontWeight: 700 }}>
            {price !== null ? `$${Number(price).toFixed(2)}` : "Price unavailable"}
          </div>

          <div style={{ marginTop: 14, opacity: 0.8, fontSize: 13 }}>
            <div>
              <strong>Slug:</strong> {clean}
            </div>
            <div style={{ wordBreak: "break-all" }}>
              <strong>PRODUCTS_BASE_URL:</strong> {PRODUCTS_BASE_URL}
            </div>
            <div style={{ wordBreak: "break-all" }}>
              <strong>PDP_INDEX_BASE_URL:</strong> {PDP_INDEX_BASE_URL}
            </div>
          </div>

          {description ? (
            <div style={{ marginTop: 18, lineHeight: 1.6, opacity: 0.9 }}>
              {typeof description === "string" ? description : JSON.stringify(description)}
            </div>
          ) : (
            <div style={{ marginTop: 18, opacity: 0.7 }}>
              No description available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
























