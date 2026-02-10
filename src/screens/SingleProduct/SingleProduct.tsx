import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useProductPdp } from "../../pdp/ProductPdpContext";

type AnyRecord = Record<string, any>;

export default function SingleProduct(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();

  const { fetchProductBySlug, preloadShardForSlug, lastError, clearError } =
    useProductPdp();

  const [loading, setLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<AnyRecord | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string>("");

  const safeSlug = useMemo(() => (slug || "").trim(), [slug]);

  useEffect(() => {
    if (!safeSlug) return;
    // warm caches
    void preloadShardForSlug(safeSlug);
  }, [safeSlug, preloadShardForSlug]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!safeSlug) {
        setLoading(false);
        setProduct(null);
        setResolvedUrl("");
        return;
      }

      setLoading(true);
      clearError();

      try {
        const { url, data } = await fetchProductBySlug(safeSlug);
        if (cancelled) return;

        setResolvedUrl(url);
        setProduct(data);
      } catch {
        if (cancelled) return;
        setProduct(null);
        setResolvedUrl("");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [safeSlug, fetchProductBySlug, clearError]);

  if (!safeSlug) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Missing product</h2>
        <p>No slug provided.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Loading…</h2>
        <p>Fetching product: {safeSlug}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Couldn’t load product</h2>
        <p>Slug: {safeSlug}</p>
        {lastError ? (
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{lastError}</pre>
        ) : null}
      </div>
    );
  }

  // Flexible field mapping (your JSON may vary)
  const title =
    product?.title ||
    product?.name ||
    product?.product_title ||
    product?.productName ||
    safeSlug;

  const price =
    product?.price ||
    product?.sale_price ||
    product?.price_value ||
    product?.pricing?.price;

  const description =
    product?.description ||
    product?.body_html ||
    product?.product_description ||
    product?.desc ||
    "";

  const images: string[] =
    (Array.isArray(product?.images) ? product.images : []) ||
    (Array.isArray(product?.image_urls) ? product.image_urls : []) ||
    (Array.isArray(product?.media) ? product.media : []) ||
    [];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>{String(title)}</h1>

      {price != null ? (
        <p style={{ fontSize: 18, marginTop: 0 }}>
          <strong>${String(price)}</strong>
        </p>
      ) : null}

      {images?.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
          {images.slice(0, 8).map((src, idx) => (
            <img
              key={`${src}-${idx}`}
              src={String(src)}
              alt={String(title)}
              style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }}
              loading="lazy"
            />
          ))}
        </div>
      ) : (
        <p style={{ opacity: 0.7, marginTop: 16 }}>
          No images found in JSON (this is based on what fields exist in your product file).
        </p>
      )}

      {description ? (
        <div style={{ marginTop: 18, lineHeight: 1.6, maxWidth: 900 }}>
          <h3>Description</h3>
          <div
            dangerouslySetInnerHTML={{
              __html: String(description),
            }}
          />
        </div>
      ) : (
        <p style={{ opacity: 0.7, marginTop: 16 }}>
          No description field found in JSON.
        </p>
      )}

      <details style={{ marginTop: 18 }}>
        <summary>Debug</summary>
        {resolvedUrl ? (
          <p style={{ marginTop: 12 }}>
            <strong>Resolved URL:</strong> {resolvedUrl}
          </p>
        ) : null}
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
          {JSON.stringify(product, null, 2)}
        </pre>
      </details>
    </div>
  );
}























