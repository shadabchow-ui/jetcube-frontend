import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { R2_PUBLIC_BASE, useProductPdpContext } from "../../pdp/ProductPdpContext";

export default function SingleProduct() {
  const { slug } = useParams();
  const { loadIndexOnce } = useProductPdpContext();

  const [product, setProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!slug) return;

        const index = await loadIndexOnce();
        const item = index.find((i) => i.slug === slug);

        if (!item) throw new Error("Product not found in index");

        const url = `${R2_PUBLIC_BASE}/${item.path}`;

        const res = await fetch(url);
        const text = await res.text();

        if (text.trim().startsWith("<")) {
          throw new Error("Got HTML instead of JSON (R2 file missing)");
        }

        const data = JSON.parse(text);
        if (!cancelled) setProduct(data);
      } catch (e: any) {
        console.error("PDP load error:", e);
        if (!cancelled) setError(e.message || "Failed to load product");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, loadIndexOnce]);

  if (error) {
    return <div style={{ padding: 40, color: "red" }}>Product failed to load: {error}</div>;
  }

  if (!product) {
    return <div style={{ padding: 40 }}>Loading product…</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>{product.title}</h1>
      <pre style={{ maxWidth: 900, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}






























