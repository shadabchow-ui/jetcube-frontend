// src/components/ProductCard.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export type ProductLike = {
  slug?: string;
  url_slug?: string;
  handle?: string;

  title?: string;
  name?: string;

  price?: number | string;
  price_display?: string;

  image?: string | null;
  image_url?: string | null;
  main_image?: string | null;
  thumbnail?: string | null;
  images?: Array<string | null | undefined>;

  rating?: number | string;
  reviews?: number | string;

  brand?: string;
  category?: string;
};

type Props = {
  product: ProductLike;
  className?: string;
  hrefOverride?: string;
};

function safeText(v: any): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function pickSlug(p: ProductLike): string {
  const raw =
    safeText(p.slug) ||
    safeText(p.handle) ||
    safeText(p.url_slug) ||
    "";

  if (raw.startsWith("/")) return raw;
  return raw ? `/p/${raw}` : "/shop";
}

function pickTitle(p: ProductLike): string {
  return safeText(p.title) || safeText(p.name) || "Untitled product";
}

function pickPrice(p: ProductLike): string {
  if (typeof p.price_display === "string" && p.price_display.trim()) return p.price_display;

  if (typeof p.price === "number") return `$${p.price.toFixed(2)}`;

  const s = safeText(p.price);
  if (!s) return "";
  return s.includes("$") ? s : `$${s}`;
}

function pickImageUrl(p: ProductLike): string {
  const direct =
    safeText(p.image) ||
    safeText(p.image_url) ||
    safeText(p.main_image) ||
    safeText(p.thumbnail);

  if (direct) return direct;

  if (Array.isArray(p.images)) {
    for (const v of p.images) {
      const s = safeText(v);
      if (s) return s;
    }
  }

  return "";
}

export function ProductCard({ product, className = "", hrefOverride }: Props) {
  const href = useMemo(() => hrefOverride || pickSlug(product), [hrefOverride, product]);
  const title = useMemo(() => pickTitle(product), [product]);
  const price = useMemo(() => pickPrice(product), [product]);

  // ✅ Important: render image directly; DO NOT fetch / blob / arrayBuffer.
  const initialImg = useMemo(() => pickImageUrl(product), [product]);
  const [imgOk, setImgOk] = useState(true);

  const ratingText = safeText(product.rating);
  const reviewsText = safeText(product.reviews);

  return (
    <div
      className={
        "rounded-[6px] border border-[#e6e6e6] bg-white overflow-hidden " +
        "hover:shadow-sm transition-shadow " +
        className
      }
    >
      <Link to={href} className="block">
        <div className="relative w-full bg-white">
          <div className="w-full aspect-[4/5] flex items-center justify-center bg-white">
            {initialImg && imgOk ? (
              <img
                src={initialImg}
                alt={title}
                loading="lazy"
                className="w-full h-full object-contain"
                onError={() => setImgOk(false)}
              />
            ) : (
              <div className="text-[12px] text-[#9b9b9b] select-none">No image</div>
            )}
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="text-[12px] text-[#111] line-clamp-2 min-h-[32px]">{title}</div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-[13px] font-medium text-[#111]">{price || "\u00A0"}</div>

            {(ratingText || reviewsText) && (
              <div className="text-[11px] text-[#555] whitespace-nowrap">
                {ratingText ? `${ratingText}` : ""}
                {ratingText && reviewsText ? " · " : ""}
                {reviewsText ? `${reviewsText}` : ""}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
