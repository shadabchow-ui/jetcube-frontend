import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PRODUCTS_BASE_URL, useProductIndex } from "../../pdp/ProductPdpContext";

export default function SingleProduct() {
  const { slug } = useParams();
  const { index, indexLoaded } = useProductIndex();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!indexLoaded || !slug) return;

    const item = index.find((i) => i.slug === slug);
    if (!item) {
      setError("Product not found in index");
      return;
    }

    const url = `${PRODUCTS_BASE_URL}/${item.path}`;

    fetch(url)
      .then((r) => r.json())
      .then(setProduct)
      .catch((e) => setError("Failed to load product JSON"));
  }, [indexLoaded, slug, index]);

  if (error) return <div>{error}</div>;
  if (!product) return <div>Loading…</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>{product.title}</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}



























