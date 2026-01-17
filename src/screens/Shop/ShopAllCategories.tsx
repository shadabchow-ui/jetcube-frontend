import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const R2_BASE = "https://ventari.net/indexes";
const CATEGORY_INDEX_URL = `${R2_BASE}/_category_urls.json`;

const PAGE_SIZE = 24;
const SUBS_PER_DEPT = 8;

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

function normalizeCategoryIndexToPaths(indexData: CategoryIndexShape): string[] {
  const out: string[] = [];

  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    for (const k of Object.keys(indexData)) {
      const cleaned = k.replace(/^\/+|\/+$/g, "");
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  if (Array.isArray(indexData)) {
    for (const item of indexData) {
      if (typeof item === "string") {
        const cleaned = item.replace(/^\/+|\/+$/g, "");
        if (cleaned) out.push(cleaned);
      } else if (item && typeof item === "object") {
        const raw = item.url ?? item.path ?? item.slug;
        if (raw) {
          const cleaned = raw.replace(/^\/+|\/+$/g, "");
          if (cleaned) out.push(cleaned);
        }
      }
    }
  }

  return out;
}

function titleize(s: string) {
  return decodeURIComponent(s)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function paginate<T>(items: T[], page: number, size: number) {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}

type DeptCard = {
  dept: string;
  label: string;
  href: string;
  subs: { key: string; label: string; href: string }[];
};

export default function ShopAllCategories() {
  const [paths, setPaths] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(CATEGORY_INDEX_URL);
        if (!res.ok) throw new Error("Failed to load categories");
        const json = (await res.json()) as CategoryIndexShape;
        const normalized = normalizeCategoryIndexToPaths(json);
        setPaths([...new Set(normalized)].sort());
      } catch (e: any) {
        setError(e.message ?? "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = useMemo<DeptCard[]>(() => {
    const map = new Map<string, Set<string>>();

    for (const p of paths) {
      const [dept, sub] = p.split("/");
      if (!dept) continue;
      if (!map.has(dept)) map.set(dept, new Set());
      if (sub) map.get(dept)!.add(sub);
    }

    return Array.from(map.entries()).map(([dept, subs]) => ({
      dept,
      label: titleize(dept),
      href: `/c/${encodeURIComponent(dept)}`,
      subs: Array.from(subs)
        .slice(0, SUBS_PER_DEPT)
        .map((s) => ({
          key: `${dept}/${s}`,
          label: titleize(s),
          href: `/c/${encodeURIComponent(dept)}/${encodeURIComponent(s)}`,
        })),
    }));
  }, [paths]);

  const filtered = useMemo(() => {
    if (!query) return cards;
    const q = query.toLowerCase();
    return cards.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.subs.some((s) => s.label.toLowerCase().includes(q))
    );
  }, [cards, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => paginate(filtered, page, PAGE_SIZE),
    [filtered, page]
  );

  if (loading) return <div className="p-6">Loading categories…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">All Departments</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className="border px-3 py-2 rounded text-sm w-64"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pageItems.map((c) => (
          <div key={c.dept} className="border rounded p-4 bg-white">
            <Link to={c.href} className="font-semibold block mb-2">
              {c.label}
            </Link>
            {c.subs.map((s) => (
              <Link
                key={s.key}
                to={s.href}
                className="block text-sm text-blue-600 hover:underline"
              >
                {s.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-8">
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
