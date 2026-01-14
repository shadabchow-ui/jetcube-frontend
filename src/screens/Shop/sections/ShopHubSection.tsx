import React, { useEffect, useState } from "react";

type Category = {
  url: string;
  path: string;
  depth: number;
  parent: string | null;
  product_count: number;
};

export function ShopHubSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/category_urls.json")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: 40 }}>Loading departments…</div>;
  }

  // Top-level categories only (depth === 1)
  const topLevel = categories.filter((c) => c.depth === 1);

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 32 }}>
        All Departments
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 32,
        }}
      >
        {topLevel.map((cat) => (
          <div key={cat.path}>
            <a
              href={cat.url}
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#007185",
                textDecoration: "none",
              }}
            >
              {cat.path.replace(/-/g, " ")}
            </a>

            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {cat.product_count.toLocaleString()} products
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
