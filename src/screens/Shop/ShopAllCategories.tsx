import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * ShopAllCategories (now the main /shop page)
 * Amazon-style department directory:
 * - Shows top-level departments + first-level subcategories (depth=2)
 * - Uses canonical category paths from indexes/_category_urls.json (no hardcoding)
 * - Search filters departments and subcategories
 * - Dense typography + spacing similar to Amazon's "Shop by Department" directory
 *
 * Notes:
 * - Keep this component name to avoid breaking existing imports.
 * - In App.tsx, route /shop -> <ShopAllCategories /> (index route)
 *   Optional: /shop/browse -> legacy <Shop /> if you still want it.
 */

const INDEX_BASE = "https://ventari.net/indexes";
const CATEGORY_INDEX_URL = `${INDEX_BASE}/_category_urls.json`;

const SUBS_PREVIEW = 12; // Amazon-like short list per dept; expandable

type CategoryIndexShape =
  | Record<string, any>
  | string[]
  | Array<{ url?: string; path?: string; slug?: string }>;

type Dept = {
  key: string; // slug
  label: string; // pretty name
  subs: Array<{ key: string; label: string; path: string }>; // depth=2
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
  s = s.replace(/\s+/g, "-");
  s = s.replace(/-+/g, "-");

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

export default function ShopAllCategories() {
  const [paths, setPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(CATEGORY_INDEX_URL, { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as CategoryIndexShape;
        const list = normalizeCategoryIndexToPaths(json);

        const dedup = Array.from(new Set(list))
          .map((p) => normalizeCategoryPath(p))
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

  const departments = useMemo<Dept[]>(() => {
    const deptMap = new Map<string, Map<string, string>>(); // dept -> (subKey -> fullPath)

    for (const p of paths) {
      const parts = p.split("/").filter(Boolean);
      const dept = parts[0];
      const sub = parts[1];
      if (!dept) continue;

      if (!deptMap.has(dept)) deptMap.set(dept, new Map());
      if (sub) deptMap.get(dept)!.set(sub, `${dept}/${sub}`);
    }

    const out: Dept[] = Array.from(deptMap.entries())
      .map(([deptKey, subsMap]) => {
        const subs = Array.from(subsMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([subKey, fullPath]) => ({
            key: subKey,
            label: prettyLabel(subKey),
            path: fullPath,
          }));

        return {
          key: deptKey,
          label: prettyLabel(deptKey),
          subs,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    const query = q.trim().toLowerCase();
    if (!query) return out;

    return out
      .map((d) => {
        const deptMatch = d.label.toLowerCase().includes(query) || d.key.includes(query);
        const subs = d.subs.filter(
          (s) => s.label.toLowerCase().includes(query) || s.key.includes(query) || s.path.includes(query)
        );
        return deptMatch ? d : { ...d, subs };
      })
      .filter((d) => d.label.toLowerCase().includes(query) || d.key.includes(query) || d.subs.length > 0);
  }, [paths, q]);

  function toggleDept(deptKey: string) {
    setExpanded((prev) => ({ ...prev, [deptKey]: !prev[deptKey] }));
  }

  return (
    <div className="amz-shopPage">
      <style>{`
        .amz-shopPage{
          max-width: 1500px;
          margin: 0 auto;
          padding: 16px 12px 40px;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f1111;
        }

        .amz-shopHeader{
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .amz-h1{
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .amz-meta{
          font-size: 12px;
          color: #565959;
        }

        .amz-searchRow{
          display:flex;
          align-items:center;
          gap: 10px;
          margin: 10px 0 16px;
        }
        .amz-search{
          width: 520px;
          max-width: 100%;
          padding: 10px 12px;
          border: 1px solid #d5d9d9;
          border-radius: 8px;
          font-size: 13px;
        }
        .amz-search:focus{
          outline: none;
          border-color: #007185;
          box-shadow: 0 0 0 3px rgba(0,113,133,.15);
        }

        .amz-grid{
          display:grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        @media (min-width: 760px){ .amz-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (min-width: 1100px){ .amz-grid{ grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .amz-dept{
          background:#fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px 12px 10px;
        }
        .amz-deptTitle{
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 8px;
          line-height: 1.2;
        }
        .amz-deptTitle a{
          color:#0f1111;
          text-decoration:none;
        }
        .amz-deptTitle a:hover{
          color:#c7511f;
          text-decoration:underline;
        }

        .amz-subList{
          list-style:none;
          padding: 0;
          margin: 0;
          line-height: 1.85;
        }
        .amz-subList a{
          font-size: 13px;
          color:#007185;
          text-decoration:none;
          display:inline-block;
          max-width: 100%;
          overflow:hidden;
          white-space:nowrap;
          text-overflow:ellipsis;
        }
        .amz-subList a:hover{
          color:#c7511f;
          text-decoration:underline;
        }

        .amz-deptActions{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-top: 8px;
          gap: 10px;
        }
        .amz-linkBtn{
          border:none;
          background:transparent;
          padding:0;
          cursor:pointer;
          font-size: 13px;
          color:#007185;
        }
        .amz-linkBtn:hover{
          color:#c7511f;
          text-decoration:underline;
        }

        .amz-status{
          font-size: 13px;
          color:#565959;
          padding: 8px 0;
        }
        .amz-error{
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          background:#fff;
          color:#0f1111;
          font-size: 13px;
        }
      `}</style>

      <div className="amz-shopHeader">
        <h1 className="amz-h1">Shop by Department</h1>
        <div className="amz-meta">
          {loading ? "Loading…" : `${paths.length.toLocaleString()} category paths`}
        </div>
      </div>

      <div className="amz-searchRow">
        <input
          className="amz-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search departments or categories…"
        />
      </div>

      {error && <div className="amz-error">{error}</div>}

      {!error && loading && <div className="amz-status">Loading categories…</div>}

      {!error && !loading && departments.length === 0 && (
        <div className="amz-status">No categories found.</div>
      )}

      {!error && !loading && departments.length > 0 && (
        <div className="amz-grid">
          {departments.map((d) => {
            const isExpanded = !!expanded[d.key];
            const subs = isExpanded ? d.subs : d.subs.slice(0, SUBS_PREVIEW);
            const hasMore = d.subs.length > SUBS_PREVIEW;

            return (
              <div key={d.key} className="amz-dept">
                <div className="amz-deptTitle">
                  <Link to={`/c/${d.key}`}>{d.label}</Link>
                </div>

                <ul className="amz-subList">
                  {subs.length ? (
                    subs.map((s) => (
                      <li key={s.path}>
                        <Link to={`/c/${s.path}`}>{s.label}</Link>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span style={{ color: "#565959", fontSize: 13 }}>No subcategories.</span>
                    </li>
                  )}
                </ul>

                <div className="amz-deptActions">
                  {hasMore ? (
                    <button className="amz-linkBtn" onClick={() => toggleDept(d.key)}>
                      {isExpanded ? "See less" : "See more"}
                    </button>
                  ) : (
                    <span />
                  )}

                  <Link to={`/c/${d.key}`} className="amz-linkBtn">
                    Shop department →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
