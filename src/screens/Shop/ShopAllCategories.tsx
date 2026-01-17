import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * ShopAllCategories
 * - Uses indexes/_category_urls.json (5k+ category paths)
 * - Renders an Amazon-style "All Departments" grid
 * - Shows immediate subcategories (depth 2) with a per-dept "See more" toggle
 * - Search filters subcategories across departments
 */

const R2_BASE = "https://ventari.net/indexes";
const CATEGORY_INDEX_URL = `${R2_BASE}/_category_urls.json`;

const DEPTS_PER_PAGE = 24;
const SUBS_PREVIEW = 18;

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

type DeptCard = {
  deptKey: string;
  deptLabel: string;
  subs: Array<{ label: string; path: string }>;
};

function stripSlashes(s: string) {
  return s.replace(/^\/+|\/+$/g, "");
}

function normalizeCategoryPath(input: string): string {
  if (!input) return "";
  let s = String(input).trim();

  // If full URL contains "/c/", extract after it
  const idx = s.indexOf("/c/");
  if (idx !== -1) s = s.slice(idx + 3);

  s = s.replace(/^c\//, "");
  s = decodeURIComponent(s);

  s = stripSlashes(s).replace(/^\/+/, "");
  s = s.toLowerCase();
  s = s.replace(/\s+/g, "-").replace(/-+/g, "-");

  return s;
}

function prettyLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function normalizeCategoryIndexToPaths(indexData: CategoryIndexShape): string[] {
  const out: string[] = [];

  // Object map: keys are paths
  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    for (const k of Object.keys(indexData)) {
      const cleaned = normalizeCategoryPath(k);
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  // Array of strings
  if (Array.isArray(indexData) && indexData.every((x) => typeof x === "string")) {
    for (const s of indexData as string[]) {
      const cleaned = normalizeCategoryPath(s);
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  // Array of objects
  if (Array.isArray(indexData)) {
    for (const item of indexData as Array<any>) {
      const raw = item?.path || item?.url || item?.slug;
      if (typeof raw === "string") {
        const cleaned = normalizeCategoryPath(raw);
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

export default function ShopAllCategories() {
  const [paths, setPaths] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(CATEGORY_INDEX_URL, { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const list = normalizeCategoryIndexToPaths(json);

        const dedup = Array.from(new Set(list))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

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
      const parts = p.split("/").filter(Boolean);
      const dept = parts[0];
      const sub = parts[1];
      if (!dept) continue;

      if (!map.has(dept)) map.set(dept, new Set<string>());
      if (sub) map.get(dept)!.add(sub);
    }

    const out = Array.from(map.entries())
      .map(([deptKey, subs]) => {
        const subList = Array.from(subs)
          .sort((a, b) => a.localeCompare(b))
          .map((s) => ({
            label: prettyLabel(s),
            path: `${deptKey}/${s}`,
          }));

        return {
          deptKey,
          deptLabel: prettyLabel(deptKey),
          subs: subList,
        };
      })
      .sort((a, b) => a.deptLabel.localeCompare(b.deptLabel));

    const query = q.trim().toLowerCase();
    if (!query) return out;

    return out
      .map((d) => ({
        ...d,
        subs: d.subs.filter((s) => s.label.toLowerCase().includes(query) || s.path.toLowerCase().includes(query)),
      }))
      .filter((d) => d.subs.length > 0 || d.deptLabel.toLowerCase().includes(query));
  }, [paths, q]);

  const totalPages = Math.max(1, Math.ceil(departments.length / DEPTS_PER_PAGE));
  const pageItems = useMemo(() => paginate(departments, page, DEPTS_PER_PAGE), [departments, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function toggleDept(deptKey: string) {
    setExpanded((prev) => ({ ...prev, [deptKey]: !prev[deptKey] }));
  }

  return (
    <div style={{ padding: 24, maxWidth: 1500, margin: "0 auto", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8, color: "#0f1111" }}>All Departments</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search categories…"
          style={{
            width: 420,
            maxWidth: "100%",
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        <div style={{ fontSize: 12, color: "#565959" }}>
          {loading ? "Loading…" : `${paths.length.toLocaleString()} category paths`}
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {pageItems.map((d) => {
          const isExpanded = !!expanded[d.deptKey];
          const subs = isExpanded ? d.subs : d.subs.slice(0, SUBS_PREVIEW);
          const showToggle = d.subs.length > SUBS_PREVIEW;

          return (
            <div key={d.deptKey} style={{ border: "1px solid #eee", padding: 16, borderRadius: 10, background: "#fff" }}>
              <Link to={`/c/${d.deptKey}`} style={{ textDecoration: "none", color: "#0f1111" }}>
                <strong>{d.deptLabel}</strong>
              </Link>

              {subs.length > 0 ? (
                <ul style={{ marginTop: 10, lineHeight: "1.65em" }}>
                  {subs.map((s) => (
                    <li key={s.path}>
                      <Link to={`/c/${s.path}`} style={{ color: "#007185", textDecoration: "none" }}>
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ marginTop: 10, color: "#565959", fontSize: 13 }}>No matching subcategories</div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                {showToggle ? (
                  <button
                    onClick={() => toggleDept(d.deptKey)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#007185",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {isExpanded ? "See less" : "See more"}
                  </button>
                ) : (
                  <span />
                )}

                <Link to={`/c/${d.deptKey}`} style={{ color: "#007185", textDecoration: "none" }}>
                  Shop department →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 10, alignItems: "center" }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span style={{ margin: "0 10px", color: "#565959" }}>
          Page {page} / {totalPages}
        </span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
