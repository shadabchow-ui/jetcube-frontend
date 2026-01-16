import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

// ✅ FIX: correct relative path (CategoryPage.tsx -> ../ProductCard.tsx)
import { ProductCard } from "../ProductCard";

/**
 * Category routing expects:
 *  - /c/<department>/<sub>/<sub>...
 *  - OR /<department>/<sub>/<sub>...   (wildcard route)
 *
 * Data sources:
 *  - indexes/_category_urls.json           (category index)
 *  - indexes/category_products/<file>.json (category products)
 */

// Keep your base exactly as-is (don’t change env assumptions)
const R2_BASE = "https://ventari.net/indexes";

// ✅ Your actual file in R2 (your Network tab showed category_urls.json 404)
const CATEGORY_INDEX_URL = `${R2_BASE}/_category_urls.json`;

// ✅ Your uploaded folder in R2
const CATEGORY_PRODUCTS_BASE = `${R2_BASE}/category_products`;

function toCategoryFilenameFromPath(pathname: string) {
  const raw = pathname.replace(/^\/+|\/+$/g, "");
  const parts = raw.split("/").filter(Boolean).map(decodeURIComponent);

  // Support both /c/... and non-/c/...
  const cleaned = parts[0] === "c" ? parts.slice(1) : parts;

  // Join segments with hyphen to match your new generated files
  const filename = `${cleaned.join("-")}.json`;

  return { cleanedParts: cleaned, filename };
}

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

function normalizeCategoryIndexToSet(indexData: CategoryIndexShape) {
  const out = new Set<string>();

  // Case 1: object map { "<path>": {...}, ... }
  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    Object.keys(indexData).forEach((k) => {
      const kk = String(k || "").replace(/^\/+|\/+$/g, "");
      if (kk) out.add(kk);
    });
    return out;
  }

  // Case 2: array of strings ["a/b/c", ...]
  if (Array.isArray(indexData)) {
    for (const item of indexData) {
      if (typeof item === "string") {
        const s = item.replace(/^\/+|\/+$/g, "");
        if (s) out.add(s);
        continue;
      }
      if (item && typeof item === "object") {
        const s =
          (item.url ?? item.path ?? item.slug ?? "")
            .toString()
            .replace(/^\/+|\/+$/g, "");
        if (s) out.add(s);
      }
    }
  }

  return out;
}

export default function CategoryPage() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [categoryExists, setCategoryExists] = useState<boolean | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { cleanedParts, filename } = useMemo(
    () => toCategoryFilenameFromPath(location.pathname),
    [location.pathname]
  );

  const categoryPathKey = useMemo(() => cleanedParts.join("/"), [cleanedParts]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setProducts([]);
      setCategoryExists(null);

      try {
        // 1) Load category index
        const idxRes = await fetch(CATEGORY_INDEX_URL, { cache: "no-store" });
        if (!idxRes.ok) {
          throw new Error(`Failed to load category index (${idxRes.status})`);
        }
        const idxJson = (await idxRes.json()) as CategoryIndexShape;
        const idxSet = normalizeCategoryIndexToSet(idxJson);

        // If index is empty, don’t block; still try to fetch category file.
        const existsInIndex = idxSet.size ? idxSet.has(categoryPathKey) : true;
        if (!cancelled) setCategoryExists(existsInIndex);

        // 2) Fetch category products (hyphen filename)
        const url = `${CATEGORY_PRODUCTS_BASE}/${filename}`;
        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
          // Optional: fallback for older "__" naming if you ever need it
          const legacy = `${cleanedParts.join("__")}.json`;
          const legacyUrl = `${CATEGORY_PRODUCTS_BASE}/${legacy}`;
          const legacyRes = await fetch(legacyUrl, { cache: "no-store" });

          if (!legacyRes.ok) {
            throw new Error(`Category file not found (${res.status})`);
          }

          const legacyData = await legacyRes.json();
          const legacyProducts = Array.isArray(legacyData) ? legacyData : [];
          if (!cancelled) setProducts(legacyProducts);
          return;
        }

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        if (!cancelled) setProducts(arr);
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
  }, [categoryPathKey, cleanedParts, filename]);

  const heading = useMemo(() => {
    if (!cleanedParts.length) return "All Departments";
    return cleanedParts.join(" > ");
  }, [cleanedParts]);

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <h2 style={{ margin: "0 0 12px" }}>{heading}</h2>

      {loading && <div>Loading...</div>}

      {!loading && error && (
        <div>
          <div style={{ fontWeight: 600 }}>Category not found</div>
          <div style={{ opacity: 0.8 }}>{error}</div>
          <div style={{ opacity: 0.8 }}>This category is not available yet.</div>
        </div>
      )}

      {!loading && !error && categoryExists === false && (
        <div style={{ marginBottom: 12, opacity: 0.85 }}>
          Category not found
          <br />
          This category is not available yet.
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {products.map((p: any) => (
            <ProductCard key={p?.slug ?? `${Math.random()}`} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
