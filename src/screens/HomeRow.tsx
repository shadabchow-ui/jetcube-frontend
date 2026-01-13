import React, { useMemo } from "react";
import { Link } from "react-router-dom";

export type ProductCardData = {
  handle?: string;
  slug?: string;
  url_slug?: string;
  title?: string;
  name?: string;
  image?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  price?: number | string | null;
  wasPrice?: number | string | null;
  compare_at_price?: number | string | null;
  rating?: number | string | null;
  ratingCount?: number | string | null;
  rating_count?: number | string | null;
  badge?: string | null;
  [key: string]: any;
};

type HomeRowProps = {
  title: string;
  items?: ProductCardData[];
  viewAllHref?: string;
  className?: string;
};

function toNum(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeItem(x: ProductCardData): ProductCardData {
  const handle =
    x.handle ||
    x.slug ||
    x.url_slug ||
    (typeof x.id === "string" ? x.id : undefined) ||
    (typeof x.id === "number" ? String(x.id) : undefined);

  const title = x.title || x.name;

  const image =
    x.image ??
    x.image_url ??
    x.imageUrl ??
    (Array.isArray(x.images) ? x.images?.[0] : null) ??
    null;

  const price =
    toNum(x.price) ??
    toNum(x.salePrice) ??
    toNum(x.sale_price) ??
    toNum(x.min_price);

  const wasPrice =
    toNum(x.wasPrice) ??
    toNum(x.compare_at_price) ??
    toNum(x.msrp) ??
    undefined;

  const rating = toNum(x.rating);
  const ratingCount = toNum(x.ratingCount ?? x.rating_count);

  return {
    ...x,
    handle,
    title,
    image,
    price,
    wasPrice,
    rating,
    ratingCount,
  };
}

function MiniProductCard({ p }: { p: ProductCardData }) {
  const handle = p.handle || p.slug;
  const href = handle ? `/p/${handle}` : "#";

  const price = toNum(p.price);
  const wasPrice = toNum(p.wasPrice);
  const hasDiscount =
    typeof price === "number" &&
    typeof wasPrice === "number" &&
    wasPrice > price;

  return (
    <Link
      to={href}
      className="block w-[160px] sm:w-[190px] md:w-[210px] shrink-0"
      aria-disabled={!handle}
      onClick={(e) => {
        if (!handle) e.preventDefault();
      }}
    >
      <div className="rounded-md border border-gray-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
        <div className="aspect-[4/5] bg-gray-50">
          {p.image ? (
            <img
              src={String(p.image)}
              alt={p.title ? String(p.title) : "Product"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="p-2">
          <div className="text-[12px] sm:text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
            {p.title || "Untitled"}
          </div>

          <div className="mt-1 flex items-center gap-2">
            {typeof price === "number" ? (
              <div className="text-sm font-semibold text-gray-900">
                ${price.toFixed(2)}
              </div>
            ) : (
              <div className="text-sm font-semibold text-gray-900"> </div>
            )}

            {hasDiscount ? (
              <div className="text-xs text-gray-400 line-through">
                ${wasPrice!.toFixed(2)}
              </div>
            ) : null}
          </div>

          {p.badge ? (
            <div className="mt-1 text-[10px] inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {p.badge}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function HomeRow({
  title,
  items = [],
  viewAllHref,
  className = "",
}: HomeRowProps) {
  const normalized = useMemo(() => {
    const out = (items || [])
      .map(normalizeItem)
      // keep rows from going empty because of strict filtering
      .filter((p) => (p.handle || p.slug) && (p.title || p.name));
    return out;
  }, [items]);

  return (
    <section className={`bg-white rounded-md border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between px-3 py-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          {title}
        </h2>

        {viewAllHref ? (
          <Link
            to={viewAllHref}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            View all
          </Link>
        ) : null}
      </div>

      <div className="px-3 pb-3">
        {normalized.length === 0 ? (
          <div className="text-sm text-gray-500 py-6">
            No products found for this row.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {normalized.slice(0, 18).map((p, i) => (
              <MiniProductCard key={(p.handle || p.slug || i) as any} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
