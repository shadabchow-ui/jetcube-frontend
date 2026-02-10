import React, { createContext, useContext, useEffect, useState } from "react";

export type Product = {
  id: string;
  title: string;
  price?: number;
  images?: string[];
  long_description?: string;
  [key: string]: any;
};

const ProductPdpContext = createContext<Product | null>(null);

const R2_BASE = "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

export function ProductPdpProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${R2_BASE}/products/${slug}.json.gz`;

    fetch(url)
      .then(async (res) => {
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Expected JSON from ${url}, got ${ct}. Body: ${text.slice(0, 200)}`);
        }
        return res.json();
      })
      .then(setProduct)
      .catch((err) => {
        console.error("❌ PDP fetch failed:", err);
        setError(err.message);
      });
  }, [slug]);

  if (error) return <div className="p-8 text-red-500">Product failed to load: {error}</div>;
  if (!product) return <div className="p-8">Loading product…</div>;

  return (
    <ProductPdpContext.Provider value={product}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export function useProductPdp() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) throw new Error("useProductPdp must be used inside ProductPdpProvider");
  return ctx;
}













 













 





