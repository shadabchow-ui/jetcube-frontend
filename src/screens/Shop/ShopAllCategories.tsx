import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Uses category routing data from:
 *   https://ventari.net/indexes/_category_urls.json
 *
 * - Shows "All Departments" as cards
 * - Each card shows a handful of subcategories
 * - Pagination is by departments (not individual leaf categories)
 */

const R2_BASE = "https://ventari.net/indexes";
const CATEGORY_INDEX_URL = `${R2_BASE}/_category_urls.json`;

const PAGE_SIZE = 24; // departments per page
const SUBS_PER_DEPT = 8; // subcategories shown per department card

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

function normalizeCategoryIndexToPaths(indexData: CategoryIndexShape): string[] {
  const out: string[] = [];

  if (!indexData) return out;

  // Case 1: object map
  if (typeof indexData === "object" && !Array.isArray(indexData)) {
    for (const k of Object.keys(indexData)) {
      const cleaned = k.replace(/^\/*|\/*$/g, "");
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  // Case 2: array
  if (Array.isArray(indexData)) {
    for (const item of indexData) {
      if (typeof item === "string") {
        const cleaned = item.replace(/^\/*|\/*$/g, "");
        if (cleaned) out.push(cleaned);
      } else if (item && typeof item === "object") {
        const raw = (item.url ?? item.path ?? item.slug ?? "") as string;
        const cleaned = raw.replace(/^\/*|\/*$/g, "");
        if (cleaned) out.push(cleaned);
      }
    }
  }

  return out;
}

function splitPath(pathname: string): string[] {
  return pathname
    .replace(/^\/*|\/*$/g, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
}

function titleize(s: string): string {
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

type DeptCard = {
  deptKey: string;
  deptLabel: string;
  href: string;
  subs: Array<{ key: string; label: string; href: string }>;
};

export default function ShopAllCategories() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(CATEGORY_INDEX_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch categories (${res.status})`);

        const json = (await res.json()) as CategoryIndexShape;
        const paths = normalizeCategoryIndexToPaths(json);

        // Sort for stable display (by department then by depth)
        paths.sort((a, b) => a.localeCompare(b));

        if (!alive) return;
        setAllPaths(paths);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load categories");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // Build department -> set(subcategory) map from paths
  const deptMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    for (const p of allPaths) {
      const parts = splitPath(p);
      if (parts.length === 0) continue;

      const dept = parts[0];
      if (!map.has(dept)) map.set(dept, new Set());

      // Add subcategory if present (dept/sub)
      if (parts.length >= 2) {
        map.get(dept)!.add(parts[1]);
      }
    }

    return map;
  }, [allPaths]);

  const deptKeys = useMemo(() => Array.from(deptMap.keys()).sort((a, b) => a.localeCompare(b)), [deptMap]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(deptKeys.length / PAGE_SIZE)), [deptKeys.length]);

  // keep page in range
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  const pageDeptKeys = useMemo(() => paginate(deptKeys, page, PAGE_SIZE), [deptKeys, page]);

  const cards: DeptCard[] = useMemo(() => {
    return pageDeptKeys.map((deptKey) => {
      const subs = Array.from(deptMap.get(deptKey) ?? []).sort((a, b) => a.localeCompare(b));

      return {
        deptKey,
        deptLabel: titleize(deptKey),
        href: `/c/${encodeURIComponent(deptKey)}`,
        subs: subs.slice(0, SUBS_PER_DEPT).map((sub) => ({
          key: `${deptKey}/${sub}`,
          label: titleize(sub),
          href: `/c/${encodeURIComponent(deptKey)}/${encodeURIComponent(sub)}`,
        })),
      };
    });
  }, [deptMap, pageDeptKeys]);

  if (loading) {
    return <div className="p-6">Loading categories…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="font-semibold text-red-600">Failed to load categories</div>
        <div className="mt-2 text-sm text-gray-700">{error}</div>
        <div className="mt-3 text-xs text-gray-500">Source: {CATEGORY_INDEX_URL}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-2xl font-semibold mb-6">All Departments</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.deptKey} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="font-semibold text-base">{card.deptLabel}</div>

            <div className="mt-2 flex flex-col gap-1">
              {card.subs.map((s) => (
                <Link key={s.key} to={s.href} className="text-sm text-blue-600 hover:underline">
                  {s.label}
                </Link>
              ))}
            </div>

            <div className="mt-3">
              <Link to={card.href} className="text-sm font-semibold hover:underline">
                Shop all {card.deptLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-2 text-sm border rounded-md disabled:opacity-50"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 text-sm border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
