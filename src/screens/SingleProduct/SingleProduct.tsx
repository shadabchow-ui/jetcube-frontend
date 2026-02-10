import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

// NOTE: Cloudflare Pages builds on Linux (case-sensitive).
// The PDP context lives in src/pdp/, so import it from there (not a local ./ProductPdpContext file).
import { useProductPdp } from "../../pdp/ProductPdpContext";

// ✅ NEW (parity / debug): PDP shard directory
const PDP_INDEX_BASE_URL =
  (import.meta as any).env?.VITE_PDP_INDEX_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/pdp2/";

type ProductJson = any;

function safeTitle(p: any): string {
  return (
    p?.title ||
    p?.name ||
    p?.product_title ||
    p?.productName ||
    p?.handle ||
    "Product"
  );
}

function safePrice(p: any): string | null {
  const v =
    p?.price ??
    p?.price_current ??
    p?.current_price ??
    p?.sale_price ??
    p?.pricing?.price ??
    null;

  if (v == null) return null;
  if (typeof v === "number") return `$${v.toFixed(2)}`;
  return String(v);
}

function pickImages(p: any): string[] {
  const imgs =
    p?.images || p?.image_urls || p?.imageUrls || p?.media || p?.gallery || [];

  if (Array.isArray(imgs)) {
    return imgs
      .map((x) => (typeof x === "string" ? x : x?.url || x?.src))
      .filter(Boolean);
  }

  return [];
}

export function SingleProduct() {
  const { slug = "" } = useParams();
  const { getUrlForSlug, preloadShardForSlug, lastError, clearError } =
    useProductPdp();

  const [loading, setLoading] = useState(true);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductJson | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setLoading(true);
    setProduct(null);
    setProductUrl(null);
    setNotFound(false);
    setFetchError(null);

    let cancelled = false;

    (async () => {
      // Preload shard for faster resolution (optional)
      await preloadShardForSlug(slug);

      const url = await getUrlForSlug(slug);
      if (cancelled) return;

      if (!url) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProductUrl(url);
      setFetchError(null);

      try {
        // CHANGED: "force-cache" -> "default" to prevent stuck stale data
        const res = await fetch(url, { cache: "default" });
        if (!res.ok) throw new Error(`Failed to load product: ${res.status}`);

        const json = await res.json();
        if (cancelled) return;

        setProduct(json);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setFetchError(e?.message || "Failed to load product JSON");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, getUrlForSlug, preloadShardForSlug, clearError]);

  const title = useMemo(() => (product ? safeTitle(product) : ""), [product]);
  const price = useMemo(() => (product ? safePrice(product) : null), [product]);
  const images = useMemo(() => (product ? pickImages(product) : []), [product]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0 }}>Loading…</h2>
        <p style={{ opacity: 0.7, marginTop: 8 }}>
          Resolving PDP path for <code>{slug}</code>
        </p>
        <p style={{ opacity: 0.55, marginTop: 6, fontSize: 12 }}>
          Shards: <code>{PDP_INDEX_BASE_URL}</code>
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0 }}>Not found</h2>
        <p style={{ opacity: 0.75, marginTop: 8 }}>
          No PDP URL found for <code>{slug}</code>.
        </p>

        {lastError ? (
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              background: "rgba(0,0,0,0.06)",
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {lastError}
          </pre>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        {price ? <span style={{ opacity: 0.8 }}>{price}</span> : null}
      </div>

      {productUrl ? (
        <p style={{ marginTop: 10, opacity: 0.7 }}>
          Source:{" "}
          <a href={productUrl} target="_blank" rel="noreferrer">
            {productUrl}
          </a>
        </p>
      ) : null}

      {images.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {images.slice(0, 12).map((src, i) => (
            <div
              key={`${src}-${i}`}
              style={{
                borderRadius: 10,
                overflow: "hidden",
                background: "rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: 160, objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      ) : null}

      <details style={{ marginTop: 18 }}>
        <summary style={{ cursor: "pointer" }}>Raw JSON</summary>
        <pre
          style={{
            marginTop: 10,
            padding: 12,
            background: "rgba(0,0,0,0.06)",
            borderRadius: 8,
            overflow: "auto",
            maxHeight: 520,
          }}
        >
          {JSON.stringify(product, null, 2)}
        </pre>
      </details>

      {fetchError ? (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "rgba(255,0,0,0.06)",
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {fetchError}
        </pre>
      ) : null}
      {lastError ? (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "rgba(255,0,0,0.06)",
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {lastError}
        </pre>
      ) : null}
    </div>
  );
}

// ✅ Provide a default export so src/screens/SingleProduct/index.ts can do:
// export { default as SingleProduct } from "./SingleProduct";
export default SingleProduct;




















