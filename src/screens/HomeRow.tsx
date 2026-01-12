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
  items?: ProductCardData[];
  viewAllHref?: string;
};

const HomeRow = ({ title, items = [], viewAllHref }: Props): JSX.Element => {
  // Be permissive — only remove null/undefined
  const safeItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter(Boolean);
  }, [items]);

  if (safeItems.length === 0) {
    return null; // prevents empty white boxes
  }

  return (
    <section className="bg-white rounded-md border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          {title}
        </h2>

        {viewAllHref ? (
          <Link
            to={viewAllHref}
            className="text-sm text-blue-700 hover:underline"
          >
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
            const key =
              p.handle ||
              p.slug ||
              p.id ||
              `${title.replace(/\s+/g, "-")}-${idx}`;

            return (
              <div key={key} className="w-full">
                <ProductCard p={p} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeRow;








