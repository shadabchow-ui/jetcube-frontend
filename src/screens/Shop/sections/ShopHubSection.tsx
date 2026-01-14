import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type CategoryUrlRow = {
  dept: string;
  dept_key?: string;
  category?: string;
  category_key?: string;
  url: string;
  depth: number;
  count?: number;
};

const CATEGORY_INDEX_URL_CANDIDATES = [
  "/_category_urls.json",
  "/indexes/_category_urls.json",
];

function titleizeDept(raw: string) {
  // Handles both "Electronics" and "pet-supplies"
  const s = (raw || "").trim();
  if (!s) return "Department";
  if (/[A-Z]/.test(s) && /[a-z]/.test(s)) return s; // already looks like title case
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function DeptIcon() {
  // Simple Walmart-ish right-side icon placeholder (keeps the “card with icon” vibe)
  return (
    <div className="ml-4 shrink-0 opacity-70">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 18c-1.1 0-2-.9-2-2V8h14v8c0 1.1-.9 2-2 2H7Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 8V6.5C8 5.1 9.1 4 10.5 4h3C14.9 4 16 5.1 16 6.5V8"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M9 12h6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export const ShopHubSection = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const [rows, setRows] = useState<CategoryUrlRow[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // per-dept “show more”
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadErr(null);

        let data: CategoryUrlRow[] | null = null;
        let lastErr: any = null;

        for (const url of CATEGORY_INDEX_URL_CANDIDATES) {
          try {
            const r = await fetch(url, { cache: "force-cache" });
            if (!r.ok) throw new Error(`${url} -> ${r.status}`);
            data = (await r.json()) as CategoryUrlRow[];
            break;
          } catch (e) {
            lastErr = e;
          }
        }

        if (!data) throw lastErr || new Error("Failed to load categories index");

        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || "Failed to load departments");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const list = rows || [];
    const byDept = new Map<string, CategoryUrlRow[]>();

    for (const r of list) {
      const dept = (r.dept || "").trim() || "Department";
      if (!byDept.has(dept)) byDept.set(dept, []);
      byDept.get(dept)!.push(r);
    }

    // For each dept:
    // - prefer depth 2 rows if available (clean “top level under dept”)
    // - dedupe by url
    // - sort by count desc then alpha
    const out: { dept: string; items: CategoryUrlRow[] }[] = [];
    for (const [dept, items] of byDept.entries()) {
      const depth2 = items.filter((x) => x.depth === 2);
      const pool = depth2.length ? depth2 : items.filter((x) => x.depth >= 2);

      const seen = new Set<string>();
      const deduped: CategoryUrlRow[] = [];
      for (const x of pool) {
        if (!x?.url) continue;
        if (seen.has(x.url)) continue;
        seen.add(x.url);
        deduped.push(x);
      }

      deduped.sort((a, b) => {
        const ca = a.count ?? 0;
        const cb = b.count ?? 0;
        if (cb !== ca) return cb - ca;
        const an = (a.category || "").toLowerCase();
        const bn = (b.category || "").toLowerCase();
        return an.localeCompare(bn);
      });

      out.push({ dept, items: deduped });
    }

    // sort depts alpha (you can change to “most products” if you want)
    out.sort((a, b) => titleizeDept(a.dept).localeCompare(titleizeDept(b.dept)));

    return out;
  }, [rows]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-14">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight">Shop</h1>
        <p className="text-[13px] md:text-[14px] text-gray-600 mt-2">
          Browse categories or search for products.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={submit} className="mt-8 flex justify-center">
        <div className="w-full max-w-[720px] flex gap-2">
          <input
            className="flex-1 border border-[#d5dbdb] rounded px-4 py-3 text-[14px] outline-none focus:border-black"
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="bg-black text-white rounded px-6 text-[14px]">
            Search
          </button>
        </div>
      </form>

      {/* Errors / Loading */}
      {loadErr && (
        <div className="mt-8 border border-red-200 bg-red-50 text-red-800 rounded p-4 text-sm">
          {loadErr}
        </div>
      )}
      {!loadErr && !rows && (
        <div className="mt-8 text-sm text-gray-600">Loading departments…</div>
      )}

      {/* Walmart-style dept grid */}
      {!!rows && (
        <>
          <div className="mt-10 md:mt-12">
            <h2 className="text-[18px] md:text-[20px] font-semibold">Browse Departments</h2>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {grouped.map(({ dept, items }) => {
              const isExpanded = !!expanded[dept];
              const visible = isExpanded ? items.slice(0, 22) : items.slice(0, 10);
              const hasMore = items.length > visible.length;

              return (
                <div
                  key={dept}
                  className="border border-[#e5e7eb] rounded bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-[15px] md:text-[16px]">
                        {titleizeDept(dept)}
                      </div>
                      <div className="text-[12px] text-gray-500 mt-1">
                        {items.length.toLocaleString()} categories
                      </div>
                    </div>
                    <DeptIcon />
                  </div>

                  <ul className="mt-4 space-y-2">
                    {visible.map((it) => (
                      <li key={it.url}>
                        <a
                          href={it.url}
                          className="text-[13px] text-[#007185] hover:underline"
                        >
                          {it.category ? it.category : it.url}
                        </a>
                      </li>
                    ))}
                  </ul>

                  {hasMore && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [dept]: !prev[dept] }))
                      }
                      className="mt-4 text-[13px] text-black underline underline-offset-2"
                    >
                      {isExpanded ? "View fewer" : "View more"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

