import React from "react";

type AnyProduct = any;

export type ProductCardProps = {
  product?: AnyProduct;

  // direct props (if you don’t pass `product`)
  slug?: string;
  href?: string;
  title?: string;
  image?: string | null;
  price?: string | number | null;

  className?: string;
};

function asString(v: any): string {
  return typeof v === "string" ? v : "";
}

function firstNonEmpty(...vals: any[]): string {
  for (const v of vals) {
    const s = asString(v).trim();
    if (s) return s;
  }
  return "";
}

function getSlug(p: AnyProduct): string {
  return firstNonEmpty(p?.slug, p?.handle, p?.url_slug, p?.urlSlug);
}

function getTitle(p: AnyProduct): string {
  return firstNonEmpty(p?.title, p?.name, p?.product_title, p?.productTitle);
}

function getPrice(p: AnyProduct): string {
  const v =
    p?.price ??
    p?.priceValue ??
    p?.price_current ??
    p?.priceCurrent ??
    p?.sale_price ??
    p?.salePrice ??
    p?.amount;

  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
  return asString(v);
}

function getImage(p: AnyProduct): string {
  const img =
    p?.image ??
    p?.imageUrl ??
    p?.img ??
    p?.thumbnail ??
    p?.thumb ??
    p?.primaryImage ??
    p?.mainImage ??
    p?.heroImage ??
    (Array.isArray(p?.images) ? p.images[0] : null) ??
    (Array.isArray(p?.image_urls) ? p.image_urls[0] : null) ??
    (Array.isArray(p?.imageUrls) ? p.imageUrls[0] : null);

  return asString(img);
}

export function ProductCard(props: ProductCardProps) {
  const p = props.product;

  const slug = props.slug || (p ? getSlug(p) : "");
  const href = props.href || (slug ? `/p/${slug}` : "#");

  const title = props.title || (p ? getTitle(p) : "") || "Untitled product";

  const priceRaw =
    props.price ?? (p ? getPrice(p) : "") ?? "";
  const price =
    typeof priceRaw === "number" ? priceRaw.toFixed(2) : asString(priceRaw);

  const image =
    props.image ?? (p ? getImage(p) : "") ?? "";

  return (
    <a
      href={href}
      className={props.className}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          background: "#f6f7f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            // ✅ this is what prevents Amazon 403 in many cases
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "";
            }}
          />
        ) : (
          <div style={{ fontSize: 12, color: "#8a8f98" }}>No image</div>
        )}
      </div>

      <div style={{ padding: 10 }}>
        <div
          style={{
            fontSize: 12,
            lineHeight: "16px",
            height: 32,
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        <div style={{ marginTop: 6, fontWeight: 600, fontSize: 13 }}>
          {price ? `$${price}` : "$0.00"}
        </div>
      </div>
    </a>
  );
}

export default ProductCard;
