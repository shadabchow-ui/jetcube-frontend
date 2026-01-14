// src/screens/HomeRow.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "./ProductCard";

export type HomeRowItem = {
  slug?: string;
  handle?: string;
  url_slug?: string;

  title?: string;
  brand?: string;

  // image variants (cards often differ)
  image?: string | null;
  img?: string | null;
  thumbnail?: string | null;
  thumb?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;

  images?: any; // string[] or {src/url}[]
  price?: number | string | null;
  rating?: number | string | null;
  reviews?: number | string | null;
};

type Props = {
  title: string;
  items: HomeRowItem[];
  viewAllHref?: string; // e.g. "/c/womens-clothing"
  className?: string;
};

export function HomeRow({ title, items, viewAllHref, className }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className={className} style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h2>

        {viewAllHref ? (
          <Link
            to={viewAllHref}
            style={{ fontSize: 12, textDecoration: "none" }}
          >
            View all
          </Link>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(190px, 1fr)",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {items.map((p, idx) => (
          <ProductCard key={(p.slug || p.handle || p.url_slug || "") + idx} product={p} />
        ))}
      </div>
    </section>
  );
}

export default HomeRow;
