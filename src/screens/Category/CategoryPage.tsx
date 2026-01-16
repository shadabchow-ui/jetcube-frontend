import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ProductCard } from "../ProductCard";

/**
 * Category routing:
 *  - /c/<department>/<sub>/<sub>...
 *  - /<department>/<sub>/<sub>... (wildcard)
 *
 * Data:
 *  - indexes/_category_urls.json
 *  - indexes/category_products/<hyphen-path>.json
 */

const R2_BASE = "https://ventari.net/indexes";
const CATEGORY_INDEX_URL = `${R2_BASE}/_category_urls.json`;
const CATEGORY_PRODUCTS_BASE = `${R2_BASE}/category_products`;

function toCategoryFilenameFromPath(pathname: string) {
  const raw = pathname.replace(/^\/+|\/+$/g, "");
  const parts = raw.split("/").filter(Boolean).map(decodeURIComponent);
  const cleaned = parts[0] === "c" ? parts.slice(1) : parts;
  return {
    cleanedParts: cleaned,
    filename: `${cleaned.join("-")}.json`,
  };
}

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

function normalizeCategoryIndexToSet(indexData: CategoryIndexShape) {
  const out = new Set<string>();

  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    Object.keys(indexData).forEach((k) => {
      const key = k.replace(/^\/+|\/+$/g, "");
      if (key) out.add(key);
    });
    return out;
  }

  if (Array.isArray(indexData)) {
    for (const item of indexData) {
      if (typeof item === "string") {
        const s = item.replace(/^\/+|\/+$/g, "");
        if (s) out.add(s);
      } else if (item && typeof item === "object") {
        const s = (item.url ?? item.path ?? item.slug ?? "")
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

  const categoryPathKey = useMemo(
    () => cleanedParts.join("/"),
    [cleanedParts]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setProducts([]);
      setCategoryExists(null);

      try {
        const idxRes = await fetch(CATEGORY_INDEX_URL, { cache: "no-store" });
        if (!idxRes.ok) {
          throw new Error(`Failed to load category index (${idxRes.status})`);
        }

        const idxJson = (await idxRes.json()) as CategoryIndexShape;
        const idxSet = normalizeCategoryIndexToSet(idxJson);
        const exists = idxSet.size ? idxSet.has(categoryPathKey) : true;

        if (!cancelled) setCategoryExists(exists);

        const url = `${CATEGORY_PRODUCTS_BASE}/${filename}`;
        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
          const legacy = `${cleanedParts.join("__")}.json`;
          const legacyRes = await fetch(
            `${CATEGORY_PRODUCTS_BASE}/${legacy}`,
            { cache: "no-store" }
          );

          if (!legacyRes.ok) {
            throw new Error(`Category file not found (${res.status})`);
          }

          if (!cancelled) setProducts(await legacyRes.json());
          return;
        }

        if (!cancelled) setProducts(await res.json());
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

  const heading = useMemo(
    () => (cleanedParts.length ? cleanedParts.join(" > ") : "All Departments"),
    [cleanedParts]
  );

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <h2 style={{ marginBottom: 12 }}>{heading}</h2>

      {loading && <div>Loading...</div>}

      {!loading && error && (
        <div>
          <strong>Category not found</strong>
          <div>{error}</div>
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
          {products.map((p) => (
            <ProductCard key={p?.slug ?? crypto.randomUUID()} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
