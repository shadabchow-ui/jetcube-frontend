import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

type IndexItem = {
  asin?: string;
  slug: string;
  title: string;
  brand?: string;
  category?: string;
  image?: string | null;
  searchable: string; // pre-normalized
};

/* ============================
   R2 Base (PUBLIC)
   ============================ */
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function useQueryParam(name: string) {
  const { search } = useLocation();
  return new URLSearchParams(search).get(name) || "";
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(q: string) {
  return normalize(q).split(" ").filter(Boolean);
}

export default function SearchResultsPage() {
  const qRaw = useQueryParam("q");
  const tokens = useMemo(() => tokenize(qRaw), [qRaw]);

  const [items, setItems] = useState<IndexItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /* ----------------------------------------
     LOAD SEARCH INDEX (FROM /indexes ONLY)
  ---------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setErr(null);

        const url = joinUrl(R2_PUBLIC_BASE, "indexes/search_index.enriched.json");
        const res = await fetch(url, {
          cache: "force-cache",
        });

        const text = await res.text();

        // 🚫 Guard against HTML fallback
        if (text.trim().startsWith("<")) {
          throw new Error("Search index returned HTML instead of JSON");
        }

        if (!res.ok) {
          throw new Error(`Failed to load index (${res.status})`);
        }

        const data = JSON.parse(text) as IndexItem[];

        if (!cancelled) setItems(data);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load search index");
          setItems([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ----------------------------------------
     SEARCH + RANKING (MATCHES HEADER LOGIC)
  ---------------------------------------- */
  const results = useMemo(() => {
    if (!items) return [];
    if (tokens.length === 0) return [];

    return items
      .map((it) => {
        const titleN = normalize(it.title);
        const brandN = normalize(it.brand || "");
        const categoryN = normalize(it.category || "");

        let score = 0;
        for (const t of tokens) {
          if (titleN.includes(t)) score += 3;
          if (brandN.includes(t) || categoryN.includes(t)) score += 2;
          if (it.searchable.includes(t)) score += 1;
        }

        return score > 0 ? { it, score } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 60)
      .map((x: any) => x.it);
  }, [items, tokens]);

  /* ----------------------------------------
     RENDER
  ---------------------------------------- */
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Search</h2>

      <div style={{ marginBottom: 16 }}>
        Query: <b>{qRaw}</b>
      </div>

      {err && <div style={{ color: "red" }}>{err}</div>}
      {!items && !err && <div>Loading…</div>}

      {items && tokens.length > 0 && results.length === 0 && (
        <div>No results found.</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {results.map((p) => (
          <Link
            key={p.slug}
            to={`/p/${p.slug}`} // keep your real PDP route
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {p.image ? (
              <img
                src={p.image}
                alt={p.title}
                style={{ width: "100%", height: 200, objectFit: "contain" }}
              />
            ) : (
              <div style={{ height: 200, border: "1px dashed #ccc" }} />
            )}

            <div style={{ marginTop: 8, fontWeight: 600 }}>
              {p.title}
            </div>

            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {p.brand ? p.brand : ""}
              {p.brand && p.category ? " • " : ""}
              {p.category ? p.category : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


