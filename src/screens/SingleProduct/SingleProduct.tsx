// src/screens/SingleProduct/SingleProduct.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PRODUCTS_BASE_URL, useProductPdp } from "../../pdp/ProductPdpContext";

export default function SingleProduct() {
  const { slug } = useParams();
  const { index, loading: indexLoading } = useProductPdp();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!indexLoading && index && slug) {
      const match = index.find((p) => p.slug === slug);

      if (!match) {
        setError("Product not found in index");
        return;
      }

      const url = `${PRODUCTS_BASE_URL}${match.path}`;

      fetch(url, {
        headers: { "Accept-Encoding": "gzip" },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`PDP fetch failed: ${res.status}`);
          return res.json();
        })
        .then(setProduct)
        .catch((e) => setError(e.message));
    }
  }, [indexLoading, index, slug]);

  if (indexLoading) return <div>Loading…</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!product) return null;

  return (
    <div>
      <h1>{product.title}</h1>
      <img src={product.image} />
      <pre>{JSON.stringify(product, null, 2)}</pre>
    </div>
  );
}

























