import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

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

const R2_BASE = "https://ventari.net/indexes";
const CATEGORY_PRODUCTS_BASE = `${R2_BASE}/category_products`;

export default function CategoryPage(): JSX.Element {
  const location = useLocation();

  // Build slug directly from URL path
  const slug = location.pathname
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\//g, "-");

  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadCategory() {
      setLoading(true);
      setNotFound(false);

      try {
        const res = await fetch(
          `${CATEGORY_PRODUCTS_BASE}/${slug}.json`
        );

        if (!res.ok) {
          throw new Error("Category JSON not found");
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

    if (slug) {
      loadCategory();
    } else {
      setLoading(false);
      setNotFound(true);
    }
  }, [slug]);

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
          slug
            .split("-")
            .slice(-1)[0]
            .replace(/\b\w/g, (c) => c.toUpperCase())}
      </h1>

      <div className="category-grid">
        {data.products.map((product, index) => (
          <div key={index} className="product-card">
            <img
              src={product.image}
              alt={product.title}
              loading="lazy"
            />
            <div className="product-title">{product.title}</div>
            {product.price !== undefined && (
              <div className="product-price">
                ${product.price.toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
