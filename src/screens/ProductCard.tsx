// src/components/ProductCard.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type AnyObj = Record<string, any>;

type ProductLike = {
  slug?: string;
  handle?: string;
  url_slug?: string;

  title?: string;
  brand?: string;

  image?: string | null;
  img?: string | null;
  thumbnail?: string | null;
  thumb?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;

  images?: any; // string[] or object[]
  price?: number | string | null;
  rating?: number | string | null;
  reviews?: number | string | null;

  [k: string]: any;
};

function toStringOrEmpty(v: any): string {
  return typeof v === "string" ? v : "";
}

function firstStringFromArray(arr: any): string {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const first = arr[0];

  if (typeof first === "string") return first;

  if (first && typeof first === "object") {
    return (
      toStringOrEmpty(first.url) ||
      toStringOrEmpty(first.src) ||
      toStringOrEmpty(first.href) ||
      toStringOrEmpty(first.image) ||
      ""
    );
  }

  return "";
}

function pickImage(p: ProductLike): string {
  // direct common keys
  const direct =
    toStringOrEmpty(p.image) ||
    toStringOrEmpty(p.img) ||
    toStringOrEmpty(p.thumbnail) ||
    toStringOrEmpty(p.thumb) ||
    toStringOrEmpty(p.imageUrl) ||
    toStringOrEmpty(p.image_url);

  if (direct) return direct;

  // nested objects
  const imageObj = (p.image && typeof p.image === "object" ? (p.image as AnyObj) : null);
  if (imageObj) {
    const nested =
      toStringOrEmpty(imageObj.url) ||
      toStringOrEmpty(imageObj.src) ||
      toStringOrEmpty(imageObj.href);
    if (nested) return nested;
  }

  // arrays (very common)
  const fromImages =
    firstStringFromArray(p.images) ||
    firstStringFromArray((p as AnyObj).image_urls) ||
    firstStringFromArray((p as AnyObj).imageUrls);

  if (fromImages) return fromImages;

  // last-ditch: sometimes cards store {primaryImage:{src}} etc.
  const candidates = [
    (p as AnyObj).primaryImage,
    (p as AnyObj).mainImage,
    (p as AnyObj).heroImage,
    (p as AnyObj).primary_image,
    (p as AnyObj).main_image,
    (p as AnyObj).hero_image,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === "string") return c;
    if (typeof c === "object") {
      const s = toStringOrEmpty(c.url) || toStringOrEmpty(c.src) || toStringOrEmpty(c.href);
      if (s) return s;
    }
  }

  return "";
}

function resolveSlug(p: ProductLike): string {
  return (
    toStringOrEmpty(p.slug) ||
    toStringOrEmpty(p.handle) ||
    toStringOrEmpty(p.url_slug)
  );
}

function formatPrice(v: any): string {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
      ? Number(v.replace(/[^0-9.]+/g, ""))
      : 0;

  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function ProductCard({ product }: { product: ProductLike }) {
  const [imgFailed, setImgFailed] = useState(false);

  const slug = useMemo(() => resolveSlug(product), [product]);
  const href = slug ? `/p/${slug}` : "#";

  const imgSrc = useMemo(() => pickImage(product), [product]);
  const title = product.title || "Untitled item";

  const showImage = !!imgSrc && !imgFailed;

  return (
    <Link
      to={href}
      style={{
        display: "block",
        border: "1px solid #eee",
        borderRadius: 8,
        background: "#fff",
        color: "inherit",
        textDecoration: "none",
        overflow: "hidden",
        minWidth: 190,
      }}
    >
      <div
        style={{
          height: 170,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          borderBottom: "1px solid #eee",
        }}
      >
        {showImage ? (
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
            }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{ fontSize: 12, opacity: 0.55 }}>No image</div>
        )}
      </div>

      <div style={{ padding: 10 }}>
        <div
          style={{
            fontSize: 12,
            lineHeight: "16px",
            height: 32,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2 as any,
            WebkitBoxOrient: "vertical" as any,
            marginBottom: 6,
          }}
          title={title}
        >
          {title}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {formatPrice(product.price)}
        </div>
      </div>
    </Link>
  );
}

