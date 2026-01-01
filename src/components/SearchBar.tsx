import React from "react";
import { useNavigate } from "react-router-dom";

type IndexItem = {
  slug: string;
  title: string;
  brand?: string;
  category?: string;
  image?: string | null;
  searchable: string;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SearchBar() {
  const navigate = useNavigate();

  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<IndexItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);

  /* ----------------------------------------
     LOAD SEARCH INDEX (SINGLE SOURCE)
  ---------------------------------------- */
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/indexes/search_index.enriched.json", {
          cache: "no-cache",
        });

        if (!res.ok) return;

        const text = await res.text();

        // 🚫 HARD STOP on HTML fallback
        if (text.trim().startsWith("<")) return;

        const data = JSON.parse(text) as IndexItem[];
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ----------------------------------------
     AUTOSUGGEST LOGIC (MATCHES SEARCH PAGE)
  ---------------------------------------- */
  const results = React.useMemo(() => {
    if (!q.trim()) return [];
    const nq = normalize(q);

    return items
      .map((p) => {
        let score = 0;
        if (normalize(p.title).includes(nq)) score += 3;
        if (normalize(p.brand || "").includes(nq)) score += 2;
        if (p.searchable.includes(nq)) score += 1;
        return score > 0 ? { p, score } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 8)
      .map((x: any) => x.p);
  }, [q, items]);

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOpen(false);
    setActive(-1);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) {
        navigate(`/p/${results[active].slug}`);
      } else {
        submit(q);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products"
          className="w-full px-3 py-2 border rounded"
        />
      </form>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #ddd",
            borderTop: "none",
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
          }}
        >
          {results.map((r, i) => (
            <div
              key={r.slug}
              onMouseDown={() => navigate(`/p/${r.slug}`)}
              onMouseEnter={() => setActive(i)}
              style={{
                display: "flex",
                gap: 10,
                padding: 10,
                cursor: "pointer",
                background: active === i ? "#f3f3f3" : "#fff",
              }}
            >
              {r.image ? (
                <img
                  src={r.image}
                  alt={r.title}
                  style={{ width: 40, height: 40, objectFit: "contain" }}
                />
              ) : (
                <div style={{ width: 40, height: 40, background: "#eee" }} />
              )}
              <div style={{ fontSize: 14 }}>
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {r.brand}
                  {r.brand && r.category ? " • " : ""}
                  {r.category}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


