import React from "react";
import categoryUrls from "../../../data/_category_urls.json";

type Category = {
  url: string;
  path: string;
  depth: number;
  parent: string | null;
  product_count: number;
};

export const ShopHubSection: React.FC = () => {
  // Top-level departments only
  const departments = (categoryUrls as Category[]).filter(
    (c) => c.parent === null && c.product_count > 0
  );

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 600,
          marginBottom: "24px",
        }}
      >
        All Departments
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {departments.map((cat) => (
          <a
            key={cat.path}
            href={cat.url}
            style={{
              display: "block",
              padding: "14px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              textDecoration: "none",
              color: "#111827",
              fontSize: "15px",
              fontWeight: 500,
              background: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            {formatCategoryName(cat.path)}
          </a>
        ))}
      </div>
    </section>
  );
};

// ---------- helpers ----------

function formatCategoryName(path: string): string {
  return path
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default ShopHubSection;


