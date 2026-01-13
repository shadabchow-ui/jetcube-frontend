import React from "react";
import { Link } from "react-router-dom";

export type ProductCardData = {
  // canonical id used by ProductCard + routing
  handle: string;

  // legacy compatibility (some parts of app may still use slug)
  slug?: string;

  title: string;

  image?: string | null;
  price?: number | null;
  originalPrice?: number | null;

  rating?: number | null;
  reviewCount?: number | null;

  badge?: string | null;
  brand?: string | null;
  category?: string | null;

  // critical for Home/search filters in many codebases
  searchable?: string;
};

function formatMoney(v?: number | null) {
  if (v === null || v === undefined || Number.isNaN(v)) return "";
  try {
    return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
  } catch {
    return `$${v}`;
  }
}

function clampRating(v?: number | null) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return Math.max(0, Math.min(5, v));
}

export default function ProductCard({ p }: { p: ProductCardData }) {
  const handle = p?.handle || p?.slug || "";
  const href = handle ? `/p/${handle}` : "/";

  const priceText = formatMoney(p.price ?? null);
  const originalText =
    p.originalPrice && p.price && p.originalPrice > p.price
      ? formatMoney(p.originalPrice)
      : "";

  const rating = clampRating(p.rating ?? null);

  return (
    <div className="w-[220px] shrink-0 rounded-lg border border-black/10 bg-white shadow-sm overflow-hidden">
      <Link to={href} className="block">
        <div className="aspect-[1/1] bg-black/5 flex items-center justify-center overflow-hidden">
          {p.image ? (
            <img
              src={p.image}
              alt={p.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-xs text-black/50">No image</div>
          )}
        </div>

        <div className="p-3">
          {p.badge ? (
            <div className="mb-2 inline-flex rounded bg-black px-2 py-1 text-[11px] font-semibold text-white">
              {p.badge}
            </div>
          ) : null}

          <div className="line-clamp-2 text-sm font-medium text-black">
            {p.title}
          </div>

          {p.brand ? (
            <div className="mt-1 text-xs text-black/60">{p.brand}</div>
          ) : null}

          <div className="mt-2 flex items-baseline gap-2">
            {priceText ? (
              <div className="text-base font-semibold text-black">
                {priceText}
              </div>
            ) : (
              <div className="text-sm text-black/60">Price unavailable</div>
            )}

            {originalText ? (
              <div className="text-xs text-black/50 line-through">
                {originalText}
              </div>
            ) : null}
          </div>

          {rating !== null ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-black/70">
              <span className="font-semibold">{rating.toFixed(1)}</span>
              {p.reviewCount ? (
                <span>({p.reviewCount.toLocaleString()})</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
