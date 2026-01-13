// src/components/ProductCard.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

export type ProductCardData = {
  handle: string;            // slug/handle used for routing
  title: string;
  image?: string | { src?: string; url?: string } | null;

  price?: number | null;
  wasPrice?: number | null;

  rating?: number | null;       // 0-5
  ratingCount?: number | null;

  badge?: string | null;

  // allow extra fields
  [key: string]: any;
};

function getImageSrc(image: ProductCardData["image"]): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object") return image.src || image.url || null;
  return null;
}

function formatMoney(v: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

type Props = {
  item: ProductCardData;
  className?: string;
};

export default function ProductCard({ item, className = "" }: Props) {
  const img = useMemo(() => getImageSrc(item.image), [item.image]);

  const href = `/product/${encodeURIComponent(item.handle)}`;

  const price = typeof item.price === "number" ? item.price : null;
  const was = typeof item.wasPrice === "number" ? item.wasPrice : null;

  const rating =
    typeof item.rating === "number" && isFinite(item.rating) ? item.rating : null;

  const ratingCount =
    typeof item.ratingCount === "number" && isFinite(item.ratingCount)
      ? item.ratingCount
      : null;

  return (
    <Link
      to={href}
      className={[
        "block rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition",
        "border border-white/10",
        className,
      ].join(" ")}
    >
      <div className="relative w-full aspect-[3/4] bg-black/20">
        {img ? (
          <img
            src={img}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
            no image
          </div>
        )}

        {item.badge ? (
          <div className="absolute top-2 left-2 px-2 py-1 text-xs rounded bg-black/70 text-white">
            {item.badge}
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <div className="text-sm text-white/90 line-clamp-2 min-h-[2.5rem]">
          {item.title}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-sm text-white/95 font-semibold">
            {price != null ? formatMoney(price) : ""}
          </div>

          {was != null && price != null && was > price ? (
            <div className="text-xs text-white/50 line-through">
              {formatMoney(was)}
            </div>
          ) : null}
        </div>

        {rating != null ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
            <Stars value={rating} />
            {ratingCount != null ? <span>({ratingCount})</span> : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  const star = (ch: string, key: string) => (
    <span key={key} aria-hidden="true">
      {ch}
    </span>
  );

  return (
    <span className="tracking-tight">
      {Array.from({ length: full }).map((_, i) => star("★", `f${i}`))}
      {half ? star("☆", "h") : null}
      {Array.from({ length: empty }).map((_, i) => star("✩", `e${i}`))}
    </span>
  );
}
