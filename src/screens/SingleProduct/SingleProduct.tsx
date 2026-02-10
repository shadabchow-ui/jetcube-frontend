import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductPdpProvider } from "../pdp/ProductPdpContext";

type Product = {
  handle: string;
  title: string;
  price: number;
  images: string[];
  description: string;
  long_description?: string;
  reviews?: any[];
};

const PDP_INDEX_BASE_URL =
  (import.meta as any).env?.VITE_PDP_INDEX_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/pdp2/";

export default function SingleProduct(): JSX.Element {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;

    const shard = `${handle[0]}-.json.gz`;
    const indexUrl = `${PDP_INDEX_BASE_URL}${shard}`;

    fetch(indexUrl)
      .then((r) => {
        if (!r.ok) throw new Error("Index shard not found");
        return r.arrayBuffer();
      })
      .then((buf) => {
        const text = new TextDecoder().decode(buf);
        const map = JSON.parse(text);
        const productUrl = map[handle];
        if (!productUrl) throw new Error("Product not in index");

        return fetch(productUrl).then((r) => {
          if (!r.ok) throw new Error("Product JSON missing");
          return r.arrayBuffer();
        });
      })
      .then((buf) => {
        const text = new TextDecoder().decode(buf);
        const data = JSON.parse(text);
        setProduct(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load product");
      });
  }, [handle]);

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-red-500">
        Product failed to load: {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        Loading product…
      </div>
    );
  }

  return (
    <ProductPdpProvider product={product}>
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <h1 className="text-3xl font-semibold">{product.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <img
            src={product.images?.[0]}
            alt={product.title}
            className="w-full rounded-lg"
          />
          <div>
            <p className="text-xl font-semibold">${product.price}</p>
            <p className="mt-4 text-gray-600 whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </ProductPdpProvider>
  );
}






















