import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

// Rufus Assistant (SCOUT tab)
import {
  AssistantContextProvider,
  AssistantDrawer,
  useAssistant,
} from "@/components/RufusAssistant";

/* ============================
   R2 Base (PUBLIC)
   ============================ */
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

type CategoryUrlEntry = {
  category_key: string;
  url: string; // like "/c/women/dresses"
  title?: string;
  count?: number;
};

type ProductSummary = {
  handle?: string;
  slug?: string;
  asin?: string;
  id?: string;

  title?: string;
  price?: number | string;
  rating?: number | string;

  category_keys?: string[]; // ✅ what your normalize step should provide
  category_key?: string;
  categoryKey?: string;

  image?: unknown;
  thumbnail?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  images?: unknown;
  gallery_images?: unknown;

  [k: string]: any;
};

/* ------------------------------------
 * Amazon-style SCOUT tab (LEFT FLOATING)
 * ---------------------------------- */
function ScoutTab() {
  const { setOpen } = useAssistant();

  return (
    <button
      type="button"
      aria-label="Open Scout"
      onClick={() => setOpen(true)}
      className="
        hidden md:flex
        fixed left-[15px] top-1/2 z-[9999]
        bg-black text-white
        border-2 border-white
        shadow-2xl
        px-5 py-4
        text-base font-extrabold
        tracking-widest
        rounded-r-xl
        hover:bg-[#111]
        focus:outline-none focus:ring-2 focus:ring-white
      "
      style={{
        transform: "translateY(-50%) rotate(-90deg)",
        transformOrigin: "left center",
        letterSpacing: "0.2em",
      }}
    >
      scout
    </button>
  );
}

function titleizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toNumberMaybe(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

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
    p?.thumbnail,
    p?.image,
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

function getProductKey(p: ProductSummary): string | null {
  const key =
    (typeof p.handle === "string" && p.handle) ||
    (typeof p.slug === "string" && p.slug) ||
    (typeof p.asin === "string" && p.asin) ||
    (typeof p.id === "string" && p.id) ||
    null;
  return key && key.length ? key : null;
}

async function fetchJsonSafe(url: string): Promise<any> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);

  const ct = r.headers.get("content-type") || "";
  const text = await r.text();

  // Vite/SPA fallback returns HTML for wrong paths
  if (
    ct.includes("text/html") ||
    text.trim().startsWith("<!DOCTYPE") ||
    text.trim().startsWith("<html")
  ) {
    const first = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(
      `Expected JSON but got HTML for ${url}. First chars: ${first}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    const first = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`Failed to parse JSON for ${url}. First chars: ${first}`);
  }
}

async function fetchFirstJson(urls: string[]): Promise<any> {
  let lastErr: any = null;
  for (const u of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fetchJsonSafe(u);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Failed to fetch JSON");
}

function normalizePathname(pathname: string) {
  const p = (pathname || "").trim();
  if (!p) return "/";
  return p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p;
}

function findBestCategoryMatch(
  pathname: string,
  cats: CategoryUrlEntry[]
): CategoryUrlEntry | null {
  const p = normalizePathname(pathname);

  // exact match first
  const exact = cats.find((c) => normalizePathname(c.url) === p);
  if (exact) return exact;

  // longest prefix match (handles deeper routes)
  let best: CategoryUrlEntry | null = null;
  for (const c of cats) {
    const u = normalizePathname(c.url);
    if (u !== "/" && p.startsWith(u)) {
      if (!best || u.length > normalizePathname(best.url).length) best = c;
    }
  }
  return best;
}

function productHasCategory(p: ProductSummary, categoryKey: string): boolean {
  const key = String(categoryKey || "").trim();
  if (!key) return false;

  if (Array.isArray(p.category_keys)) return p.category_keys.includes(key);

  const k1 =
    typeof (p as any).category_key === "string" ? (p as any).category_key : "";
  const k2 =
    typeof (p as any).categoryKey === "string" ? (p as any).categoryKey : "";
  return k1 === key || k2 === key;
}

export default function CategoryPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const sort = searchParams.get("sort") || "featured";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const perPage = 24;

  const [cats, setCats] = useState<CategoryUrlEntry[] | null>(null);
  const [products, setProducts] = useState<ProductSummary[] | null>(null);

  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Load category URLs from /indexes (your new source of truth)
  useEffect(() => {
    let cancelled = false;
    setLoadingCats(true);

    (async () => {
      try {
        const json = await fetchFirstJson([
          joinUrl(R2_PUBLIC_BASE, "indexes/_category_urls.json"),
          joinUrl(R2_PUBLIC_BASE, "products/_category_urls.json"),
        ]);

        const arr: any[] = Array.isArray(json) ? json : [];
        const normalized: CategoryUrlEntry[] = arr
          .map((x: any) => ({
            category_key: String(x?.category_key || x?.categoryKey || "").trim(),
            url: String(x?.url || "").trim(),
            title: typeof x?.title === "string" ? x.title : undefined,
            count:
              typeof x?.count === "number"
                ? x.count
                : toNumberMaybe(x?.count) ?? undefined,
          }))
          .filter((x) => x.category_key && x.url && x.url.startsWith("/c/"));

        if (!cancelled) {
          setCats(normalized);
          setLoadingCats(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setCats([]);
          setLoadingCats(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Load product index from /indexes/_index.json (has images + category_keys)
  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    setError(null);

    (async () => {
      try {
        const json = await fetchFirstJson([
          joinUrl(R2_PUBLIC_BASE, "indexes/_index.json"),
          joinUrl(R2_PUBLIC_BASE, "products/_index.json"),
        ]);

        const arr: any[] = Array.isArray(json) ? json : [];

        const normalized: ProductSummary[] = arr
          .map((p: any) => {
            if (typeof p === "string") {
              return { handle: p, slug: p, asin: p, title: p };
            }
            const key =
              (typeof p?.handle === "string" && p.handle) ||
              (typeof p?.slug === "string" && p.slug) ||
              (typeof p?.asin === "string" && p.asin) ||
              (typeof p?.id === "string" && p.id) ||
              "";

            return {
              ...p,
              handle: key,
              title: typeof p?.title === "string" ? p.title : key,
              image: pickProductImage(p),
            } as ProductSummary;
          })
          .filter((p) => !!getProductKey(p));

        if (!cancelled) {
          setProducts(normalized);
          setLoadingProducts(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load product index");
          setProducts([]);
          setLoadingProducts(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pathname = normalizePathname(location.pathname);

  const activeCategory = useMemo(() => {
    if (!cats?.length) return null;
    return findBestCategoryMatch(pathname, cats);
  }, [cats, pathname]);

  const activeCategoryKey = activeCategory?.category_key || "";

  const categoryTitle = useMemo(() => {
    if (activeCategory?.title) return activeCategory.title;
    // fallback: last slug segment
    const seg =
      pathname.replace(/^\/c\/?/, "").split("/").filter(Boolean).pop() || "";
    return seg ? titleizeSlug(seg) : "Category";
  }, [activeCategory, pathname]);

  const filtered = useMemo(() => {
    if (!products?.length) return [];
    if (!activeCategoryKey) return products;

    return products.filter((p) => productHasCategory(p, activeCategoryKey));
  }, [products, activeCategoryKey]);

  const sorted = useMemo(() => {
    const arr = [...filtered];

    if (sort === "price_low") {
      arr.sort(
        (a, b) => (toNumberMaybe(a.price) ?? 0) - (toNumberMaybe(b.price) ?? 0)
      );
    } else if (sort === "price_high") {
      arr.sort(
        (a, b) => (toNumberMaybe(b.price) ?? 0) - (toNumberMaybe(a.price) ?? 0)
      );
    } else if (sort === "rating") {
      arr.sort(
        (a, b) => (toNumberMaybe(b.rating) ?? 0) - (toNumberMaybe(a.rating) ?? 0)
      );
    }

    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, safePage]);

  // keep URL query in sync
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", sort);
    next.set("page", String(safePage));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, safePage]);

  const loading = loadingCats || loadingProducts;

  return (
    <AssistantContextProvider context="category">
      {/* Drawer (opens when SCOUT is clicked) */}
      <AssistantDrawer />

      {/* Amazon-style floating SCOUT tab */}
      <ScoutTab />

      <div className="w-full bg-white">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500">
                <Link to="/shop" className="hover:underline">
                  Shop
                </Link>
                <span className="mx-2">/</span>
                <span>{categoryTitle}</span>
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                {categoryTitle}
              </h1>
              {activeCategory?.count ? (
                <div className="mt-1 text-sm text-gray-600">
                  {activeCategory.count.toLocaleString()} items
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Sort</label>
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                value={sort}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  next.set("sort", e.target.value);
                  next.set("page", "1");
                  setSearchParams(next);
                }}
              >
                <option value="featured">Featured</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 text-sm text-gray-500">Loading…</div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pageItems.map((p) => {
                  const key = getProductKey(p) || "";
                  const img = pickProductImage(p);

                  const price = toNumberMaybe(p.price);
                  const rating = toNumberMaybe(p.rating);

                  return (
                    <Link
                      key={key}
                      to={`/p/${encodeURIComponent(
                        String(p.handle || p.slug || p.asin || p.id || key)
                      )}`}
                      className="group block rounded-md border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition"
                    >
                      <div className="p-2">
                        <div className="relative aspect-square bg-gray-50 rounded overflow-hidden">
                          {img ? (
                            <img
                              src={img}
                              alt={p.title || "Product"}
                              loading="lazy"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-sm text-gray-900 line-clamp-2">
                          {p.title || key}
                        </div>

                        <div className="mt-1 flex items-baseline gap-2">
                          {typeof price === "number" ? (
                            <span className="text-[15px] font-semibold">
                              ${price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              See price
                            </span>
                          )}
                        </div>

                        {typeof rating === "number" ? (
                          <div className="mt-1 text-xs text-gray-700">★★★★☆</div>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  className="px-3 py-2 text-sm border rounded disabled:opacity-50"
                  disabled={safePage <= 1}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("page", String(Math.max(1, safePage - 1)));
                    setSearchParams(next);
                  }}
                >
                  Prev
                </button>

                <div className="text-sm text-gray-600">
                  Page {safePage} of {totalPages}
                </div>

                <button
                  className="px-3 py-2 text-sm border rounded disabled:opacity-50"
                  disabled={safePage >= totalPages}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("page", String(Math.min(totalPages, safePage + 1)));
                    setSearchParams(next);
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AssistantContextProvider>
  );
}


