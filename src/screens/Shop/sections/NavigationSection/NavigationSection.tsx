import {
  HeartIcon,
  ShoppingCartIcon,
  UserIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  // "A > B > C" -> "C"
  const parts = (categoryKey || "")
    .split(" > ")
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : categoryKey || "Category";
}

function buildCategoryHref(item: CategoryUrlItem): string {
  const base = item.url || "";
  const key = item.category_key || "";
  if (!base) return "/shop";
  if (!key) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}k=${encodeURIComponent(key)}`;
}

export const NavigationSection = (): JSX.Element => {
  const navigate = useNavigate();

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

  // Load search index (keep your existing behavior)
  useEffect(() => {
    let cancelled = false;

    const normalize = (data: any) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.products)) return data.products;
      return Object.values(data);
    };

    const load = async () => {
      try {
        const res = await fetch("/indexes/search_index.enriched.json", {
          cache: "no-cache",
        });
        if (!res.ok) return;

        const text = await res.text();
        if (text.trim().startsWith("<")) return; // HARD STOP on HTML

        const data = JSON.parse(text);
        if (!cancelled) setSearchIndex(normalize(data));
      } catch {
        if (!cancelled) setSearchIndex([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);


  // ✅ REAL categories (drawer menu) — Vite-safe
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const url = new URL(
          "/indexes/_category_urls.json",
          import.meta.env.BASE_URL
        ).toString();

        const res = await fetch(url, { cache: "no-cache" });

        if (!res.ok) {
          if (!cancelled) setCategoryUrls([]);
          return;
        }

        const text = await res.text();

        // Guard against HTML fallback
        if (text.trim().startsWith("<")) {
          if (!cancelled) setCategoryUrls([]);
          return;
        }

        const data = JSON.parse(text);
        if (!cancelled) setCategoryUrls(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCategoryUrls([]);
      }
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
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-[6px] py-[14px] gap-4">
          {/* LEFT: HAMBURGER + LOGO */}
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
              <span className="text-[14px] font-bold leading-none">All</span>
            </Button>
            <Link to="/" className="flex items-center">
              <img src={logo} alt="JETCUBE" className="h-[38px] w-auto" />
            </Link>

          </div>

          {/* AMAZON-STYLE SEARCH BAR */}
          <form onSubmit={onSubmitSearch} className="flex-1 flex items-center justify-center">
            <div
              className="relative flex w-full max-w-[800px] h-[40px]"
              style={{ borderRadius: 4 }}
            >
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
                style={{
                  border: "none",
                }}
                aria-label="Search query"
              />

              {/* Search button */}
              <button
                type="submit"
                aria-label="Search"
                className="h-full px-4 flex items-center justify-center"
                style={{
                  background: "#0571e3",
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
                    stroke="#111"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* Suggestions dropdown */}
              {showSuggestions && query.trim() && suggestions.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white text-[#0F1111] border border-[#d5dbdb] shadow-xl"
                  style={{
                    zIndex: 50,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
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
                        style={{
                          background: isActive ? "#f3f3f3" : "#fff",
                        }}
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

          {/* RIGHT: Account flyout + Wishlist + Cart */}
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
                    Account &amp; Lists
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
                        className="bg-[#ffd814] hover:bg-[#f7ca00] text-black text-[13px] font-semibold px-4 py-2 rounded"
                      >
                        Sign in
                      </Link>

                      <div className="text-[12px] text-[#565959]">
                        New customer?{" "}
                        <Link
                          className="text-[#007185] hover:underline"
                          to="/signup"
                          onClick={() => setAccountOpen(false)}
                        >
                          Start here.
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
                          Your account
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="text-[13px] font-semibold px-3 py-2 rounded border border-[#d5dbdb] hover:bg-[#f3f3f3]"
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
                        { label: "Your account", to: "/account" },
                        { label: "Orders", to: "/orders" },
                        { label: "Returns & refunds", to: "/help/returns" },
                        { label: "Addresses", to: "/account" },
                        { label: "Payment methods", to: "/account" },
                        { label: "Profile & security", to: "/account" },
                        { label: "Help center", to: "/help" },
                        { label: "Contact support", to: "/help/contact" },
                        { label: "Privacy notice", to: "/help/privacy-notice" },
                        { label: "Conditions of use", to: "/help/conditions-of-use" },
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
              {totalCount > 0 && (
                <div
                  className="absolute left-[18px] top-[2px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[12px] font-bold"
                  style={{ background: "#0571e3", color: "#111" }}
                >
                  {totalCount}
                </div>
              )}


              <ShoppingCartIcon className="h-[26px] w-[26px]" color="#fff" />
              <div className="text-[13px] font-bold leading-none pb-[2px]">Cart</div>
            </Link>
          </div>
        </div>
      </header>

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
                <div className="px-4 py-2 text-[13px] font-bold">Trending</div>
                <div className="border-t border-[#d5dbdb]" />

                {[
                  { label: "Best Sellers", href: "/shop" },
                  { label: "New Releases", href: "/shop" },
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
                    const items = deptGroups[deptKey] || [];
                    const label = titleCaseDept(deptKey);

                    return (
                      <div key={deptKey}>
                        <button
                          type="button"
                          onClick={() => setOpenDept((cur) => (cur === deptKey ? null : deptKey))}
                          className="w-full flex items-center justify-between px-4 py-3 text-[14px] hover:bg-[#eaeded]"
                          style={{ color: "#0F1111" }}
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
                                  onClick={() => {
                                    setMenuOpen(false);
                                    setOpenDept(null);
                                  }}
                                  className="block pl-8 pr-4 py-2 text-[13px] hover:bg-[#eaeded]"
                                  style={{ color: "#0F1111" }}
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
                  { label: "Your account", href: "/account" },
                  { label: "Orders", href: "/orders" },
                  { label: "Returns & refunds", href: "/help/returns" },
                  { label: "Shipping", href: "/help/shipping" },
                  { label: "Payments", href: "/help/payments" },
                  { label: "Contact support", href: "/help/contact" },
                  { label: "Privacy notice", href: "/help/privacy-notice" },
                  { label: "Conditions of use", href: "/help/conditions-of-use" },
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




