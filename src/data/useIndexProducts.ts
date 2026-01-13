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

function pickImage(raw: any) {
  if (typeof raw?.image === "string") return raw.image;
  if (typeof raw?.primaryImage === "string") return raw.primaryImage;
  if (typeof raw?.thumbnail === "string") return raw.thumbnail;

  const imgs = raw?.images;
  if (Array.isArray(imgs) && typeof imgs[0] === "string") return imgs[0];
  if (Array.isArray(imgs) && imgs[0] && typeof imgs[0].url === "string")
    return imgs[0].url;

  return null;
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

function buildSearchable(raw: any, fallback: { title: string; brand?: string | null; category?: string | null }) {
  // If the index already provides searchable, preserve it.
  const s = typeof raw?.searchable === "string" ? raw.searchable : "";
  if (s.trim()) return s;

  const parts = [
    fallback.title,
    fallback.brand || "",
    fallback.category || "",
    typeof raw?.asin === "string" ? raw.asin : "",
    typeof raw?.id === "string" ? raw.id : "",
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
    // legacy compat:
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
