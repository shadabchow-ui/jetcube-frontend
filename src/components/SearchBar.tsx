import React from "react";
import { useNavigate } from "react-router-dom";

type IndexItem = {
  slug: string;
  title: string;
  brand?: string;
  category?: string;
  image?: string | null;
};

/* ----------------------------------------
   Helpers
---------------------------------------- */
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ✅ R2 public base + optional version-busting
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

const SEARCH_AUTOCOMPLETE_VERSION =
  import.meta.env.VITE_SEARCH_AUTOCOMPLETE_VERSION || "";

function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function withVersion(url: string, v: string) {
  if (!v) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(v)}`;
}

/* ----------------------------------------
   Component
---------------------------------------- */
export default function SearchBar() {
  const navigate = useNavigate();

  const [q, setQ] = React.useState("");
  const [autocomplete, setAutocomplete] = React.useState<
    Record<string, IndexItem[]>
  >({});
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);

  /* ----------------------------------------
     LOAD AUTOCOMPLETE INDEX (TINY FILE)
  ---------------------------------------- */
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const base = joinUrl(
          R2_PUBLIC_BASE,
          "indexes/search_autocomplete.json"
        );
        const url = withVersion(base, SEARCH_AUTOCOMPLETE_VERSION);

        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) return;

        const text = await res.text();

        // 🚫 Guard against HTML fallback
        if (text.trim().startsWith("<")) return;

        const data = JSON.parse(text) as Record<string, IndexItem[]>;
        if (!cancelled) setAutocomplete(data);
      } catch {
        if (!cancelled) setAutocomplete({});
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ----------------------------------------
     FAST AUTOSUGGEST LOOKUP
  ---------------------------------------- */
  const results = React.useMemo(() => {
const term = normalize(q);
if (term.length < 2) return [];

const firstWord = term.split(" ")[0];
const key = firstWord.slice(0, 6);

return autocomplete[key] || [];


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

