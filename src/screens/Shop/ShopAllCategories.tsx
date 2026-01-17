import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Shop > All Categories
 *
 * Loads category paths from:
 *  - https://ventari.net/indexes/_category_urls.json
 *
 * Then groups into Department cards with subcategory links + pagination.
 */

const R2_BASE = "https://ventari.net/indexes";
const CATEGORY_INDEX_URL = `${R2_BASE}/_category_urls.json`;

const PAGE_SIZE = 24; // cards per page
const SUBS_PER_DEPT = 8; // subcategory links shown per department card

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

function normalizeCategoryIndexToPaths(indexData: CategoryIndexShape): string[] {
  const out: string[] = [];

  // Object: keys are category paths
  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    for (const k of Object.keys(indexData)) {
      const cleaned = k.toString().replace(/^\/+|\/+$/g, "");
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  // Array: strings or objects
  if (Array.isArray(indexData)) {
    for (const item of indexData) {
      if (typeof item === "string") {
        const cleaned = item.replace(/^\/+|\/+$/g, "");
        if (cleaned) out.push(cleaned);
      } else if (item && typeof item === "object") {
        const raw = (item.url ?? item.path ?? item.slug ?? "").toString();
        const cleaned = raw.replace(/^\/+|\/+$/g, "");
        if (cleaned) out.push(cleaned);
      }
    }
  }

  return out;
}

function titleize(s: string) {
  return decodeURIComponent(s)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

type DeptCard = {
  dept: string;
  deptLabel: string;
  subs: Array<{ key: string; label: string; href: string }>;
  href: string;
};

export default function ShopAllCategories() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(CATEGORY_INDEX_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);

        const json = (await res.json()) as CategoryIndexShape;
        const paths = normalizeCategoryIndexToPaths(json);

        // Dedup + stable sort
        const dedup = Array.from(new Set(paths)).sort((a, b) => a.localeCompare(b));

        if (!cancelled) setAllPaths(dedup);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load categories");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build department cards from paths
  const deptCards: DeptCard[] = useMemo(() => {
    // dept -> Set(sub1)
    const deptToSubs = new Map<string, Set<string>>();

    for (const p of allPaths) {
      const parts = p.split("/").filter(Boolean);
      if (!parts.length) continue;

      const dept = parts[0];
      const sub1 = parts[1];

      if (!deptToSubs.has(dept)) deptToSubs.set(dept, new Set<string>());
      if (sub1) deptToSubs.get(dept)!.add(sub1);
    }

    const cards: DeptCard[] = [];
    for (const [dept, subsSet] of deptToSubs.entries()) {
      const subs = Array.from(subsSet)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, SUBS_PER_DEPT)
        .map((sub) => ({
          key: `${dept}/${sub}`,
          label: titleize(sub),
          href: `/c/${encodeURIComponent(dept)}/${encodeURIComponent(sub)}`,
        }));

      cards.push({
        dept,
        deptLabel: titleize(dept),
        subs,
        href: `/c/${encodeURIComponent(dept)}`,
      });
    }

    // sort by dept label
    cards.sort((a, b) => a.deptLabel.localeCompare(b.deptLabel));
    return cards;
  }, [allPaths]);

  // Filter by search query (department or subcategory)
  const filteredCards: DeptCard[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deptCards;

    return deptCards.filter((c) => {
      if (c.deptLabel.toLowerCase().includes(q)) return true;
      return c.subs.some((s) => s.label.toLowerCase().includes(q));
    });
  }, [deptCards, query]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));

  const pageItems = useMemo(
    () => paginate(filteredCards, page, PAGE_SIZE),
    [filteredCards, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-lg font-medium">Loading categories…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-lg font-medium">Couldn’t load categories</div>
        <div className="mt-2 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-semibold">All Departments</div>
          <div className="text-sm text-gray-600 mt-1">
            Showing {filteredCards.length.toLocaleString()} departments
          </div>
        </div>

        <div className="w-full sm:w-[360px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments or subcategories…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pageItems.map((card) => (
          <div
            key={card.dept}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div className="font-semibold text-base">{card.deptLabel}</div>

            <div className="mt-2 flex flex-col gap-1">
              {card.subs.map((s) => (
                <Link
                  key={s.key}
                  to={s.href}
                  className="text-sm text-blue-600 hover:underline"
                >
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
