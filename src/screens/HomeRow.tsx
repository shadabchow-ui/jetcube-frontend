import React from "react";

type AnyProduct = any;

type HomeRowProps = {
  title?: string;
  // different places in your code may pass any of these:
  products?: AnyProduct[];
  items?: AnyProduct[];
  row?: AnyProduct[];
  data?: AnyProduct[];
  viewAllHref?: string;
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
  return firstNonEmpty(
    p?.slug,
    p?.handle,
    p?.url_slug,
    p?.urlSlug,
    p?.product_slug,
    p?.productSlug,
    p?.id ? String(p.id) : ""
  );
}

function getTitle(p: AnyProduct): string {
  return firstNonEmpty(
    p?.title,
    p?.name,
    p?.product_title,
    p?.productTitle,
    p?.heading
  );
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
  const s = asString(v);
  return s;
}

function getImage(p: AnyProduct): string {
  // handle lots of possible key shapes
  const img =
    p?.image ??
    p?.imageUrl ??
    p?.img ??
    p?.thumbnail ??
    p?.thumb ??
    p?.primaryImage ??
    p?.mainImage ??
    p?.heroImage ??
    p?.displayImage ??
    (Array.isArray(p?.images) ? p.images[0] : null) ??
    (Array.isArray(p?.image_urls) ? p.image_urls[0] : null) ??
    (Array.isArray(p?.imageUrls) ? p.imageUrls[0] : null) ??
    (Array.isArray(p?.media?.images) ? p.media.images[0] : null);

  return asString(img);
}

function getHref(p: AnyProduct): string {
  const slug = getSlug(p);
  if (!slug) return "#";
  // your site uses /p/<slug>
  return `/p/${slug}`;
}

function Card({ p }: { p: AnyProduct }) {
  const href = getHref(p);
  const title = getTitle(p) || "Untitled product";
  const price = getPrice(p);
  const image = getImage(p);

  return (
    <a
      href={href}
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
            // ✅ critical for Amazon 403 hotlink blocks
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
            onError={(e) => {
              // fallback to blank if Amazon blocks or URL is dead
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

export function HomeRow(props: HomeRowProps) {
  const title = props.title || "";
  const list =
    props.products || props.items || props.row || props.data || ([] as AnyProduct[]);

  return (
    <section className={props.className} style={{ padding: "12px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{title}</h3>

        {props.viewAllHref ? (
          <a
            href={props.viewAllHref}
            style={{ fontSize: 12, textDecoration: "none" }}
          >
            View all
          </a>
        ) : null}
      </div>

      {Array.isArray(list) && list.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "180px",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 6,
          }}
        >
          {list.map((p, idx) => (
            <Card key={getSlug(p) || `${idx}`} p={p} />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#8a8f98" }}>
          No products found for this row.
        </div>
      )}
    </section>
  );
}

export default HomeRow;
