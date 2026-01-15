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
  const { categorySlug = "" } = useParams<{ categorySlug: string }>();

  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadCategory() {
      setLoading(true);
      setNotFound(false);

      // Convert URL path → R2 filename
      // home-and-kitchen/heating-cooling → home-and-kitchen__heating-cooling.json
      const filename = `${categorySlug.replace(/\//g, "__")}.json`;

      try {
        const res = await fetch(`${R2_BASE}/${filename}`);

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

    if (categorySlug) {
      loadCategory();
    }
  }, [categorySlug]);

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
          categorySlug
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
