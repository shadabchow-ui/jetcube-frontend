import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export type ProductCardData = {
  handle: string;
  title: string;
  image?: any;
  price?: number | null;
  wasPrice?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
  badge?: string | null;

  // allow extra fields without breaking
  [key: string]: any;
};

const formatPrice = (n?: number | null) =>
  typeof n === "number" ? `$${n.toFixed(2)}` : null;

function readUrlFromMaybeObj(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "object") {
    const anyV = v as any;
    const s = anyV?.url || anyV?.src || anyV?.href || anyV?.hiRes || anyV?.large;
    if (typeof s === "string" && s.trim()) return s.trim();
  }
  return null;
}

function getFirstFromImages(images: unknown): string | null {
  if (!images) return null;

  if (typeof images === "string") return images.trim() || null;

  if (Array.isArray(images)) {
    const first = images[0] as any;
    if (typeof first === "string") return first.trim() || null;
    if (first && typeof first === "object") return readUrlFromMaybeObj(first);
  }

  if (typeof images === "object") {
    const anyImgs = images as any;
    if (Array.isArray(anyImgs.images)) return getFirstFromImages(anyImgs.images);
  }

  return null;
}

function pickProductImage(p: any): string | null {
  const candidates: any[] = [
    p?.image,
    p?.thumbnail,
    p?.image_url,
    p?.imageUrl,
    p?.img,
    p?.primary_image,
    p?.main_image,
    Array.isArray(p?.images) ? p.images : null,
    Array.isArray(p?.gallery_images) ? p.gallery_images : null,
  ];

  for (const c of candidates) {
    const u1 = readUrlFromMaybeObj(c);
    if (u1) return u1;

    const u2 = getFirstFromImages(c);
    if (u2) return u2;
  }

  return null;
}

const ProductCard = ({ p }: { p: ProductCardData }) => {
  const [imgError, setImgError] = useState(false);

  const img = useMemo(() => pickProductImage(p), [p]);

  return (
    <Link
      to={`/p/${p.handle}`}
      className="group block h-full rounded-md border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition"
    >
      <div className="p-2">
        <div className="relative aspect-square bg-gray-50 rounded overflow-hidden">
          {p.badge && (
            <span className="absolute top-2 left-2 bg-[#cc0c39] text-white text-[11px] px-2 py-1 rounded">
              {p.badge}
            </span>
          )}

          {img && !imgError ? (
            <img
              src={img}
              alt={p.title}
              loading="lazy"
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="mt-2 text-sm text-gray-900 line-clamp-2">{p.title}</div>

        <div className="mt-1 flex items-baseline gap-2">
          {formatPrice(p.price) ? (
            <span className="text-[15px] font-semibold">{formatPrice(p.price)}</span>
          ) : (
            <span className="text-sm text-gray-500">See price</span>
          )}

          {p.wasPrice && p.price && p.wasPrice > p.price && (
            <span className="text-xs text-gray-500 line-through">{formatPrice(p.wasPrice)}</span>
          )}
        </div>

        {typeof p.rating === "number" && (
          <div className="mt-1 text-xs text-gray-700">
            ★★★★☆ ({p.ratingCount?.toLocaleString()})
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;








