import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

/**
 * CategoryPage (Amazon-style)
 * Requirements implemented:
 * ✅ All category links "work" even if category_products JSON is missing:
 *    - Primary: indexes/category_products/<hyphen-path>.json (and legacy __ fallback)
 *    - Fallback: indexes/_index.cards.json filtered by category path
 * ✅ Product cards are clickable (Link to /p/:slug)
 * ✅ Price no longer defaults to $0.00 (robust extraction; blank if unknown)
 * ✅ Pagination: 48 per page
 * ✅ Grid: 6 per row on desktop
 * ✅ Sidebar: related categories (siblings + children within department)
 */

const INDEX_BASE = "https://ventari.net/indexes";
const CATEGORY_INDEX_URL = `${INDEX_BASE}/_category_urls.json`;
const CATEGORY_PRODUCTS_BASE = `${INDEX_BASE}/category_products`;
const INDEX_CARDS_URL = `${INDEX_BASE}/_index.cards.json`;

const PAGE_SIZE = 48;

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

function stripSlashes(s: string) {
  return s.replace(/^\/+|\/+$/g, "");
}

function toCategoryFilenameFromPath(pathname: string) {
  const raw = stripSlashes(pathname);
  const parts = raw.split("/").filter(Boolean).map(decodeURIComponent);
  const cleaned = parts[0] === "c" ? parts.slice(1) : parts;

  return {
    cleanedParts: cleaned,
    filename: `${cleaned.join("-")}.json`,
    legacyFilename: `${cleaned.join("__")}.json`,
  };
}

function normalizeCategoryIndexToPaths(indexData: CategoryIndexShape): string[] {
  const out: string[] = [];

  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    for (const k of Object.keys(indexData)) {
      const key = stripSlashes(String(k));
      if (key) out.push(key);
    }
    return out;
  }

  if (Array.isArray(indexData)) {
    for (const item of indexData as any[]) {
      if (typeof item === "string") {
        const s = stripSlashes(item);
        if (s) out.push(s);
      } else if (item && typeof item === "object") {
        const s = stripSlashes(String(item.url ?? item.path ?? item.slug ?? ""));
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
  return slug
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
    p?.id ??
    p?.asin ??
    p?.ASIN ??
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

function extractPriceDisplay(p: any): string | null {
  const candidates = [
    p?.price_display,
    p?.priceDisplay,
    p?.price_str,
    p?.priceStr,
    p?.priceText,
    p?.pricing?.display,
    p?.buybox?.price,
    p?.offers?.[0]?.price,
    p?.offer?.price,
    p?.price,
  ].filter(Boolean);

  for (const c of candidates) {
    const s = String(c).trim();
    if (!s) continue;

    // already formatted
    if (/[\$€£]/.test(s)) {
      const n = parseFloat(s.replace(/[^\d.]/g, ""));
      if (Number.isFinite(n) && n > 0) return s;
      // sometimes "$0.00" is junk - ignore
      continue;
    }

    // numeric-like
    const n = parseFloat(s.replace(/[^\d.]/g, ""));
    if (Number.isFinite(n) && n > 0) return `$${n.toFixed(2)}`;
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
    const s = stripSlashes(String(v)).replace(/^c\//, "");
    if (s) out.push(s);
  };

  if (Array.isArray(raw)) {
    raw.forEach(push);
  } else if (typeof raw === "string") {
    push(raw);
  } else if (raw && typeof raw === "object") {
    // sometimes { path: "..."} or { url: "..."}
    push(raw.path ?? raw.url ?? raw.slug);
  }

  return out;
}

let _cardsCache: any[] | null = null;
let _cardsPromise: Promise<any[]> | null = null;

async function loadIndexCardsOnce(): Promise<any[]> {
  if (_cardsCache) return _cardsCache;
  if (_cardsPromise) return _cardsPromise;

  _cardsPromise = (async () => {
    try {
      const res = await fetch(INDEX_CARDS_URL, { cache: "force-cache" });
      if (!res.ok) return [];
      const json = await res.json();
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

export default function CategoryPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [allCategoryPaths, setAllCategoryPaths] = useState<string[]>([]);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const { cleanedParts, filename, legacyFilename } = useMemo(
    () => toCategoryFilenameFromPath(location.pathname),
    [location.pathname]
  );

  const categoryPathKey = useMemo(() => cleanedParts.join("/"), [cleanedParts]);
  const deptKey = cleanedParts[0] || "";

  // Load category index once (for sidebar + existence)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(CATEGORY_INDEX_URL, { cache: "force-cache" });
        if (!res.ok) return;
        const json = (await res.json()) as CategoryIndexShape;
        const paths = normalizeCategoryIndexToPaths(json);
        const dedup = Array.from(new Set(paths)).filter(Boolean).sort();
        if (!cancelled) setAllCategoryPaths(dedup);
      } catch {
        // ignore
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
        const url = `${CATEGORY_PRODUCTS_BASE}/${filename}`;
        const res = await fetch(url, { cache: "force-cache" });

        if (res.ok) {
          const data = await res.json();
          const list = normalizeProducts(data);
          if (!cancelled) setProducts(list);
          return;
        }

        // 2) Legacy fallback: <__>.json
        const legacyRes = await fetch(`${CATEGORY_PRODUCTS_BASE}/${legacyFilename}`, { cache: "force-cache" });
        if (legacyRes.ok) {
          const legacyData = await legacyRes.json();
          const list = normalizeProducts(legacyData);
          if (!cancelled) setProducts(list);
          return;
        }

        // 3) Fallback: filter _index.cards.json by category path
        const cards = await loadIndexCardsOnce();
        const key = categoryPathKey;

        const filtered = cards.filter((c) => {
          const paths = getCategoryPathsFromCard(c);
          if (!paths.length) return false;
          // include exact match or descendants
          return paths.some((p) => p === key || p.startsWith(key + "/"));
        });

        if (!cancelled) setProducts(filtered);

        if (filtered.length === 0) {
          // keep this as an informative state, not a hard error
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

  const heading = useMemo(
    () => (cleanedParts.length ? cleanedParts.join(" > ") : "All Departments"),
    [cleanedParts]
  );

  const breadcrumb = useMemo(() => buildBreadcrumbParts(cleanedParts), [cleanedParts]);

  // Sidebar: department subcategories (depth 2), plus children of current category (next depth)
  const sidebar = useMemo(() => {
    const paths = allCategoryPaths;
    if (!paths.length || !deptKey) {
      return { deptSubs: [] as string[], children: [] as string[], siblings: [] as string[] };
    }

    const depthOf = (p: string) => stripSlashes(p).split("/").filter(Boolean).length;

    const deptSubs = paths
      .filter((p) => p.startsWith(deptKey + "/") && depthOf(p) === 2)
      .sort((a, b) => a.localeCompare(b));

    const currentDepth = cleanedParts.length;
    const currentKey = categoryPathKey;

    const children = currentKey
      ? paths
          .filter((p) => p.startsWith(currentKey + "/") && depthOf(p) === currentDepth + 1)
          .sort((a, b) => a.localeCompare(b))
      : [];

    const parentKey = cleanedParts.length > 1 ? cleanedParts.slice(0, -1).join("/") : "";
    const siblings =
      parentKey && currentDepth > 1
        ? paths
            .filter((p) => p.startsWith(parentKey + "/") && depthOf(p) === currentDepth)
            .sort((a, b) => a.localeCompare(b))
        : [];

    return { deptSubs, children, siblings };
  }, [allCategoryPaths, deptKey, cleanedParts, categoryPathKey]);

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
    const price = extractPriceDisplay(product);

    const to = slug ? `/p/${encodeURIComponent(slug)}` : undefined;

    const CardInner = (
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 10,
          background: "#fff",
          padding: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            background: "#fafafa",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {img ? (
            <img
              src={img}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              loading="lazy"
            />
          ) : (
            <div style={{ color: "#999", fontSize: 12 }}>No image</div>
          )}
        </div>

        <div style={{ fontSize: 13, lineHeight: "1.25em", height: 34, overflow: "hidden" }}>{title}</div>

        <div style={{ marginTop: "auto" }}>
          {price ? (
            <div style={{ fontWeight: 700, fontSize: 14 }}>{price}</div>
          ) : (
            <div style={{ color: "#666", fontSize: 13 }}>Price unavailable</div>
          )}
        </div>
      </div>
    );

    return to ? (
      <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
        {CardInner}
      </Link>
    ) : (
      CardInner
    );
  }

  return (
    <div style={{ padding: "16px 16px 40px", maxWidth: 1500, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
        {breadcrumb.length ? (
          <>
            {breadcrumb.map((c, idx) => (
              <span key={c.path}>
                <Link to={`/c/${c.path}`} style={{ color: "#0a58ca", textDecoration: "none" }}>
                  {c.label}
                </Link>
                {idx < breadcrumb.length - 1 ? " > " : ""}
              </span>
            ))}
          </>
        ) : (
          <span>All Departments</span>
        )}
      </div>

      <h2 style={{ marginBottom: 12 }}>{heading}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>
        {/* Sidebar */}
        <aside style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, background: "#fff", height: "fit-content" }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Department</div>

          {sidebar.deptSubs.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: "1.8em" }}>
              {sidebar.deptSubs.slice(0, 60).map((p) => {
                const parts = p.split("/");
                const label = prettyLabelPart(parts[1] || p);
                const isActive = p === `${deptKey}/${(cleanedParts[1] || "")}` || p === categoryPathKey;
                return (
                  <li key={p}>
                    <Link
                      to={`/c/${p}`}
                      style={{
                        color: isActive ? "#111" : "#0a58ca",
                        textDecoration: "none",
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div style={{ color: "#666", fontSize: 13 }}>Loading categories…</div>
          )}

          {sidebar.children.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Subcategories</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: "1.8em" }}>
                {sidebar.children.slice(0, 80).map((p) => {
                  const last = p.split("/").pop() || p;
                  return (
                    <li key={p}>
                      <Link to={`/c/${p}`} style={{ color: "#0a58ca", textDecoration: "none" }}>
                        {prettyLabelPart(last)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {sidebar.siblings.length > 0 && cleanedParts.length > 2 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Related</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: "1.8em" }}>
                {sidebar.siblings.slice(0, 30).map((p) => {
                  const last = p.split("/").pop() || p;
                  const isActive = p === categoryPathKey;
                  return (
                    <li key={p}>
                      <Link
                        to={`/c/${p}`}
                        style={{
                          color: isActive ? "#111" : "#0a58ca",
                          textDecoration: "none",
                          fontWeight: isActive ? 700 : 400,
                        }}
                      >
                        {prettyLabelPart(last)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Main */}
        <main>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: "#666", fontSize: 13 }}>
              {products.length > 0 ? `${products.length.toLocaleString()} results` : ""}
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button disabled={page <= 1} onClick={() => goPage(page - 1)}>
                Prev
              </button>
              <span style={{ fontSize: 13 }}>
                Page {Math.min(page, totalPages)} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                Next
              </button>
            </div>
          </div>

          {loading && <div>Loading...</div>}

          {!loading && error && products.length === 0 && (
            <div>
              <strong>Category not found</strong>
              <div>{error}</div>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              }}
            >
              {/* Responsive 6-per-row on desktop */}
              <style>{`
                @media (min-width: 640px) {
                  .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                }
                @media (min-width: 1024px) {
                  .cat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                }
                @media (min-width: 1280px) {
                  .cat-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
                }
              `}</style>

              <div className="cat-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {pageProducts.map((p, idx) => {
                  const key = extractSlug(p) || p?.id || p?.asin || `${categoryPathKey}-${(page - 1) * PAGE_SIZE + idx}`;
                  return <CategoryProductCard key={key} product={p} />;
                })}
              </div>
            </div>
          )}

          {/* Bottom pagination */}
          {!loading && products.length > 0 && (
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 10, alignItems: "center" }}>
              <button disabled={page <= 1} onClick={() => goPage(page - 1)}>
                Prev
              </button>
              <span style={{ fontSize: 13 }}>
                Page {Math.min(page, totalPages)} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

