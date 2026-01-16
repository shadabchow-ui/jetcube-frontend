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

type CategoryIndex = Record<string, string>;

const R2_BASE = "https://ventari.net/indexes";
const CATEGORY_PRODUCTS_BASE = `${R2_BASE}/category_products`;
const CATEGORY_INDEX_URL = `${R2_BASE}/category_urls.json`;

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

      try {
        // 1️⃣ Load category → filename index
        const indexRes = await fetch(CATEGORY_INDEX_URL);
        if (!indexRes.ok) throw new Error("Category index missing");

        const index: CategoryIndex = await indexRes.json();

        // 2️⃣ Resolve exact filename
        const filename = index[categoryPath];
        if (!filename) throw new Error("Category not indexed");

        // 3️⃣ Fetch category products JSON
        const res = await fetch(`${CATEGORY_PRODUCTS_BASE}/${filename}`);
        if (!res.ok) throw new Error("Category JSON missing");

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
            <img src={product.image} alt={product.title} loading="lazy" />
            <div className="product-title">{product.title}</div>
            {product.price && (
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
