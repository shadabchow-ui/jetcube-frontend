import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

type HomeRowItem = {
  slug?: string;
  id?: string;
  asin?: string;
  title?: string;
  image?: string | null;
  price?: number | string | null;
  rating?: number | string | null;
  ratingCount?: number | string | null;
};

export function HomeRow({
  title,
  items,
  viewAllHref,
}: {
  title: string;
  items: HomeRowItem[];
  viewAllHref?: string;
}) {
  const list = Array.isArray(items) ? items : [];

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[16px] font-semibold text-[#0F1111]">{title}</div>

        {viewAllHref ? (
          <Link
            to={viewAllHref}
            className="text-[12px] text-[#007185] hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>

      <div className="w-full overflow-x-auto">
        <div className="flex gap-3 min-w-[900px]">
          {list.map((p, idx) => {
            const key = p.slug || p.id || p.asin || `${title}-${idx}`;
            return (
              <div key={key} className="w-[220px] shrink-0">
                <ProductCard product={p} />
              </div>
            );
          })}

          {list.length === 0 ? (
            <div className="text-[13px] text-[#565959] py-6">No items.</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default HomeRow;
