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

type DeptCard = {
  dept: string;
  deptPath: string;
  subs: Array<{ label: string; path: string }>;
};

function stripPrefixSlash(s: string) {
  return s.replace(/^\/+/, "");
}

function normalizeCategoryIndexToPaths(indexData: CategoryIndexShape): string[] {
  const out: string[] = [];

  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    for (const k of Object.keys(indexData)) {
      const cleaned = stripPrefixSlash(k);
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  if (Array.isArray(indexData) && indexData.every((x) => typeof x === "string")) {
    for (const s of indexData) {
      const cleaned = stripPrefixSlash(s);
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  if (Array.isArray(indexData)) {
    for (const item of indexData) {
      const raw = item?.path || item?.url || item?.slug;
      if (typeof raw === "string") {
        const cleaned = stripPrefixSlash(raw);
        if (cleaned) out.push(cleaned);
      }
    }
  }

  return out;
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function prettyLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ShopAllCategories() {
  const [paths, setPaths] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(CATEGORY_INDEX_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = normalizeCategoryIndexToPaths(json);
        const dedup = Array.from(new Set(list)).sort();
        if (!cancelled) setPaths(dedup);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load categories");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const departments = useMemo<DeptCard[]>(() => {
    const map = new Map<string, Set<string>>();

    for (const p of paths) {
      const [dept, sub] = p.split("/").filter(Boolean);
      if (!dept) continue;
      if (!map.has(dept)) map.set(dept, new Set());
      if (sub) map.get(dept)!.add(sub);
    }

    return Array.from(map.entries())
      .map(([dept, subs]) => ({
        dept: prettyLabel(dept),
        deptPath: dept,
        subs: Array.from(subs)
          .slice(0, SUBS_PER_DEPT)
          .map((s) => ({ label: prettyLabel(s), path: `${dept}/${s}` })),
      }))
      .sort((a, b) => a.dept.localeCompare(b.dept));
  }, [paths]);

  const totalPages = Math.max(1, Math.ceil(departments.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => paginate(departments, page, PAGE_SIZE),
    [departments, page]
  );

  return (
    <div style={{ padding: 24 }}>
      <h1>All Departments</h1>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {pageItems.map((d) => (
          <div key={d.deptPath} style={{ border: "1px solid #eee", padding: 16 }}>
            <Link to={`/c/${d.deptPath}`}>
              <strong>{d.dept}</strong>
            </Link>

            <ul>
              {d.subs.map((s) => (
                <li key={s.path}>
                  <Link to={`/c/${s.path}`}>{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {page} / {totalPages}
        </span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
