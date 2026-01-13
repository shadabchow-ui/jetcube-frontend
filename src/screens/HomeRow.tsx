// src/screens/HomeRow.tsx
import React, { useMemo, useRef } from "react";
import ProductCard, { ProductCardData } from "../components/ProductCard";

type Props = {
  title: string;
  items: ProductCardData[];
  viewAllHref?: string;
};

export default function HomeRow({ title, items, viewAllHref }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  // If the row has no items, don’t render the empty strip (keeps Home clean)
  if (safeItems.length === 0) return null;

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(320, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 mt-8">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="text-white">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {viewAllHref ? (
            <a
              href={viewAllHref}
              className="text-sm text-white/70 hover:text-white underline underline-offset-4"
            >
              View all
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            className="w-9 h-9 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30"
            aria-label="Scroll left"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            className="w-9 h-9 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: "none" as any }}
      >
        {safeItems.map((p) => (
          <div key={p.handle} className="min-w-[160px] w-[160px] sm:min-w-[190px] sm:w-[190px]">
            <ProductCard item={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
