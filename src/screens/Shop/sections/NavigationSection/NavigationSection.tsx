import {
  HeartIcon,
  ShoppingBagIcon,
  UserIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { Button } from "../../../../components/ui/button";
import logo from "../../../../assets/logo.png";

type SearchIndexItem = {
  id?: string;
  slug?: string;
  asin?: string;
  title?: string;
  brand?: string;
  category?: string;
  searchable?: string;
  keywords?: string;
};

type CategoryUrlItem = {
  category_key: string; // full key: "Clothing, Shoes & Jewelry > Women > Clothing > Active > Leggings"
  category?: string; // leaf label (optional)
  dept?: string; // optional human dept
  url: string; // leaf-first url: "/c/women/leggings" etc
  depth?: number;
  count?: number;
};

function titleCaseDept(s: string): string {
  // "beauty-personal-care" -> "Beauty Personal Care"
  return s
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getDeptFromUrl(url: string): string {
  // "/c/women/leggings" -> "women"
  const parts = (url || "").split("/").filter(Boolean); // ["c","women","leggings",...]
  if (parts.length >= 2 && parts[0] === "c") return parts[1];
  return "other";
}

function getLeafLabel(categoryKey: string): string {
  const raw = (categoryKey || "").toString().trim();
  if (!raw) return "";

  // Supports both legacy "A > B > C" and canonical "a/b/c" styles.
  const gtParts = raw
    .split(" > ")
    .map((s) => s.trim())
    .filter(Boolean);
  const slashParts = raw
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  const leaf =
    gtParts.length > 1
      ? gtParts[gtParts.length - 1]
      : slashParts.length > 1
      ? slashParts[slashParts.length - 1]
      : raw;

  try {
    return titleCaseDept(decodeURIComponent(leaf.replace(/\+/g, " ")));
  } catch {
    return titleCaseDept(leaf);
  }
}

function normalizeKey(s: string): string {
  const raw = (s || "").toString().trim();
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).toLowerCase().replace(/^\/+|\/+$/g, "");
  } catch {
    return raw.toLowerCase().replace(/^\/+|\/+$/g, "");
  }
}

function buildCategoryHref(item: CategoryUrlItem): string {
  const base = item.url || "";
  const key = item.category_key || "";
  if (!base) return "/shop";
  if (!key) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}k=${encodeURIComponent(key)}`;
}

// ✅ R2 public base + optional version-busting (kept minimal + safe fallbacks)
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

const SEARCH_INDEX_VERSION = import.meta.env.VITE_SEARCH_INDEX_VERSION || "";
const CATEGORY_URLS_VERSION = import.meta.env.VITE_CATEGORY_URLS_VERSION || "";

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

export const NavigationSection = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Load a lightweight autocomplete index for header suggestions on all routes
  const shouldBootstrapSearch = true;

  // LEFT DRAWER
  const [menuOpen, setMenuOpen] = useState(false);

  // RIGHT FLYOUT (Account & Lists)
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement | null>(null);

  // AUTH (simple "me" check)
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  // SEARCH
  const [dept, setDept] = useState("all");
  const [query, setQuery] = useState("");

  // Suggestions + index
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  // ✅ REAL categories (drawer menu)
  const [categoryUrls, setCategoryUrls] = useState<CategoryUrlItem[]>([]);
  const [openDept, setOpenDept] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ✅ CART (real)
  const { totalCount, openCart } = useCart();

  const deptOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: "women", label: "Women" },
      { value: "men", label: "Men" },
      { value: "kids", label: "Kids" },
      { value: "shoes", label: "Shoes" },
      { value: "accessories", label: "Accessories" },
      { value: "new", label: "New Arrivals" },
      { value: "deals", label: "Sales & Deals" },
    ],
    []
  );

  const ShippingBagIcon = ({
    className,
    color = "currentColor",
  }: {
    className?: string;
    color?: string;
  }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4.8 7.6 L6.2 20.4 H17.8 L19.2 7.6 Z" />
      <path d="M4.8 7.6 H19.2" />
      {/* handle stays at the very top (won’t cross the number) */}
      <path d="M8.2 7.6 V6.4a3.8 3.8 0 0 1 7.6 0v1.2" />
    </svg>
  );

  const isAuthed = !!meEmail;

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-cache",
      });

      if (!res.ok) {
        setMeEmail(null);
        return;
      }

      const data = await res.json();
      const email = typeof data?.email === "string" ? data.email : null;
      setMeEmail(email);
    } catch {
      setMeEmail(null);
    } finally {
      setMeLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        // fallback if your server uses GET
        await fetch("/api/auth/logout", { method: "GET", credentials: "include" });
      }
    } catch {
      // ignore
    } finally {
      setMeEmail(null);
      setAccountOpen(false);
      navigate("/login");
    }
  };

  // Fetch session on mount + refresh on focus
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await fetchMe();
    };

    run();

    const onFocus = () => {
      fetchMe();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC to close + lock body scroll while left drawer is open
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  // Close Account flyout on ESC + outside click
  useEffect(() => {
    if (!accountOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      const el = accountWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setAccountOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [accountOpen]);

  // Avoid overlap: opening drawer closes account flyout
  useEffect(() => {
    if (menuOpen) setAccountOpen(false);
  }, [menuOpen]);

  // Load search index (autocomplete-first) — NOW ENABLED FOR ALL ROUTES
  useEffect(() => {
    if (!shouldBootstrapSearch) return;

    let cancelled = false;

    const normalize = (data: any): SearchIndexItem[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data as SearchIndexItem[];

      if (Array.isArray(data.items)) return data.items as SearchIndexItem[];
      if (Array.isArray(data.products)) return data.products as SearchIndexItem[];

      if (data.byId && typeof data.byId === "object") {
        return Object.values(data.byId) as SearchIndexItem[];
      }

      if (typeof data === "object") {
        return Object.values(data) as SearchIndexItem[];
      }

      return [];
    };

    const load = async () => {
      // Prefer small autocomplete index for fast header suggestions.
      const r2AutoBase = joinUrl(R2_PUBLIC_BASE, "indexes/search_autocomplete.json");
      const r2AutoUrl = withVersion(r2AutoBase, SEARCH_INDEX_VERSION);

      // Fallback to full search index (existing behavior) if autocomplete isn't present.
      const r2FullBase = joinUrl(R2_PUBLIC_BASE, "indexes/search_index.enriched.json");
      const r2FullUrl = withVersion(r2FullBase, SEARCH_INDEX_VERSION);

      const urls = [
        r2AutoUrl,
        "/indexes/search_autocomplete.json",
        "/products/search_autocomplete.json",
        "/search_autocomplete.json",

        r2FullUrl,
        "/indexes/search_index.enriched.json",
        "/indexes/search_index.json",
        "/products/search_index.enriched.json",
        "/products/search_index.json",
        "/search_index.enriched.json",
        "/search_index.json",
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (!res.ok) continue;

          const text = await res.text();

          // Vite/CF can return HTML (index.html) for missing assets. Guard it.
          if (!text || text.trim().startsWith("<")) continue;

          let json: any;
          try {
            json = JSON.parse(text);
          } catch {
            continue;
          }

          const items = normalize(json);
          if (!cancelled) setSearchIndex(items);
          return;
        } catch {
          // try next
        }
      }

      if (!cancelled) setSearchIndex([]);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [shouldBootstrapSearch]);

  // ✅ REAL categories (drawer menu)
  useEffect(() => {
    let cancelled = false;

    const stripSlashes = (s: string) => String(s || "").replace(/^\/+/g, "").replace(/\/+$/g, "");
    const stripPrefixSlash = (s: string) => String(s || "").replace(/^\//g, "");
    const toCatItem = (raw: string, count?: any): CategoryUrlItem | null => {
      if (typeof raw !== "string") return null;
      const cleaned = stripPrefixSlash(stripSlashes(raw));
      if (!cleaned) return null;
      // normalize: remove leading "c/" or "/c/"
      const p = cleaned.replace(/^c\//i, "");
      const url = `/c/${p}`;
      return {
        url,
        category_key: p,
        ...(typeof count === "number" ? { count } : {}),
      } as CategoryUrlItem;
    };

    const normalizeCats = (data: any): CategoryUrlItem[] => {
      if (!data) return [];

      // Object map: keys are paths, values may be counts or metadata
      if (typeof data === "object" && !Array.isArray(data)) {
        const out: CategoryUrlItem[] = [];
        for (const k of Object.keys(data)) {
          const v = (data as any)[k];
          const count =
            typeof v === "number"
              ? v
              : typeof v?.count === "number"
              ? v.count
              : undefined;
          const item = toCatItem(k, count);
          if (item) out.push(item);
        }
        return out;
      }

      // Array of strings
      if (Array.isArray(data) && data.every((x) => typeof x === "string")) {
        const out: CategoryUrlItem[] = [];
        for (const s of data as string[]) {
          const item = toCatItem(s);
          if (item) out.push(item);
        }
        return out;
      }

      // Array of objects
      if (Array.isArray(data)) {
        const out: CategoryUrlItem[] = [];
        for (const it of data as any[]) {
          const raw = it?.path || it?.url || it?.slug || it?.category_key;
          const count = typeof it?.count === "number" ? it.count : undefined;
          const item = toCatItem(raw, count);
          if (item) out.push(item);
        }
        return out;
      }

      // Wrapped list
      if (Array.isArray((data as any).items)) return normalizeCats((data as any).items);
      if (Array.isArray((data as any).paths)) return normalizeCats((data as any).paths);
      if (Array.isArray((data as any).category_paths)) return normalizeCats((data as any).category_paths);

      return [];
    };

    const load = async () => {
      setCategoriesLoading(true);

      // Prefer same-origin index base (matches ShopAllCategories), then R2, then relative fallbacks.
      const origin = typeof window !== "undefined" ? window.location.origin : "https://ventari.net";
      const originUrl = withVersion(joinUrl(origin, "indexes/_category_urls.json"), CATEGORY_URLS_VERSION);

      const r2Base = joinUrl(R2_PUBLIC_BASE, "indexes/_category_urls.json");
      const r2Url = withVersion(r2Base, CATEGORY_URLS_VERSION);

      const urls = [
        originUrl,
        r2Url,
        "/indexes/_category_urls.json",
        "/products/_category_urls.json",
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (!res.ok) continue;

          const text = await res.text();

          // Vite/CF can return HTML (index.html) for missing assets. Guard it.
          if (!text || text.trim().startsWith("<")) continue;

          let json: any;
          try {
            json = JSON.parse(text);
          } catch {
            continue;
          }

          const items = normalizeCats(json)
            .filter(
              (x) =>
                x && typeof (x as any).url === "string" && (x as any).url.startsWith("/c/")
            )
            .filter(
              (x) =>
                x &&
                typeof (x as any).category_key === "string" &&
                (x as any).category_key.length > 0
            );

          if (!cancelled) {
            setCategoryUrls(items);
            setCategoriesLoading(false);
          }
          return;
        } catch {
          // try next
        }
      }

      if (!cancelled) setCategoryUrls([]);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const scored = searchIndex
      .map((p) => {
        const title = (p.title || "").toLowerCase();
        const searchable = (p.searchable || p.keywords || "").toLowerCase();
        const haystack = `${title} ${searchable}`.trim();

        if (!haystack) return null;

        // simple scoring: title match > keyword match
        let score = 0;
        if (title.includes(q)) score += 3;
        if (searchable.includes(q)) score += 1;
        if (score === 0) return null;

        return { p, score };
      })
      .filter(Boolean) as { p: SearchIndexItem; score: number }[];

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map((x) => x.p);
  }, [query, searchIndex]);

  const getPdpId = (p: SearchIndexItem) => p.slug || p.id || p.asin || "";

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (dept && dept !== "all") params.set("dept", dept);
    if (q) params.set("q", q);

    const qs = params.toString();
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    navigate(qs ? `/search?${qs}` : "/search");
  };

  const onPickSuggestion = (p: SearchIndexItem) => {
    const id = getPdpId(p);
    if (!id) {
      const params = new URLSearchParams();
      if (dept && dept !== "all") params.set("dept", dept);
      if (query.trim()) params.set("q", query.trim());
      const qs = params.toString();
      setShowSuggestions(false);
      setActiveSuggestion(-1);
      navigate(qs ? `/search?${qs}` : "/search");
      return;
    }

    setShowSuggestions(false);
    setActiveSuggestion(-1);
    navigate(`/p/${id}`);
  };

  // ✅ Group categories by dept from URL (/c/{dept}/...)
  const deptGroups = useMemo(() => {
    const groups: Record<string, CategoryUrlItem[]> = {};

    for (const item of categoryUrls) {
      const deptKey = getDeptFromUrl(item.url);
      if (!groups[deptKey]) groups[deptKey] = [];
      groups[deptKey].push(item);
    }

    // Sort each group by sku_count (desc) then leaf label
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => {
        const sa = typeof a.count === "number" ? a.count : 0;
        const sb = typeof b.count === "number" ? b.count : 0;
        if (sb !== sa) return sb - sa;
        return getLeafLabel(a.category_key).localeCompare(getLeafLabel(b.category_key));
      });
    }

    return groups;
  }, [categoryUrls]);

  const deptKeysSorted = useMemo(() => {
    const keys = Object.keys(deptGroups);
    // push "other" last
    keys.sort((a, b) => {
      if (a === "other") return 1;
      if (b === "other") return -1;
      return a.localeCompare(b);
    });
    return keys;
  }, [deptGroups]);

  const helloTop = meLoading ? "Hello" : isAuthed ? `Hello, ${meEmail}` : "Hello, sign in";
  const helloDrawer = meLoading ? "Hello" : isAuthed ? `Hello, ${meEmail}` : "Hello, sign in";


  const HeaderLeft = (
    <div className="flex items-center gap-3 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-[40px] px-2 flex items-center gap-2 rounded-sm
             bg-transparent
             text-white
             hover:bg-transparent
             hover:text-white
             focus:text-white
             active:text-white"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="h-[26px] w-[26px]" color="#fff" strokeWidth={2.5} />
      </Button>
      <Link to="/" className="flex items-center">
        <img src={logo} alt="JETCUBE" className="h-[38px] w-auto" />
      </Link>
    </div>

  );

  const HeaderSearch = (
    <form onSubmit={onSubmitSearch} className="w-full flex items-center justify-center">
      <div className="relative flex w-full max-w-[800px] h-[40px]" style={{ borderRadius: 4 }}>
        {/* Dept dropdown */}
        <div
          className="h-full"
          style={{
            background: "#f3f3f3",
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            borderRight: "1px solid #cdcdcd",
          }}
        >
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="h-full px-3 text-[12px] text-black outline-none"
            style={{
              background: "transparent",
              border: "none",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              cursor: "pointer",
              minWidth: 64,
            }}
            aria-label="Search department"
          >
            {deptOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Input */}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setActiveSuggestion(-1);
          }}
          onFocus={() => {
            if (query.trim()) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowSuggestions(false);
              setActiveSuggestion(-1);
            }, 120);
          }}
          onKeyDown={(e) => {
            if (!showSuggestions || suggestions.length === 0) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveSuggestion((v) => Math.min(v + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveSuggestion((v) => Math.max(v - 1, 0));
            } else if (e.key === "Enter") {
              if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
                e.preventDefault();
                onPickSuggestion(suggestions[activeSuggestion]);
              }
            } else if (e.key === "Escape") {
              setShowSuggestions(false);
              setActiveSuggestion(-1);
            }
          }}
          placeholder="Search"
          className="flex-1 h-full px-3 text-[14px] text-black outline-none"
          style={{ border: "none" }}
          aria-label="Search query"
        />

        {/* Search button */}
        <button
          type="submit"
          aria-label="Search"
          className="h-full px-4 flex items-center justify-center"
          style={{
            background: "#181818",
            borderTopRightRadius: 4,
            borderBottomRightRadius: 4,
            border: "none",
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm11 3-6-6"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Suggestions dropdown */}
        {showSuggestions && query.trim() && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white text-[#0F1111] border border-[#d5dbdb] shadow-xl"
            style={{ zIndex: 50, borderRadius: 4, overflow: "hidden" }}
            role="listbox"
            aria-label="Search suggestions"
          >
            {suggestions.map((p, idx) => {
              const id = getPdpId(p);
              const title = p.title || id || "Untitled";
              const meta = [p.brand, p.category].filter(Boolean).join(" • ");
              const isActive = idx === activeSuggestion;

              return (
                <div
                  key={`${id}-${idx}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onPickSuggestion(p);
                  }}
                  onMouseEnter={() => setActiveSuggestion(idx)}
                  className="px-3 py-2 cursor-pointer"
                  style={{ background: isActive ? "#f3f3f3" : "#fff" }}
                >
                  <div className="text-[13px] font-semibold">{title}</div>
                  {meta ? (
                    <div className="text-[12px]" style={{ color: "#565959" }}>
                      {meta}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div
              onMouseDown={(e) => {
                e.preventDefault();
                const params = new URLSearchParams();
                if (dept && dept !== "all") params.set("dept", dept);
                if (query.trim()) params.set("q", query.trim());
                const qs = params.toString();
                setShowSuggestions(false);
                setActiveSuggestion(-1);
                navigate(qs ? `/search?${qs}` : "/search");
              }}
              className="px-3 py-2 cursor-pointer border-t"
              style={{ borderColor: "#e7e7e7", background: "#fff" }}
            >
              <span className="text-[13px]" style={{ color: "#007185" }}>
                See all results for “{query.trim()}”
              </span>
            </div>
          </div>
        )}
      </div>
    </form>

  );

  const HeaderRight = (
    <div className="flex items-center gap-[14px] shrink-0">
      <div className="relative" ref={accountWrapRef}>
        <button
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/10 transition"
          aria-haspopup="dialog"
          aria-expanded={accountOpen}
        >
          <div className="text-left leading-none">
            <div className="text-[12px] opacity-90">{helloTop}</div>
            <div className="text-[13px] font-bold flex items-center gap-1">
              Account
              <span className="text-[10px] opacity-80">▼</span>
            </div>
          </div>
        </button>

        <div
          className={`absolute right-0 top-[calc(100%+10px)] z-[10000] w-[520px] bg-white text-[#0F1111] shadow-2xl border border-[#d5dbdb] rounded-sm transition-opacity ${accountOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          role="dialog"
          aria-label="Account menu"
        >
          <div className="absolute -top-[9px] right-10 h-0 w-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[9px] border-b-[#d5dbdb]" />
          <div className="absolute -top-2 right-10 h-0 w-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white" />

          <div className="px-4 py-3 border-b border-[#e7e7e7] flex items-center justify-between">
            {!isAuthed ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setAccountOpen(false)}
                  className="bg-[#0571e3] hover:bg-[#0571e3] text-white text-[13px] font-semibold px-4 py-2 rounded"
                >
                  Sign in
                </Link>

                <div className="text-[12px] text-[#565959]">
                  New here?{" "}
                  <Link
                    className="text-[#007185] hover:underline"
                    to="/signup"
                    onClick={() => setAccountOpen(false)}
                  >
                    Get started.
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="text-[12px] text-[#565959]">
                  Signed in as{" "}
                  <span className="text-[#0F1111] font-semibold">{meEmail}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/account"
                    onClick={() => setAccountOpen(false)}
                    className="bg-[#ffd814] hover:bg-[#f7ca00] text-black text-[13px] font-semibold px-4 py-2 rounded"
                  >
                    My Account
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-[13px] font-semibold px-3 py-2 rounded border border-[#0571e3] hover:bg-[#0571e3]"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-0">
            <div className="p-4">
              <div className="text-[13px] font-bold mb-2">Your Lists</div>
              <div className="space-y-1">
                {[
                  { label: "Wishlist", to: "/wishlist" },
                  { label: "Saved items", to: "/wishlist" },
                  { label: "Recently viewed", to: "/shop" },
                ].map((it) => (
                  <Link
                    key={it.label}
                    className="block text-[13px] text-[#0F1111] hover:text-[#c45500] hover:underline"
                    to={it.to}
                    onClick={() => setAccountOpen(false)}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-4 border-l border-[#e7e7e7]">
              <div className="text-[13px] font-bold mb-2">Your Account</div>
              <div className="space-y-1">
                {[
                  { label: "My account", to: "/account" },
                  { label: "My orders", to: "/orders" },
                  { label: "Returns & help", to: "/help/returns" },
                  { label: "Delivery & tracking", to: "/account" },
                  { label: "Payments & billing", to: "/account" },
                  { label: "Talk to us", to: "/account" },
                  { label: "Help center", to: "/help" },
                  { label: "Contact support", to: "/help/contact" },
                  { label: "Privacy choices", to: "/help/privacy-notice" },
                  { label: "Terms of use", to: "/help/conditions-of-use" },
                ].map((it) => (
                  <Link
                    key={it.label}
                    className="block text-[13px] text-[#0F1111] hover:text-[#c45500] hover:underline"
                    to={it.to}
                    onClick={() => setAccountOpen(false)}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-[#e7e7e7] flex justify-between text-[12px]">
                {!isAuthed ? (
                  <>
                    <Link
                      className="text-[#007185] hover:underline"
                      to="/login"
                      onClick={() => setAccountOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      className="text-[#007185] hover:underline"
                      to="/signup"
                      onClick={() => setAccountOpen(false)}
                    >
                      Create account
                    </Link>
                  </>
                ) : (
                  <>
                    <span className="text-[#565959]"> </span>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-[#007185] hover:underline"
                    >
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Wishlist link (added) */}
      <Button variant="ghost" size="icon" className="p-0" asChild>
        <Link to="/wishlist" aria-label="Wishlist">
          <HeartIcon className="h-[20px] w-[20px]" color="#fff" />
        </Link>
      </Button>

      <Link
        to="/cart-sidebar"
        className="relative flex items-end gap-2 rounded px-2 py-1 hover:bg-white/10 transition"
        aria-label="Cart"
        onClick={openCart}
      >
        <div className="relative w-[26px] h-[26px]">
          <ShippingBagIcon className="h-[26px] w-[26px]" color="#fff" />
          {totalCount > 0 && (
            <span
              className="absolute inset-0 flex justify-center pointer-events-none z-10
             text-[8px] font-extrabold text-white"
              style={{ paddingTop: "10px" }} // tweak 10–12px if needed
            >
              {totalCount}
            </span>
          )}
        </div>
      </Link>
    </div>
  );

  // ✅ Amazon-like quick links bar (NOT categories)
  // - Keep the left drawer for departments
  // - Keep Shop All link
  // - Use existing routes only (avoid 404s)
  const HeaderDeptNav = (
    <div
      className="w-full border-b hidden md:block"
      style={{ backgroundColor: "#000", color: "#fff", borderColor: "#262626" }}
    >
      <div className="mx-auto max-w-[1440px] px-[6px]">
        <div
          className="flex items-center gap-4 py-[8px] overflow-x-auto"
          style={{ scrollbarWidth: "none" as any, WebkitTapHighlightColor: "transparent" as any }}
        >
          {/* Shop All */}
          <Link
            to="/shop"
            onMouseDown={(e) => e.preventDefault()}
            className="text-[13px] font-semibold whitespace-nowrap px-2 py-1 rounded hover:bg-white/10 focus:outline-none focus-visible:outline-none"
            style={{ color: "#fff", WebkitTapHighlightColor: "transparent" as any }}
          >
            Shop All
          </Link>

          {[
            { label: "Today’s deals", to: "/search?q=deals" },
            { label: "New arrivals", to: "/search?q=new%20arrivals" },
            { label: "Best sellers", to: "/search?q=best%20sellers" },
            { label: "Gift ideas", to: "/search?q=gifts" },
            { label: "Ventari essentials", to: "/search?q=essentials" },
            { label: "Customer service", to: "/help" },
            { label: "Orders", to: "/orders" },
            { label: "Wishlist", to: "/wishlist" },
          ].map((it) => (
            <Link
              key={it.label}
              to={it.to}
              onMouseDown={(e) => e.preventDefault()}
              className="text-[13px] whitespace-nowrap px-2 py-1 rounded hover:bg-white/10 focus:outline-none focus-visible:outline-none"
              style={{ color: "#fff", WebkitTapHighlightColor: "transparent" as any }}
            >
              {it.label}
            </Link>
          ))}

          {/* More → opens the existing left drawer */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMenuOpen(true)}
            className="text-[13px] whitespace-nowrap px-2 py-1 rounded hover:bg-white/10 focus:outline-none focus-visible:outline-none"
            style={{ color: "#fff", WebkitTapHighlightColor: "transparent" as any }}
            aria-label="Open departments"
          >
            Departments
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <>
      <header
        className="w-full border-b"
        style={{
          backgroundColor: "#000",
          color: "#fff",
          borderColor: "#262626",
        }}
      >
        <div className="mx-auto max-w-[1440px] px-[6px] py-2 md:py-[14px]">
          <div className="flex items-center justify-between gap-3 md:hidden">
            {HeaderLeft}
            {HeaderRight}
          </div>

          <div className="mt-2 md:hidden">{HeaderSearch}</div>

          <div className="hidden md:flex items-center justify-between gap-4">
            {HeaderLeft}
            {HeaderSearch}
            {HeaderRight}
          </div>
        </div>
      </header>

      {HeaderDeptNav}


      {/* LEFT DRAWER */}
      <div
        className={`fixed inset-0 z-[9999] ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${menuOpen ? "opacity-100" : "opacity-0"
            }`}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          tabIndex={menuOpen ? 0 : -1}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={`absolute left-0 top-0 h-full w-[365px] bg-white text-[#0F1111] shadow-xl transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="h-full flex flex-col">
            <div className="bg-gradient-to-b from-[#111] via-[#0b0b0b] to-[#000] text-white px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center">
                  <UserIcon className="h-5 w-5" color="#fff" />
                </div>
                <div className="text-[16px] font-semibold leading-none">{helloDrawer}</div>
              </div>

              <button
                className="p-2 rounded hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <XIcon className="w-5 h-5" color="#fff" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Trending (kept exactly as your design) */}
              <div className="py-3">
                <div className="px-4 py-2 text-[13px] font-bold">Hot right now</div>
                <div className="border-t border-[#d5dbdb]" />

                {[
                  { label: "Most loved", href: "/shop" },
                  { label: "New in", href: "/shop" },
                ].map((it) => (
                  <Link
                    key={it.label}
                    to={it.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-[14px] hover:bg-[#eaeded]"
                    style={{ color: "rgba(15, 17, 17, 1)" }}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>

              {/* ✅ Shop by Department — REAL categories + correct links */}
              <div className="py-3">
                <div className="px-4 py-2 text-[13px] font-bold">Shop by Department</div>
                <div className="border-t border-[#d5dbdb]" />

                {deptKeysSorted.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-[#565959]">
                    No categories loaded yet.
                  </div>
                ) : (
                  deptKeysSorted.map((deptKey) => {
                    const isOpen = openDept === deptKey;
                      const items = (deptGroups[deptKey] || []).filter((it) =>
                        normalizeKey(it.category_key || "") !== normalizeKey(deptKey)
                      );
                    const label = titleCaseDept(deptKey);

                    return (
                      <div key={deptKey}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setOpenDept((cur) => (cur === deptKey ? null : deptKey))}
                          className="w-full flex select-none items-center justify-between px-4 py-3 text-[14px] hover:bg-[#eaeded] focus:outline-none focus-visible:outline-none"
                          style={{ color: "#0F1111", WebkitTapHighlightColor: "transparent" as any }}
                        >
                          <span>{label}</span>
                          <span className="text-[12px] text-[#565959]">{isOpen ? "−" : "+"}</span>
                        </button>

                        {isOpen && (
                          <div className="pb-2">
                            {items.slice(0, 80).map((it) => {
                              const leaf = getLeafLabel(it.category_key);
                              return (
                                <Link
                                  key={it.url}
                                  to={buildCategoryHref(it)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setMenuOpen(false);
                                    setOpenDept(null);
                                  }}
                                  className="block select-none pl-8 pr-4 py-2 text-[13px] leading-[18px] hover:bg-[#eaeded] focus:outline-none focus-visible:outline-none"
                                  style={{ color: "#0F1111", WebkitTapHighlightColor: "transparent" as any }}
                                  title={it.category_key}
                                >
                                  {leaf}
                                  {typeof it.count === "number" ? (
                                    <span className="ml-2 text-[12px] text-[#565959]">
                                      ({it.count})
                                    </span>
                                  ) : null}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-[#d5dbdb]" />

              <div className="py-3">
                <div className="px-4 py-2 text-[13px] font-bold">Help &amp; Settings</div>
                <div className="border-t border-[#d5dbdb]" />

                {[
                  { label: "My account", href: "/account" },
                  { label: "My orders", href: "/orders" },
                  { label: "Returns & help", href: "/help/returns" },
                  { label: "Delivery & tracking", href: "/help/shipping" },
                  { label: "Payments & billing", href: "/help/payments" },
                  { label: "Talk to us", href: "/help/contact" },
                  { label: "Privacy choices", href: "/help/privacy-notice" },
                  { label: "Terms of use", href: "/help/conditions-of-use" },
                ].map((it) => (
                  <Link
                    key={it.label}
                    to={it.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-[14px] hover:bg-[#eaeded]"
                    style={{ color: "rgba(15, 17, 17, 1)" }}
                  >
                    {it.label}
                  </Link>
                ))}

                <div className="border-t border-[#d5dbdb]" />

                <div className="px-4 py-3 text-[14px]">
                  {!isAuthed ? (
                    <div className="flex items-center gap-3">
                      <Link
                        to="/login"
                        onClick={() => setMenuOpen(false)}
                        className="text-[#007185] hover:underline"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setMenuOpen(false)}
                        className="text-[#007185] hover:underline"
                      >
                        Create account
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleSignOut();
                      }}
                      className="text-[#007185] hover:underline"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-[#d5dbdb]" />

              <div className="px-4 py-4 text-[12px] text-[#565959]">
                {/* keep your footer note */}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default NavigationSection;
