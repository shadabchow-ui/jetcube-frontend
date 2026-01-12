import React from "react";
import ProductCard, { type ProductCardData } from "../components/ProductCard";
import { Link } from "react-router-dom";

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function firstNonEmpty(...vals: unknown[]): string {
  for (const v of vals) {
    const s = safeStr(v).trim();
    if (s) return s;
  }
  return "";
}

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Props = {
  title: string;
  items: ProductCardData[];
  viewAllHref?: string;
  query?: string;
};

const HomeRow: React.FC<Props> = ({ title, items, viewAllHref = "/shop", query = "" }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  const q = normalizeText(query);

  const itemsFiltered = q
    ? items.filter((i) => {
        if (!i || typeof i !== "object") return false;
        const t = normalizeText(firstNonEmpty(i.title, i.name));
        const c = normalizeText(firstNonEmpty((i as any).category, (i as any).category_path));
        const b = normalizeText(firstNonEmpty((i as any).brand));
        return t.includes(q) || c.includes(q) || b.includes(q);
      })
    : items;

  // If query filters everything out, don’t render an empty row shell
  if (itemsFiltered.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <Link to={viewAllHref} className="text-sm text-white/70 hover:text-white">
          View all
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {itemsFiltered.map((item, idx) => {
          const key =
            firstNonEmpty(item.handle, (item as any).slug, (item as any).url_slug) || `idx-${idx}`;
          return <ProductCard key={key} item={item} />;
        })}
      </div>
    </section>
  );
};

export default HomeRow;
