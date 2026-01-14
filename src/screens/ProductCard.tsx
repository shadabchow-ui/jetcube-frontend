import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ProductLike = {
  slug?: string;
  id?: string;
  asin?: string;
  title?: string;
  image?: string | null;
  price?: number | string | null;
  rating?: number | string | null;
  ratingCount?: number | string | null;
};

const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

// Optional: set this in Cloudflare Pages env if you want your own proxy later.
// For now, this default proxy fixes Amazon 403 hotlinking.
const IMAGE_PROXY_BASE =
  import.meta.env.VITE_IMAGE_PROXY_BASE || "https://images.weserv.nl/?url=";

function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function getId(p: ProductLike) {
  return p.slug || p.id || p.asin || "";
}

function normalizeImageUrl(raw?: string | null) {
  const u = (raw || "").trim();
  if (!u) return "";

  // Already absolute
  if (/^https?:\/\//i.test(u)) return u;

  // If it's a relative path, assume it's in R2 or public assets.
  if (u.startsWith("/")) return u;

  // Otherwise treat as a key under R2.
  return joinUrl(R2_PUBLIC_BASE, u);
}

function shouldProxy(u: string) {
  try {
    const url = new URL(u);
    const host = url.hostname.toLowerCase();
    // Amazon commonly blocks direct embedding/hotlinking.
    return host.includes("m.media-amazon.com") || host.includes("images-amazon.com");
  } catch {
    return false;
  }
}

function toProxiedUrl(u: string) {
  // weserv expects url without scheme sometimes; it also works with full URL in many cases.
  // The safest is to pass host+path+query without the protocol.
  try {
    const url = new URL(u);
    const noProto = `${url.host}${url.pathname}${url.search}`;
    return `${IMAGE_PROXY_BASE}${encodeURIComponent(noProto)}`;
  } catch {
    return u;
  }
}

export function ProductCard({
  product,
  className = "",
}: {
  product: ProductLike;
  className?: string;
}) {
  const id = getId(product);

  const [imgFailed, setImgFailed] = useState(false);

  const title = (product.title || "").trim() || id || "Untitled";
  const priceText =
    product.price === null || product.price === undefined || product.price === ""
      ? ""
      : typeof product.price === "number"
      ? `$${product.price.toFixed(2)}`
      : String(product.price);

  const rawImg = useMemo(() => normalizeImageUrl(product.image), [product.image]);

  const imgSrc = useMemo(() => {
    if (!rawImg) return "";
    if (shouldProxy(rawImg)) return toProxiedUrl(rawImg);
    return rawImg;
  }, [rawImg]);

  const href = id ? `/p/${id}` : "/shop";

  return (
    <Link
      to={href}
      className={[
        "block bg-white border border-[#e7e7e7] rounded-sm overflow-hidden hover:shadow-sm transition",
        className,
      ].join(" ")}
      aria-label={title}
    >
      <div className="w-full aspect-[4/3] bg-[#fafafa] flex items-center justify-center">
        {!imgSrc || imgFailed ? (
          <div className="text-[12px] text-[#888]">No image</div>
        ) : (
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            className="w-full h-full object-contain"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      <div className="p-3">
        <div className="text-[13px] text-[#0F1111] line-clamp-2 min-h-[34px]">
          {title}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-[14px] font-semibold text-[#0F1111]">
            {priceText || "$0.00"}
          </div>
          <div className="text-[12px] text-[#565959]">
            {product.rating ? `${product.rating}★` : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
