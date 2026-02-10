// src/screens/SingleProduct/SingleProduct.tsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProductPdp } from "../../pdp/ProductPdpContext";

export default function SingleProduct() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading, error, loadBySlug } = useProductPdp();

  useEffect(() => {
    if (slug) loadBySlug(slug);
  }, [slug]);

  if (loading) return <div style={{ padding: 40 }}>Loading product…</div>;
  if (error) return <div style={{ padding: 40, color: "red" }}>{error}</div>;
  if (!product) return null;

  return (
    <div style={{ padding: 40 }}>
      <h1>{product.title}</h1>
      <p>${product.price}</p>
      {product.image && <img src={product.image} style={{ maxWidth: 300 }} />}
    </div>
  );
}


























