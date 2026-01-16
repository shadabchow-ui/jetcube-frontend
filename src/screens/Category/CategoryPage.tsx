import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Product = {
  id?: string;
  title?: string;
  image?: string;
  price?: number;
};

type CategoryData = {
  category?: string;
  products: Product[];
};

const R2_BASE = "https://ventari.net/indexes/category_products";

export default function CategoryPage(): JSX.Element {
  const params = useParams();
  const categoryPath = (params["*"] ?? "").replace(/^\/+/, "");

  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadCategory() {
      setLoading(true);
      setNotFound(false);

      // Preferred: nested folder path
      // home-and-kitchen/heating-cooling → home-and-kitchen/heating-cooling.json
      const slashFilename = `${categoryPath}.json`;

      // Fallback: flattened naming
      // home-and-kitchen/heating-cooling → home-and-kitchen__heating-cooling.json
      const flatFilename = `${categoryPath.replace(/\//g, "__")}.json`;

      try {
        // 1) Try slash-path first
        let res = await fetch(`${R2_BASE}/${encodeURI(slashFilename)}`);

        // 2) If not found, try flattened fallback
        if (!res.ok) {
          res = await fetch(`${R2_BASE}/${encodeURI(flatFilename)}`);
        }

        if (!res.ok) {
          throw new Error("Category not found");
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Category load failed:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (categoryPath) {
      loadCategory();
    } else {
      setLoading(false);
      setNotFound(true);
    }
  }, [categoryPath]);

  if (loading) {
    return <div className="category-loading">Loading…</div>;
  }

  if (notFound) {
    return (
      <div className="category-not-found">
        <h1>Category not found</h1>
        <p>This category is not available yet.</p>
      </div>
    );
  }

  if (!data || !data.products || data.products.length === 0) {
    return (
      <div className="category-empty">
        <h1>No products found</h1>
      </div>
    );
  }

  return (
    <section className="category-page">
      <h1 className="category-title">
        {data.category ??
          categoryPath
            .split("/")
            .pop()
            ?.replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())}
      </h1>

      <div className="category-grid">
        {data.products.map((product, index) => (
          <div key={index} className="product-card">
            {/* Replace with your real ProductCard later */}
            <img src={product.image} alt={product.title} loading="lazy" />
            <div className="product-title">{product.title}</div>
            {product.price && (
              <div className="product-price">${product.price.toFixed(2)}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
