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
  deptPath: string; // e.g. "beauty-and-personal-care"
  subs: Array<{ label: string; path: string }>; // e.g. { label: "Skin Care", path: "beauty-and-personal-care/skin-care" }
};

function safeStr(v: any): string {
  return typeof v === "string" ? v : "";
}

function stripPrefixSlash(s: string) {
  return s.replace(/^\/+/, "");
}

function normalizeCategoryIndexToPaths(indexData: CategoryIndexShape): string[] {
  const out: string[] = [];

  // Record<string, any> (keys are urls/paths)
  if (indexData && typeof indexData === "object" && !Array.isArray(indexData)) {
    for (const k of Object.keys(indexData)) {
      const cleaned = stripPrefixSlash(k);
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  // string[]
  if (Array.isArray(indexData) && indexData.every((x) => typeof x === "string")) {
    for (const s of indexData as string[]) {
      const cleaned = stripPrefixSlash(s);
      if (cleaned) out.push(cleaned);
    }
    return out;
  }

  // Array<object>
  if (Array.isArray(indexData)) {
    for (const item of indexData as Array<{ url?: string; path?: string; slug?: string }>) {
      const raw = safeStr(item?.path) || safeStr(item?.url) || safeStr(item?.slug);
      const cleaned = stripPrefixSlash(raw);
      if (cleaned) out.push(cleaned);
    }
  }

  return out;
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function prettyLabelFromSlug(slug: string) {
  // "hair-care" -> "Hair Care"
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ShopAllCategories() {
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const sub = parts[1]; // only first sub level for the card

      if (!deptToSubs.has(dept)) deptToSubs.set(dept, new Set<string>());
      if (sub) deptToSubs.get(dept)!.add(sub);
    }

    const cards: DeptCard[] = [];
    for (const [dept, subsSet] of deptToSubs.entries()) {
      const subs = Array.from(subsSet)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, SUBS_PER_DEPT)
        .map((sub) => ({
          label: prettyLabelFromSlug(sub),
          path: `${dept}/${sub}`,
        }));

      cards.push({
        dept: prettyLabelFromSlug(dept),
        deptPath: dept,
        subs,
      });
    }

    // sort by label
    cards.sort((a, b) => a.dept.localeCompare(b.dept));
    return cards;
  }, [allPaths]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(deptCards.length / PAGE_SIZE));
  }, [deptCards.length]);

  const pageItems = useMemo(
    () => paginate(deptCards, page, PAGE_SIZE),
    [deptCards, page]
  );

  useEffect(() => {
    // If data shrinks or page out of range, clamp
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>All Departments</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              background: page <= 1 ? "#f5f5f5" : "#ffffff",
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            Prev
          </button>

          <div style={{ fontSize: 13, color: "#444" }}>
            Page <b>{page}</b> / <b>{totalPages}</b>
            <span style={{ marginLeft: 10, color: "#666" }}>
              ({deptCards.length} departments)
            </span>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              background: page >= totalPages ? "#f5f5f5" : "#ffffff",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>

      {loading && <div style={{ marginTop: 14, color: "#666" }}>Loading categories…</div>}

      {error && (
        <div style={{ marginTop: 14, color: "#b00020" }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 18,
          }}
        >
          {pageItems.map((card) => (
            <div
              key={card.deptPath}
              style={{
                border: "1px solid #eaeaea",
                borderRadius: 10,
                padding: 16,
                background: "#fff",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                <Link to={`/c/${encodeURI(card.deptPath)}`} style={{ color: "#111", textDecoration: "none" }}>
                  {card.dept}
                </Link>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {card.subs.map((s) => (
                  <Link
                    key={s.path}
                    to={`/c/${encodeURI(s.path)}`}
                    style={{ color: "#2563eb", textDecoration: "none", fontSize: 13 }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>

              <div style={{ marginTop: 10, fontSize: 12 }}>
                <Link
                  to={`/c/${encodeURI(card.deptPath)}`}
                  style={{ color: "#111", textDecoration: "none", fontWeight: 600 }}
                >
                  Shop all {card.dept}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
