import React from "react";
import ProductCard from "../../components/ProductCard";

export type ProductCardData = {
  slug: string;
  title: string;
  brand?: string;
  category?: string;
  image?: string | null;
  price?: string | null;
};

type Props = {
  title: string;
  items: ProductCardData[];
  viewAllHref: string;
};

const HomeRow = ({ title, items, viewAllHref }: Props) => {
  const safeItems = Array.isArray(items) ? items : [];

  const filteredItems = safeItems.filter(
    (p) => p && typeof p === "object" && (p.slug || (p as any).handle)
  );

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <a
          href={viewAllHref}
          className="text-[12px] opacity-70 hover:opacity-100 underline underline-offset-4"
        >
          View all
        </a>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-[12px] opacity-60 py-6">
          No items loaded for this row yet.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {filteredItems.slice(0, 20).map((p) => (
            <div key={(p as any).slug || (p as any).handle} className="shrink-0">
              <ProductCard p={p as any} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default HomeRow;

