import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type CategoryData = {
  products: any[];
  category?: string;
};

const R2_BASE =
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/products/category_products";

export default function CategoryPage(): JSX.Element {
  const { categoryPath = "" } = useParams();

  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);

      // Convert URL path → R2 filename
      // appliances/ranges-ovens-cooktops
      // → appliances__ranges-ovens-cooktops.json
      const filename =
        categoryPath.replace(/\//g, "__") + ".json";

      try {
        const res = await fetch(`${R2_BASE}/${filename}`);

        if (!res.ok) {
          throw new Error("Not found");
        }

        const json = await res.json();
        setData(json);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    load();
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

  if (!data || !data.products?.length) {
    return (
      <div className="category-empty">
        <h1>No products found</h1>
      </div>
    );
  }

  return (
    <section className="category-page">
      <h1 className="category-title">
        {data.category ?? categoryPath.replace(/-/g, " ")}
      </h1>

      <div className="category-grid">
        {data.products.map((p, i) => (
          <div key={i} className="product-card">
            {/* Replace with your real ProductCard */}
            <pre>{JSON.stringify(p, null, 2)}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}
