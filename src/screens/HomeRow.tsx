// src/screens/HomeRow.tsx
import React, { useMemo } from "react";
import ProductCard, { type ProductLike } from "../components/ProductCard";

type Props = {
  title: string;
  products?: ProductLike[];
  viewAllHref?: string; // ex: "/shop" or "/c/womens-clothing"
  className?: string;
};

function asArray<T>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function HomeRow({ title, products, viewAllHref, className = "" }: Props) {
  const items = useMemo(() => asArray<ProductLike>(products), [products]);

  return (
    <section className={"w-full " + className}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[14px] font-semibold text-[#111]">{title}</div>
        {viewAllHref ? (
          <a href={viewAllHref} className="text-[12px] text-[#6b6b6b] hover:underline">
            View all
          </a>
        ) : (
          <div className="text-[12px] text-transparent select-none">View all</div>
        )}
      </div>

      <div className="rounded-[8px] border border-[#e6e6e6] bg-white p-3">
        {items.length === 0 ? (
          <div className="text-[12px] text-[#6b6b6b]">No products found for this row.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {items.map((p, idx) => {
                // keep keys stable even if no slug
                const key = (p.slug || p.handle || p.url_slug || "") + ":" + idx;
                return (
                  <div key={key} className="w-[160px] shrink-0">
                    <ProductCard product={p} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeRow;
