import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";

// NOTE: Adjust these if your origin differs in dev/prod
const CATEGORY_URLS_PRIMARY = `${window.location.origin}/indexes/_category_urls.json`;
const CATEGORY_URLS_FALLBACK = `${window.location.origin}/indexes/category_urls.json`;
const CATEGORY_PRODUCTS_BASE = `${window.location.origin}/indexes/category_products`;

type CategoryUrlsMap = Record<string, string>;

type Product = {
  slug?: string;
  title?: string;
  brand?: string;
  category?: string;
  image?: string;
  path?: string;
  searchable?: boolean;
  price?: number | null;
};

function slugifyCategoryName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/,/g, "")
    .replace(/\s*>\s*/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function fetchJsonWithFallback<T>(primaryUrl: string, fallbackUrl: string): Promise<T> {
  const r1 = await fetch(primaryUrl, { cache: "no-store" });
  if (r1.ok) return (await r1.json()) as T;

  const r2 = await fetch(fallbackUrl, { cache: "no-store" });
  if (!r2.ok) throw new Error(`Failed to load ${primaryUrl} and ${fallbackUrl}`);
  return (await r2.json()) as T;
}

export default function CategoryPage() {
  const location = useLocation();

  const urlSlug = useMemo(() => {
    // Supports:
    // - /c/<slug>   (old)
    // - /<slug>     (new root categories)
    const raw = location.pathname.replace(/^\//, "");
    if (!raw) return "";
    if (raw.startsWith("c/")) return raw.slice(2);
    return raw;
  }, [location.pathname]);

  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setNotFound(false);
        setError(null);
        setProducts(null);
        setCategoryName(null);

        if (!urlSlug) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // 1) Load category URL map (your real file is _category_urls.json)
        const map = await fetchJsonWithFallback<CategoryUrlsMap>(
          CATEGORY_URLS_PRIMARY,
          CATEGORY_URLS_FALLBACK
        );

        // Normalize lookups (handle encoding)
        const decoded = (() => {
          try {
            return decodeURIComponent(urlSlug);
          } catch {
            return urlSlug;
          }
        })();

        const foundName =
          map[urlSlug] ||
          map[decoded] ||
          map[urlSlug.replaceAll("%2F", "/")] ||
          map[decoded.replaceAll("%2F", "/")] ||
          null;

        if (!foundName) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) setCategoryName(foundName);

        // 2) Fetch category products file by slugified category name
        const fileSlug = slugifyCategoryName(foundName);
        const productsUrl = `${CATEGORY_PRODUCTS_BASE}/${fileSlug}.json`;

        const resp = await fetch(productsUrl, { cache: "no-store" });
        if (!resp.ok) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const data = (await resp.json()) as Product[];
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Unknown error");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [urlSlug]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Unexpected Application Error!</div>
        <div style={{ marginTop: 8 }}>{error}</div>
      </div>
    );
  }

  if (notFound || !categoryName) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Category not found</div>
        <div style={{ marginTop: 6 }}>This category is not available yet.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{categoryName}</div>
          <div style={{ marginTop: 6, opacity: 0.8 }}>
            {products ? `${products.length.toLocaleString()} products` : ""}
          </div>
        </div>
        <Link to="/categories" style={{ textDecoration: "none", fontWeight: 600 }}>
          All Departments
        </Link>
      </div>

      <div style={{ marginTop: 18 }}>
        {!products || products.length === 0 ? (
          <div>No products found for this category.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {products.map((p, idx) => (
              <Link
                key={`${p.slug || p.path || idx}`}
                to={p.path || (p.slug ? `/p/${p.slug}` : "#")}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title || "Product"}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ opacity: 0.6, fontSize: 12 }}>No image</div>
                  )}
                </div>

                <div style={{ marginTop: 10, fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
                  {p.title || "Untitled product"}
                </div>

                {p.brand ? (
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>{p.brand}</div>
                ) : null}

                {/* Price is optional in your index-derived category files; keep safe */}
                {typeof p.price === "number" ? (
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700 }}>
                    ${p.price.toFixed(2)}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
