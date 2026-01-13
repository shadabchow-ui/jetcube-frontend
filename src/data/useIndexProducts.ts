import { useEffect, useState } from "react";
import pako from "pako";
import type { ProductCardData } from "../components/ProductCard";

type UseIndexProductsResult = {
  items: ProductCardData[];
  loading: boolean;
  error: string | null;
};

const INDEX_CARDS_PATH =
  import.meta.env.VITE_INDEX_CARDS_PATH || "/indexes/_index.cards.json";

const INDEX_VERSION = import.meta.env.VITE_INDEX_VERSION || "";

// If your cards store images as relative paths (e.g. "img/....jpg" or "/img/....jpg"),
// we’ll prefix them with this base. Set it in Cloudflare Pages env vars if needed.
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

function joinUrl(path: string) {
  const p = String(path || "");
  if (!INDEX_VERSION) return p;
  const sep = p.includes("?") ? "&" : "?";
  return `${p}${sep}v=${encodeURIComponent(INDEX_VERSION)}`;
}

function isGzip(bytes: Uint8Array) {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function decodeUtf8(bytes: Uint8Array) {
  return new TextDecoder("utf-8").decode(bytes);
}

function unwrapToArray(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed;

  if (parsed && typeof parsed === "object") {
    const candidates = [
      parsed.cards,
      parsed.items,
      parsed.data,
      parsed.products,
      parsed.results,
    ];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
    }
  }

  return [];
}

function parseNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;

  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.]+/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  }

  return null;
}

function pickHandle(raw: any) {
  return (
    raw?.handle ||
    raw?.slug ||
    raw?.url_slug ||
    raw?.urlSlug ||
    raw?.id ||
    raw?.asin ||
    raw?.key ||
    ""
  );
}

function pickTitle(raw: any) {
  return (
    raw?.title ||
    raw?.name ||
    raw?.product_title ||
    raw?.productTitle ||
    raw?.displayTitle ||
    ""
  );
}

function firstString(...vals: any[]): string | null {
  for (const v of vals) {
    if (typeof v === "string") {
      const s = v.trim();
      if (s) return s;
    }
  }
  return null;
}

function extractUrlFromObj(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;
  return firstString(
    obj.url,
    obj.src,
    obj.href,
    obj.image,
    obj.imageUrl,
    obj.image_url,
    obj.large,
    obj.largeUrl,
    obj.hiRes,
    obj.hires,
    obj.medium,
    obj.small
  );
}

function resolveImageUrl(v: string | null): string | null {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;

  // already absolute
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;

  // relative => prefix with R2 base
  const base = String(R2_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (!base) return s;

  if (s.startsWith("/")) return `${base}${s}`;
  return `${base}/${s}`;
}

function pickImage(raw: any) {
  // 1) Most common direct keys (string)
  const direct = firstString(
    raw?.image,
    raw?.img,
    raw?.imageUrl,
    raw?.image_url,
    raw?.imageURL,
    raw?.imgUrl,
    raw?.img_url,
    raw?.thumbnail,
    raw?.thumb,
    raw?.thumbnailUrl,
    raw?.thumbnail_url,
    raw?.primaryImage,
    raw?.primary_image,
    raw?.primaryImageUrl,
    raw?.primary_image_url,
    raw?.mainImage,
    raw?.main_image,
    raw?.mainImageUrl,
    raw?.main_image_url,
    raw?.heroImage,
    raw?.hero_image
  );
  if (direct) return resolveImageUrl(direct);

  // 2) Sometimes these are objects { url: "..." }
  const obj1 =
    extractUrlFromObj(raw?.image) ||
    extractUrlFromObj(raw?.primaryImage) ||
    extractUrlFromObj(raw?.mainImage) ||
    extractUrlFromObj(raw?.thumbnail);
  if (obj1) return resolveImageUrl(obj1);

  // 3) Arrays: images: ["..."] or [{url:"..."}]
  const imgs = raw?.images || raw?.imageUrls || raw?.image_urls;
  if (Array.isArray(imgs) && imgs.length) {
    const first = imgs[0];
    if (typeof first === "string") return resolveImageUrl(first);
    const fromObj = extractUrlFromObj(first);
    if (fromObj) return resolveImageUrl(fromObj);
  }

  // 4) Nested shapes sometimes used in scraped data
  const nested =
    extractUrlFromObj(raw?.media?.images?.[0]) ||
    extractUrlFromObj(raw?.media?.primary) ||
    extractUrlFromObj(raw?.assets?.images?.[0]) ||
    extractUrlFromObj(raw?.hero?.image);
  if (nested) return resolveImageUrl(nested);

  return null;
}

function buildSearchable(
  raw: any,
  fallback: { title: string; brand?: string | null; category?: string | null }
) {
  const s = typeof raw?.searchable === "string" ? raw.searchable : "";
  if (s.trim()) return s;

  const parts = [
    fallback.title,
    fallback.brand || "",
    fallback.category || "",
    typeof raw?.asin === "string" ? raw.asin : "",
    typeof raw?.id === "string" ? raw.id : "",
    typeof raw?.handle === "string" ? raw.handle : "",
  ]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  return parts;
}

function normalizeCard(raw: any): ProductCardData | null {
  const handle = String(pickHandle(raw) || "").trim();
  const title = String(pickTitle(raw) || "").trim();
  if (!handle || !title) return null;

  const brand = typeof raw?.brand === "string" ? raw.brand : null;
  const category = typeof raw?.category === "string" ? raw.category : null;

  const price =
    parseNumber(raw?.price) ??
    parseNumber(raw?.currentPrice) ??
    parseNumber(raw?.sale_price) ??
    parseNumber(raw?.salePrice) ??
    null;

  const originalPrice =
    parseNumber(raw?.originalPrice) ??
    parseNumber(raw?.listPrice) ??
    parseNumber(raw?.msrp) ??
    null;

  const rating = parseNumber(raw?.rating);
  const reviewCount =
    parseNumber(raw?.reviewCount) ?? parseNumber(raw?.reviews) ?? null;

  const card: ProductCardData = {
    handle,
    slug: typeof raw?.slug === "string" ? raw.slug : handle,

    title,
    image: pickImage(raw),

    price,
    originalPrice,

    rating,
    reviewCount,

    badge: typeof raw?.badge === "string" ? raw.badge : null,
    brand,
    category,

    searchable: buildSearchable(raw, { title, brand, category }),
  };

  return card;
}

async function fetchIndexCards(): Promise<ProductCardData[]> {
  const url = joinUrl(INDEX_CARDS_PATH);

  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) {
    throw new Error(`Index fetch failed (${resp.status}) for ${url}`);
  }

  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);

  let jsonText = "";
  try {
    if (isGzip(bytes)) {
      const unzipped = pako.ungzip(bytes);
      jsonText = decodeUtf8(unzipped);
    } else {
      jsonText = decodeUtf8(bytes);
    }
  } catch (e: any) {
    throw new Error(`Failed to decode index bytes: ${e?.message || e}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e: any) {
    const head = jsonText.slice(0, 200);
    throw new Error(
      `Invalid JSON from index (first 200 chars): ${JSON.stringify(head)}`
    );
  }

  const rawArr = unwrapToArray(parsed);

  const out: ProductCardData[] = [];
  for (const raw of rawArr) {
    const n = normalizeCard(raw);
    if (n) out.push(n);
  }

  return out;
}

export function useIndexProducts(): UseIndexProductsResult {
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchIndexCards();

        if (!alive) return;
        setItems(data);
      } catch (e: any) {
        if (!alive) return;
        setItems([]);
        setError(e?.message || String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { items, loading, error };
}

export default useIndexProducts;
