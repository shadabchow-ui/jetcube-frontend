import React, { useMemo } from "react";
import ProductCard from "../components/ProductCard";

type HomeRowProps = {
  title: string;
  subtitle?: string;
  products?: any[];
  limit?: number;
};

const HomeRow: React.FC<HomeRowProps> = ({
  title,
  subtitle,
  products,
  limit = 12,
}) => {
  // 🔒 HARD GUARD — never assume shape
  const items = useMemo(() => {
    if (!products) return [];

    if (Array.isArray(products)) return products;

    // tolerate wrapped shapes
    if (Array.isArray((products as any)?.items))
      return (products as any).items;

    if (Array.isArray((products as any)?.results))
      return (products as any).results;

    return [];
  }, [products]);

  const visible = items.slice(0, limit);

  // ❗ If still empty, fail silently (no crash)
  if (!visible.length) return null;

  return (
    <section className="mt-8 px-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {visible.map((p, i) => {
          if (!p?.handle && !p?.slug) return null;

          return (
            <ProductCard
              key={p.handle || p.slug || i}
              p={{
                ...p,
                handle: p.handle || p.slug, // 🔑 normalize routing
              }}
            />
          );
        })}
      </div>
    </section>
  );
};

export default HomeRow;









