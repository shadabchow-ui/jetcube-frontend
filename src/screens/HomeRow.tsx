import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type RawIndexItem = Record<string, any>;

type IndexItem = {
  slug: string;
  title: string;
  brand?: string;
  category?: string;
  price?: number | null;
  image?: string | null;
  searchable: string;
};

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickFirstString(...vals: any[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickFirstImage(raw: any): string | null {
  const direct =
    pickFirstString(
      raw?.image,
      raw?.img,
      raw?.imageUrl,
      raw?.image_url,
      raw?.thumbnail,
      raw?.thumb,
      raw?.primaryImage,
      raw?.primary_image,
      raw?.hero,
      raw?.heroImage,
      raw?.hero_image
    ) || "";

  if (direct) return direct;

  // common patterns: images: ["url", ...] or images: [{url}, ...]
  const imgs = raw?.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    const s =
      pickFirstString(first, first?.url, first?.src, first?.link) || "";
    return s || null;
  }

  return null;
}

function normalizeSlug(raw: any): string {
  return (
    pickFirstString(raw?.slug, raw?.handle, raw?.url_slug, raw?.urlSlug) || ""
  );
}

function normalizeTitle(raw: any): string {
  return (
    pickFirstString(raw?.title, raw?.name, raw?.product_title, raw?.productTitle) ||
    ""
  );
}

function normalizeBrand(raw: any): string {
  return pickFirstString(raw?.brand, raw?.brand_name, raw?.brandName) || "";
}

function normalizeCategory(raw: any): string {
  return pickFirstString(raw?.category, raw?.cat, raw?.category_name, raw?.categoryName) || "";
}

function normalizePrice(raw: any): number | null {
  const v =
    raw?.price ??
    raw?.price_value ??
    raw?.priceValue ??
    raw?.sale_price ??
    raw?.salePrice ??
    null;

  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/[^0-9.]+/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeItem(raw: RawIndexItem): IndexItem | null {
  const slug = normalizeSlug(raw);
  const title = normalizeTitle(raw);

  if (!slug || !title) return null;

  const brand = normalizeBrand(raw) || undefined;
  const category = normalizeCategory(raw) || undefined;
  const image = pickFirstImage(raw);

  const price = normalizePrice(raw);

  const searchable = normalizeText(
    [title, brand || "", category || "", slug].filter(Boolean).join(" ")
  );

  return {
    slug,
    title,
    brand,
    category,
    price,
    image,
    searchable,
  };
}

// ✅ R2 public base (your current default)
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

// If you version-bust indexes, set VITE_INDEX_VERSION="20260113-1" etc.
const INDEX_VERSION = import.meta.env.VITE_INDEX_VERSION || "";

// Where the cards index lives (override if needed)
const INDEX_CARDS_PATH =
  import.meta.env.VITE_INDEX_CARDS_PATH || "/indexes/_index.cards.json";

function withVersion(url: string) {
  if (!INDEX_VERSION) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(INDEX_VERSION)}`;
}

// If you ever point this at a .json.gz that is NOT served with Content-Encoding: gzip,
// Chrome can still decompress it client-side via DecompressionStream.
async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const ce = (res.headers.get("content-encoding") || "").toLowerCase();
  const isGzipByHeader = ce.includes("gzip");
  const isGzipByName = url.toLowerCase().endsWith(".gz");

  if (isGzipByName && !isGzipByHeader) {
    // manual gzip decode
    if (typeof (window as any).DecompressionStream === "function" && res.body) {
      const ds = new (window as any).DecompressionStream("gzip");
      const decompressed = res.body.pipeThrough(ds);
      const text = await new Response(decompressed).text();
      return JSON.parse(text);
    }
    // fallback (will likely fail if truly gzipped without header)
    return await res.json();
  }

  return await res.json();
}

type HomeRowProps = {
  title: string;
  viewAllHref?: string;
  // Optional: show only items matching this predicate
  filter?: (item: IndexItem) => boolean;
  // Optional: max cards shown
  limit?: number;
  // Optional: offset into the list
  offset?: number;
};

function ProductCard({
  item,
  onClick,
}: {
  item: IndexItem;
  onClick: () => void;
}) {
  const priceText =
    typeof item.price === "number" && Number.isFinite(item.price)
      ? `$${item.price.toFixed(2)}`
      : "$0.00";

  return (
    <div
      onClick={onClick}
      style={{
        width: 200,
        minWidth: 200,
        border: "1px solid #e6e6e6",
        borderRadius: 8,
        background: "#fff",
        overflow: "hidden",
        cursor: "pointer",
      }}
      role="button"
      tabIndex={0}
    >
      <div
        style={{
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          borderBottom: "1px solid #eee",
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            loading="lazy"
            // helps with some hotlink setups
            referrerPolicy="no-referrer"
          />
        ) : (
          <div style={{ fontSize: 12, color: "#999" }}>No image</div>
        )}
      </div>

      <div style={{ padding: 10 }}>
        <div
          style={{
            fontSize: 12,
            lineHeight: "16px",
            height: 32,
            overflow: "hidden",
            color: "#111",
          }}
          title={item.title}
        >
          {item.title}
        </div>
        <div style={{ marginTop: 6, fontWeight: 600, fontSize: 13 }}>
          {priceText}
        </div>
      </div>
    </div>
  );
}

export default function HomeRow({
  title,
  viewAllHref,
  filter,
  limit = 12,
  offset = 0,
}: HomeRowProps) {
  const nav = useNavigate();
  const [items, setItems] = useState<IndexItem[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function run() {
      setError("");
      try {
        const url = withVersion(`${R2_PUBLIC_BASE}${INDEX_CARDS_PATH}`);
        const raw = await fetchJson(url);

        const arr: RawIndexItem[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : [];

        const normalized = arr
          .map(normalizeItem)
          .filter(Boolean) as IndexItem[];

        if (!alive) return;
        setItems(normalized);
      } catch (e: any) {
        if (!alive) return;
        setItems([]);
        setError(e?.message || "Index fetch failed");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const base = filter ? items.filter(filter) : items;
    return base.slice(offset, offset + limit);
  }, [items, filter, limit, offset]);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "10px 0",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        {viewAllHref ? (
          <a href={viewAllHref} style={{ fontSize: 12 }}>
            View all
          </a>
        ) : null}
      </div>

      {error ? (
        <div style={{ color: "#c00", fontSize: 12 }}>{error}</div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 10,
        }}
      >
        {visible.map((it) => (
          <ProductCard
            key={it.slug}
            item={it}
            onClick={() => nav(`/p/${it.slug}`)}
          />
        ))}
      </div>
    </div>
  );
}

