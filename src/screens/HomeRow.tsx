import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

export type ProductCardData = {
  handle?: string;
  slug?: string;
  title?: string;
  image?: string;
  price?: number;
  wasPrice?: number;
  rating?: number;
  ratingCount?: number;
  badge?: string;
  [key: string]: any;
};

type Props = {
  title: string;
  items: ProductCardData[];
  viewAllHref?: string;
};

const HomeRow = ({ title, items, viewAllHref }: Props): JSX.Element => {
  const safeItems = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    // Filter out undefined/null and anything without handle/slug
    return arr.filter((x) => {
      if (!x) return false;
      const h = (x as any).handle ?? (x as any).slug;
      return typeof h === "string" && h.length > 0;
    });
  }, [items]);

  return (
    <section className="bg-white rounded-md border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          {title}
        </h2>

        {viewAllHref ? (
          <Link to={viewAllHref} className="text-sm text-blue-700 hover:underline">
            View all
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Grid */}
      <div className="px-3 pb-4">
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-6
            xl:grid-cols-8
            gap-3
          "
        >
          {safeItems.map((p, idx) => {
            const key = String((p as any).handle ?? (p as any).slug ?? idx);
            return (
              <div key={key} className="w-full">
                <ProductCard p={p as any} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeRow;







