import React from "react";
import { Link } from "react-router-dom";

export type ProductCardData = {
  handle?: string;
  slug?: string;
  url_slug?: string;
  title?: string;
  name?: string;

  imageUrl?: string | null;
  image?: string | null;
  image_url?: string | null;
  image_src?: string | null;

  brand?: string;
  category?: string;
};

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function firstNonEmpty(...vals: unknown[]): string {
  for (const v of vals) {
    const s = safeStr(v).trim();
    if (s) return s;
  }
  return "";
}

const ProductCard = ({ item }: { item: ProductCardData }) => {
  if (!item) return null;

  const handle = firstNonEmpty(item.handle, item.slug, item.url_slug);
  const title = firstNonEmpty(item.title, item.name) || "Product";

  const imageUrl =
    firstNonEmpty(item.imageUrl, item.image, item.image_url, item.image_src) ||
    "/img/placeholder-product.png";

  const href = handle ? `/product/${handle}` : "#";

  return (
    <Link
      to={href}
      className="group block w-[160px] sm:w-[180px] md:w-[200px] flex-shrink-0"
      aria-label={title}
    >
      <div className="rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10">
        <div className="aspect-[4/5] bg-black/10">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/img/placeholder-product.png";
            }}
          />
        </div>

        <div className="p-3">
          <div className="text-sm font-semibold leading-snug line-clamp-2 text-white">
            {title}
          </div>
          {(item.brand || item.category) && (
            <div className="mt-1 text-xs text-white/60 line-clamp-1">
              {firstNonEmpty(item.brand, item.category)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
