import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * Browse ALL categories (paginated)
 * Data source:
 *  - https://ventari.net/indexes/_category_urls.json
 *
 * Route:
 *  - /shop/all?page=1
 */

const CATEGORY_INDEX_URL =
  "https://ventari.net/indexes/_category_urls.json";

const PAGE_SIZE = 60; // safe for 5k+ categories

/* ---------------- helpers ---------------- */

function normalizeCategoryUrls(data: any): string[] {
  if (Array.isArray(data)) {
    return data.map(String);
  }

  if (data && typeof data === "object") {
    return Object.keys(data);
  }

  return [];
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function humanizePath(path: string) {
  return path
    .split("/")
    .map((p) =>
      p
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(" › ");
}

/* ---------------- component ---------------- */

export default function ShopAllCategories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(CATEGORY_INDEX_URL, {
          cache: "force-cache",
        });

        if (!res.ok) {
          throw new Error(`Failed to load categories (${res.status})`);
        }

        const data = await res.json();
        const normalized = normalizeCategoryUrls(data);

        if (!cancelled) {
          setAllCategories(normalized);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Unknown error");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil(allCategories.length / PAGE_SIZE)
  );

  const pageItems = useMemo(
    () => paginate(allCategories Outstanding, page, PAGE_SIZE),
    [allCategories, page]
  );

  if (loading) {
    return <div style={{ padding: 24 }}>Loading categories…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <strong>Error</strong>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 48px" }}>
      <h1 style={{ marginBottom: 12 }}>Browse All Categories</h1>

      <div style={{ marginBottom: 16, color: "#666" }}>
        Showing {pageItems.length} of {allCategories.length} categories
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 10,
          marginBottom: 32,
        }}
      >
        {pageItems.map((path) => (
          <Link
            key={path}
            to={`/c/${path}`}
            style={{
              padding: "8px 6px",
              textDecoration: "none",
              color: "#007185",
              fontSize: 14,
            }}
          >
            {humanizePath(path)}
          </Link>
        ))}
      </div>

      {/* pagination */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <button
          disabled={page <= 1}
          onClick={() =>
            setSearchParams({ page: String(page - 1) })
          }
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() =>
            setSearchParams({ page: String(page + 1) })
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}
