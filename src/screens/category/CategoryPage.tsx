import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { R2_BASE, joinUrl, fetchJsonStrict } from "../../config/r2";

/**
 * CategoryPage (Amazon-style)
 *
 * ✅ 6-up grid on desktop, dense spacing, hover behavior
 * ✅ 48 items/page pagination (query param ?page=)
 * ✅ Sidebar "Departments" populated from indexes/_category_urls.json
 * ✅ Sidebar only shows relevant subcategories for the current category:
 *    - If viewing a department (depth=1): show department's top-level subcategories (depth=2)
 *    - If viewing deeper category: show that category's children + siblings
 * ✅ Category routing reliability:
 *    - Tries indexes/category_products/<hyphen-path>.json
 *    - Falls back to indexes/category_products/<__-path>.json (legacy)
 *    - Final fallback: filter indexes/_index.cards.json by normalized category path
 * ✅ No permanent "Loading categories…" state; shows "No subcategories" when empty
 * ✅ Prices: robust extraction (no "$0" defaults; more schema candidates)
 */

const CATEGORY_INDEX_URL_GZ = joinUrl(R2_BASE, "indexes/_category_urls.json.gz");
const CATEGORY_INDEX_URL = joinUrl(R2_BASE, "indexes/_category_urls.json");
const CATEGORY_PRODUCTS_BASE = joinUrl(R2_BASE, "indexes/category_products");
const INDEX_CARDS_URL_GZ = joinUrl(R2_BASE, "indexes/_index.cards.json.gz");
const INDEX_CARDS_URL = joinUrl(R2_BASE, "indexes/_index.cards.json");

const PAGE_SIZE = 48;

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

function stripSlashes(s: string) {
  return s.replace(/^\/+|\/+$/g, "");
}

function stripPrefixSlash(s: string) {
  return s.replace(/^\/+/, "");
}

function normalizeCategoryPath(input: string): string {
  if (!input) return "";
  let s = String(input).trim();

  // If it's a full URL or contains "/c/", take the category path part
  const idx = s.indexOf("/c/");
  if (idx !== -1) s = s.slice(idx + 3);

  s = s.replace(/^c\//, "");
  s = decodeURIComponent(s);

  s = stripPrefixSlash(stripSlashes(s));

  // normalize spacing/case without changing slash structure
  s = s.toLowerCase();
  s = s.replace(/\s+/g, "-");
  s = s.replace(/-+/g, "-");

  return s;
}

function toCategoryFilenameFromPath(pathname: string) {
  const raw = stripSlashes(pathname);
  const parts = raw.split("/").filter(Boolean).map(decodeURIComponent);
  const cleaned = parts[0] === "c" ? parts.slice(1) : parts;

  return {
    cleanedParts: cleaned.map((p) => normalizeCategoryPath(p)),
    filename: `${cleaned.join("-")}.json`,
    legacyFilename: `${cleaned.join("__")}.json`,
  };
}

function normalizeCategoryIndexToPaths(indexData: CategoryIndexShape): string[] {
  const out: string[] = [];

  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    for (const k of Object.keys(indexData)) {
      const key = normalizeCategoryPath(String(k));
      if (key) out.push(key);
    }
    return out;
  }

  if (Array.isArray(indexData)) {
    for (const item of indexData as any[]) {
      if (typeof item === "string") {
        const s = normalizeCategoryPath(item);
        if (s) out.push(s);
      } else if (item && typeof item === "object") {
        const s = normalizeCategoryPath(String(item.url ?? item.path ?? item.slug ?? ""));
        if (s) out.push(s);
      }
    }
  }

  return out;
}

function normalizeProducts(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function prettyLabelPart(slug: string) {
  const s = String(slug || "").trim();
  if (!s) return "";
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function buildBreadcrumbParts(parts: string[]) {
  const crumbs: Array<{ label: string; path: string }> = [];
  const acc: string[] = [];
  for (const p of parts) {
    acc.push(p);
    crumbs.push({ label: prettyLabelPart(p), path: acc.join("/") });
  }
  return crumbs;
}

function extractSlug(p: any): string | null {
  const cand =
    p?.slug ??
    p?.handle ??
    p?.url_slug ??
    p?.urlSlug ??
    p?.asin ??
    p?.ASIN ??
    p?.id ??
    null;

  if (!cand) return null;
  const s = String(cand).trim();
  return s ? s : null;
}

function extractTitle(p: any): string {
  const cand =
    p?.title ??
    p?.name ??
    p?.product_title ??
    p?.productTitle ??
    p?.headline ??
    "";
  return String(cand || "").trim() || "Untitled product";
}

function extractImage(p: any): string | null {
  const cand =
    p?.image ??
    p?.image_url ??
    p?.imageUrl ??
    p?.img ??
    p?.thumbnail ??
    p?.thumbnailUrl ??
    p?.primaryImage ??
    p?.images?.[0] ??
    p?.image_urls?.[0] ??
    p?.imageUrls?.[0] ??
    null;

  if (!cand) return null;
  const s = String(cand).trim();
  return s ? s : null;
}

function asNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function extractPriceDisplay(p: any): string | null {
  // Prefer display strings, but reject zero-ish
  const displayCandidates = [
    p?.price_display,
    p?.priceDisplay,
    p?.price_str,
    p?.priceStr,
    p?.priceText,
    p?.pricing?.display,
    p?.buybox?.price,
    p?.offer?.price,
    p?.offers?.[0]?.price,
  ].filter(Boolean);

  for (const c of displayCandidates) {
    const s = String(c).trim();
    if (!s) continue;
    const n = asNumber(s);
    if (n && n > 0) return s; // already formatted or at least meaningful
    if (n && n > 0) return s; // already formatted or at least meaningful
  }

  // Numeric candidates (wide net)
  const numericCandidates = [
    p?.price,
    p?.price_value,
    p?.priceValue,
    p?.sale_price,
    p?.salePrice,
    p?.min_price,
    p?.minPrice,
    p?.max_price,
    p?.maxPrice,
    p?.pricing?.value,
    p?.pricing?.amount,
    p?.buybox?.price_value,
    p?.buybox?.priceValue,
    p?.offer?.price_value,
    p?.offer?.priceValue,
    p?.offers?.[0]?.price_value,
    p?.offers?.[0]?.priceValue,
    // cents
    typeof p?.price_cents === "number" ? p.price_cents / 100 : null,
    typeof p?.priceCents === "number" ? p.priceCents / 100 : null,
  ].filter((x) => x !== null && x !== undefined);

  for (const c of numericCandidates) {
    const n = asNumber(c);
    if (n && n > 0) return `$${n.toFixed(2)}`;
  }

  return null;
}

function getCategoryPathsFromCard(p: any): string[] {
  const raw =
    p?.category_path ??
    p?.categoryPath ??
    p?.category ??
    p?.category_url ??
    p?.categoryUrl ??
    p?.categorySlug ??
    p?.categories ??
    p?.category_paths ??
    null;

  const out: string[] = [];

  const push = (v: any) => {
    if (!v) return;
    const s = normalizeCategoryPath(String(v));
    if (s) out.push(s);
  };

  if (Array.isArray(raw)) raw.forEach(push);
  else if (typeof raw === "string") push(raw);
  else if (raw && typeof raw === "object") push(raw.path ?? raw.url ?? raw.slug);

  return out;
}

let _cardsCache: any[] | null = null;
let _cardsPromise: Promise<any[]> | null = null;

async function loadIndexCardsOnce(): Promise<any[]> {
  if (_cardsCache) return _cardsCache;
  if (_cardsPromise) return _cardsPromise;

  _cardsPromise = (async () => {
    try {
      const json =
        (await fetchJsonStrict<any>(INDEX_CARDS_URL_GZ, "index cards gz", {
          allow404: true,
          init: { cache: "force-cache" },
        })) ??
        (await fetchJsonStrict<any>(INDEX_CARDS_URL, "index cards", {
          allow404: true,
          init: { cache: "force-cache" },
        }));

      if (!json) return [];
      const arr = Array.isArray(json) ? json : Array.isArray(json?.cards) ? json.cards : [];
      _cardsCache = arr;
      return arr;
    } catch {
      return [];
    } finally {
      _cardsPromise = null;
    }
  })();

  return _cardsPromise;
}

// Lightweight per-slug hydration (for missing prices)
const _detailPriceCache = new Map<string, string | null>();
const _detailPricePromise = new Map<string, Promise<string | null>>();

async function loadProductDetailPriceOnce(slug: string): Promise<string | null> {
  const key = String(slug || "").trim();
  if (!key) return null;

  if (_detailPriceCache.has(key)) return _detailPriceCache.get(key) ?? null;
  if (_detailPricePromise.has(key)) return _detailPricePromise.get(key)!;

  const p = (async () => {
    try {
      // Many of your product JSONs are served under /products/<slug>.json
      const enc = encodeURIComponent(key);
      const json =
        (await fetchJsonStrict<any>(joinUrl(R2_BASE, `product/${enc}.json.gz`), "product json gz", {
          allow404: true,
          init: { cache: "force-cache" },
        })) ??
        (await fetchJsonStrict<any>(joinUrl(R2_BASE, `product/${enc}.json`), "product json", {
          allow404: true,
          init: { cache: "force-cache" },
        }));
      if (!json) return null;
      // Reuse extraction against the full PDP JSON
      const display =
        extractPriceDisplay(json) || extractPriceDisplay(json?.product) || extractPriceDisplay(json?.pdp);
      return display;
    } catch {
      return null;
    }
  })();

  _detailPricePromise.set(key, p);

  const v = await p;
  _detailPricePromise.delete(key);
  _detailPriceCache.set(key, v ?? null);
  return v ?? null;
}
function depthOf(path: string) {
  return normalizeCategoryPath(path).split("/").filter(Boolean).length;
}

export default function CategoryPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [allCategoryPaths, setAllCategoryPaths] = useState<string[]>([]);
  const [categoryIndexLoaded, setCategoryIndexLoaded] = useState(false);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const { cleanedParts, filename, legacyFilename } = useMemo(
    () => toCategoryFilenameFromPath(location.pathname),
    [location.pathname]
  );

  const categoryPathKey = useMemo(() => normalizeCategoryPath(cleanedParts.join("/")), [cleanedParts]);
  const deptKey = cleanedParts[0] || "";
  const currentDepth = cleanedParts.length;

  // Load category index once (for sidebar + canonical paths)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const json =
          (await fetchJsonStrict<CategoryIndexShape>(CATEGORY_INDEX_URL_GZ, "category urls gz", {
            allow404: true,
            init: { cache: "force-cache" },
          })) ??
          (await fetchJsonStrict<CategoryIndexShape>(CATEGORY_INDEX_URL, "category urls", {
            allow404: false,
            init: { cache: "force-cache" },
          }));
        if (!json) throw new Error("category index fetch failed");
        const paths = normalizeCategoryIndexToPaths(json);

        const dedup = Array.from(new Set(paths))
          .map((p) => normalizeCategoryPath(p))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        if (!cancelled) setAllCategoryPaths(dedup);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setCategoryIndexLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load products for this category
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setProducts([]);

      try {
        // 1) Try category_products/<hyphen>.json
        const urlGz = `${CATEGORY_PRODUCTS_BASE}/${filename}.gz`;
        const url = `${CATEGORY_PRODUCTS_BASE}/${filename}`;
        const data =
          (await fetchJsonStrict<any>(urlGz, "category products gz", {
            allow404: true,
            init: { cache: "force-cache" },
          })) ??
          (await fetchJsonStrict<any>(url, "category products", {
            allow404: true,
            init: { cache: "force-cache" },
          }));

        if (data) {
          const list = normalizeProducts(data);
          if (!cancelled) setProducts(list);
          return;
        }

        // 2) Legacy fallback: <__>.json
        const legacyUrlGz = `${CATEGORY_PRODUCTS_BASE}/${legacyFilename}.gz`;
        const legacyUrl = `${CATEGORY_PRODUCTS_BASE}/${legacyFilename}`;
        const legacyData =
          (await fetchJsonStrict<any>(legacyUrlGz, "category products legacy gz", {
            allow404: true,
            init: { cache: "force-cache" },
          })) ??
          (await fetchJsonStrict<any>(legacyUrl, "category products legacy", {
            allow404: true,
            init: { cache: "force-cache" },
          }));
        if (legacyData) {
          const list = normalizeProducts(legacyData);
          if (!cancelled) setProducts(list);
          return;
        }

        // 3) Fallback: filter _index.cards.json by category path
        const cards = await loadIndexCardsOnce();
        const key = normalizeCategoryPath(categoryPathKey);

        const filtered = cards.filter((c) => {
          const paths = getCategoryPathsFromCard(c);
          if (!paths.length) return false;
          return paths.some((p) => p === key || p.startsWith(key + "/"));
        });

        if (!cancelled) setProducts(filtered);

        if (filtered.length === 0) {
          if (!cancelled) setError("No products found for this category yet.");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [categoryPathKey, filename, legacyFilename]);

  const heading = useMemo(() => {
    if (!cleanedParts.length) return "All Departments";
    return cleanedParts.map(prettyLabelPart).join(" > ");
  }, [cleanedParts]);

  const breadcrumb = useMemo(() => buildBreadcrumbParts(cleanedParts), [cleanedParts]);

  // Sidebar behavior:
  // - depth=1: show dept subcats (depth=2)
  // - depth>=2: show children (depth+1) then siblings (same depth)
  const sidebar = useMemo(() => {
    const paths = allCategoryPaths;
    if (!deptKey || !paths.length) {
      return {
        mode: "empty" as "empty" | "dept" | "deep",
        deptSubs: [] as string[],
        children: [] as string[],
        siblings: [] as string[],
      };
    }

    const deptSubs = paths
      .filter((p) => p.startsWith(deptKey + "/") && depthOf(p) === 2)
      .sort((a, b) => a.localeCompare(b));

    const key = normalizeCategoryPath(categoryPathKey);

    const children =
      key && currentDepth >= 1
        ? paths
            .filter((p) => p.startsWith(key + "/") && depthOf(p) === currentDepth + 1)
            .sort((a, b) => a.localeCompare(b))
        : [];

    const parentKey = currentDepth > 1 ? cleanedParts.slice(0, -1).join("/") : "";
    const siblings =
      parentKey && currentDepth > 1
        ? paths
            .filter((p) => p.startsWith(normalizeCategoryPath(parentKey) + "/") && depthOf(p) === currentDepth)
            .sort((a, b) => a.localeCompare(b))
        : [];

    if (currentDepth <= 1) {
      return { mode: "dept" as const, deptSubs, children: [] as string[], siblings: [] as string[] };
    }
    return { mode: "deep" as const, deptSubs, children, siblings };
  }, [allCategoryPaths, deptKey, cleanedParts, categoryPathKey, currentDepth]);

  // Pagination
  const totalPages = useMemo(() => Math.max(1, Math.ceil(products.length / PAGE_SIZE)), [products.length]);

  const pageProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, page]);

  useEffect(() => {
    // clamp invalid pages
    if (page > totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(totalPages));
        return next;
      });
      return;
    }
    // scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, totalPages, setSearchParams]);

  function goPage(nextPage: number) {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(clamped));
      return next;
    });
  }

  function CategoryProductCard({ product }: { product: any }) {
    const slug = extractSlug(product);
    const title = extractTitle(product);
    const img = extractImage(product);
    const basePrice = extractPriceDisplay(product);
    const [hydratedPrice, setHydratedPrice] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      async function hydrate() {
        if (!slug) return;
        if (basePrice) return;
        const v = await loadProductDetailPriceOnce(slug);
        if (!cancelled) setHydratedPrice(v);
      }
      hydrate();
      return () => {
        cancelled = true;
      };
    }, [slug, basePrice]);

    const price = basePrice || hydratedPrice;

    const to = slug ? `/p/${encodeURIComponent(slug)}` : undefined;

    const inner = (
      <div className="amz-card" role="group" aria-label={title}>
        <div className="amz-imgWrap">
          {img ? (
            <img className="amz-img" src={img} alt={title} loading="lazy" />
          ) : (
            <div className="amz-imgEmpty">No image</div>
          )}
        </div>

        <div className="amz-title" title={title}>
          {title}
        </div>

        {price ? (
          <div className="amz-price">{price}</div>
        ) : (
          <div className="amz-price amz-price--muted">Price unavailable</div>
        )}
      </div>
    );

    return to ? (
      <Link to={to} className="amz-cardLink" aria-label={title}>
        {inner}
      </Link>
    ) : (
      inner
    );
  }

  const sidebarTitle = "Departments";

  const showSidebarLoading = !categoryIndexLoaded && allCategoryPaths.length === 0;

  const sidebarItems = useMemo(() => {
    if (showSidebarLoading) return [] as Array<{ path: string; label: string; kind: "link" }>;

    // Deep: children then siblings. Dept: deptSubs.
    let list: string[] = [];
    if (sidebar.mode === "dept") list = sidebar.deptSubs;
    else if (sidebar.mode === "deep") {
      // Prefer children; if none, show siblings; also show dept subs as fallback
      if (sidebar.children.length) list = sidebar.children;
      else if (sidebar.siblings.length) list = sidebar.siblings;
      else list = sidebar.deptSubs;
    } else {
      list = [];
    }

    // Dedup and cap for UI sanity
    const dedup = Array.from(new Set(list));

    return dedup.slice(0, 80).map((p) => {
      const last = p.split("/").pop() || p;
      return { path: p, label: prettyLabelPart(last), kind: "link" as const };
    });
  }, [sidebar, showSidebarLoading]);

  const sidebarActivePath = useMemo(() => {
    if (currentDepth <= 1) return "";
    if (sidebar.mode === "deep" && sidebar.children.length) return ""; // viewing a parent, children list active highlight won't match
    return categoryPathKey;
  }, [categoryPathKey, currentDepth, sidebar]);

  // Category existence is based on the category index, not on whether products exist.
  // (Amazon-style: categories can exist before products are populated.)
  const categoryExists = useMemo(() => {
    if (!categoryIndexLoaded) return true;
    if (!categoryPathKey) return true;
    return allCategoryPaths.includes(categoryPathKey);
  }, [categoryIndexLoaded, allCategoryPaths, categoryPathKey]);

  return (
    <div className="amz-page">
      <style>{`
        .amz-page {
          max-width: 1500px;
          margin: 0 auto;
          padding: 12px 12px 40px;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f1111;
        }

        .amz-breadcrumb {
          font-size: 12px;
          color: #565959;
          margin-bottom: 8px;
        }
        .amz-breadcrumb a { color: #007185; text-decoration: none; }
        .amz-breadcrumb a:hover { text-decoration: underline; color: #c7511f; }

        .amz-h1 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 10px;
          line-height: 1.25;
        }

        .amz-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 16px;
          align-items: start;
        }

        .amz-sidebar {
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          padding: 12px 10px;
        }
        .amz-sidebarTitle {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 10px;
        }
        .amz-sidebarList {
          list-style: none;
          padding: 0;
          margin: 0;
          line-height: 1.9;
        }
        .amz-sideLink {
          font-size: 13px;
          color: #007185;
          text-decoration: none;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .amz-sideLink:hover { color: #c7511f; text-decoration: underline; }
        .amz-sideLink--active {
          color: #0f1111;
          font-weight: 700;
          text-decoration: none;
        }
        .amz-sideEmpty {
          font-size: 13px;
          color: #565959;
        }

        .amz-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          padding: 4px 0;
        }
        .amz-count {
          font-size: 13px;
          color: #565959;
        }
        .amz-pager {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #565959;
        }
        .amz-btn {
          border: 1px solid #d5d9d9;
          background: #fff;
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 13px;
          color: #0f1111;
        }
        .amz-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .amz-btn:hover:not(:disabled) {
          background: #f7fafa;
        }

        .amz-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (min-width: 640px) { .amz-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (min-width: 1024px) { .amz-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (min-width: 1100px) { .amz-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); } }

        .amz-cardLink { text-decoration: none; color: inherit; display: block; }
        .amz-card {
          border: 1px solid #f0f2f2;
          border-radius: 6px;
          background: #fff;
          padding: 10px;
          height: 100%;
          transition: box-shadow 120ms ease, border-color 120ms ease;
        }
        .amz-cardLink:hover .amz-card {
          border-color: #d5d9d9;
          box-shadow: 0 2px 6px rgba(15,17,17,.15);
        }

        .amz-imgWrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          background: #fff;
          border-radius: 6px;
          border: 1px solid #f0f2f2;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .amz-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .amz-imgEmpty { font-size: 12px; color: #565959; }

        .amz-title {
          font-size: 13px;
          line-height: 1.25;
          height: 34px; /* ~2 lines */
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          color: #0f1111;
          margin-bottom: 6px;
        }
        .amz-cardLink:hover .amz-title {
          color: #c7511f;
          text-decoration: underline;
        }

        .amz-price {
          font-size: 18px;
          font-weight: 700;
          color: #0f1111;
          line-height: 1;
        }
        .amz-price--muted {
          font-size: 13px;
          font-weight: 400;
          color: #565959;
        }

        .amz-error {
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          padding: 12px;
          font-size: 13px;
          color: #0f1111;
        }

        @media (max-width: 900px) {
          .amz-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="amz-breadcrumb">
        {breadcrumb.length ? (
          <>
            {breadcrumb.map((c, idx) => (
              <span key={c.path}>
                <Link to={`/c/${c.path}`}>{c.label}</Link>
                {idx < breadcrumb.length - 1 ? " › " : ""}
              </span>
            ))}
          </>
        ) : (
          <span>All</span>
        )}
      </div>

      {/* Heading */}
      <h1 className="amz-h1">
        {heading}
        {!categoryExists && categoryIndexLoaded ? " (Not found)" : ""}
      </h1>

      <div className="amz-layout">
        {/* Sidebar */}
        <aside className="amz-sidebar" aria-label="Category navigation">
          <div className="amz-sidebarTitle">{sidebarTitle}</div>

          {showSidebarLoading ? (
            <div className="amz-sideEmpty">Loading categories…</div>
          ) : sidebarItems.length ? (
            <ul className="amz-sidebarList">
              {sidebarItems.map((it) => {
                const active = sidebarActivePath && normalizeCategoryPath(it.path) === normalizeCategoryPath(sidebarActivePath);
                return (
                  <li key={it.path}>
                    <Link
                      to={`/c/${it.path}`}
                      className={active ? "amz-sideLink amz-sideLink--active" : "amz-sideLink"}
                    >
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="amz-sideEmpty">No subcategories</div>
          )}
        </aside>

        {/* Main */}
        <main>
          {/* Top bar */}
          <div className="amz-topbar">
            <div className="amz-count">
              {loading ? "Loading…" : `${products.length.toLocaleString()} results`}
              {error ? ` — ${error}` : ""}
            </div>

            <div className="amz-pager" aria-label="Pagination controls">
              <button className="amz-btn" onClick={() => goPage(page - 1)} disabled={page <= 1}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button className="amz-btn" onClick={() => goPage(page + 1)} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="amz-error">Loading products…</div>
          ) : products.length ? (
            <div className="amz-grid" role="list">
              {pageProducts.map((p, idx) => (
                <div key={extractSlug(p) ?? idx} role="listitem">
                  <CategoryProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="amz-error">{error || "No products found."}</div>
          )}

          {/* Bottom pager */}
          <div className="amz-topbar" style={{ marginTop: 12 }}>
            <div className="amz-count" />
            <div className="amz-pager" aria-label="Pagination controls">
              <button className="amz-btn" onClick={() => goPage(page - 1)} disabled={page <= 1}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button className="amz-btn" onClick={() => goPage(page + 1)} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
