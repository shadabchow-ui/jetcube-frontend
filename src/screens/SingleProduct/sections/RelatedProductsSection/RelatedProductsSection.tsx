import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";

/* ============================================================================
   Types
============================================================================ */

type IndexProduct = {
  asin?: string;
  handle?: string;
  slug?: string;
  id?: string;

  title?: string;
  price?: number | string | null;

  category_slug?: string;
  category_path?: string[];

  images?: string[];
  image?: string;
  image_url?: string;
  imageUrl?: string;

  // Optional prebuilt link/path
  path?: string;

  reviews?: { count?: number | null } | null;
};

type RelatedShard = Record<string, IndexProduct[]>;

/* ============================================================================
   Helpers
============================================================================ */

function getProductKey(p: IndexProduct): string | null {
  return p.slug || p.handle || p.asin || p.id || null;
}

function safeFirstImage(p: IndexProduct, fallback: string) {
  const imgs = Array.isArray(p.images) ? p.images : [];
  const candidate = imgs[0] || p.image || p.image_url || p.imageUrl || "";
  if (
    typeof candidate === "string" &&
    candidate.length > 0 &&
    !candidate.startsWith("blob:") &&
    !candidate.startsWith("data:")
  ) {
    return candidate;
  }
  return fallback;
}

function slugPrefix(slug: string, n = 2): string {
  const s = (slug || "").toLowerCase();
  if (!s) return "__";
  return s.length >= n ? s.slice(0, n) : (s + "__").slice(0, n);
}

async function fetchJsonIfJson(url: string) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error("Non-JSON response (HTML fallback)");
  }
  return res.json();
}

/* ============================================================================
   Grid
============================================================================ */

function ProductGrid({
  title,
  items,
  loading,
}: {
  title: string;
  items: IndexProduct[];
  loading: boolean;
}) {
  const fallbackImg = "/img/group-102-1.png";

  if (!loading && !items.length) return null;

  return (
    <section className="w-full bg-white px-[24px] py-[18px]">
      <h2 className="text-[20px] font-semibold text-[#0f1111] mb-3">{title}</h2>

      <div className="grid grid-cols-4 gap-[16px]">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-[180px] h-[260px] border rounded animate-pulse bg-[#f3f3f3]"
              />
            ))
          : items.map((p, idx) => {
              const key = getProductKey(p);
              if (!key) return null;

              const img = safeFirstImage(p, fallbackImg);
              const price =
                p.price === null || p.price === undefined || p.price === ""
                  ? ""
                  : typeof p.price === "number"
                  ? `$${p.price}`
                  : String(p.price);

              const label = p.title || p.handle || p.asin || "Product";

              return (
                <Link
                  key={`${key}-${idx}`}
                  to={`/p/${key}`}
                  className="w-[180px] rounded-lg border border-[#e7e7e7] hover:shadow-sm"
                >
                  <div className="w-full h-[180px] bg-[#f8f8f8] rounded-t-lg overflow-hidden">
                    <img
                      src={img}
                      alt={label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-3">
                    <div className="text-[13px] leading-snug text-[#0f1111] line-clamp-2">
                      {label}
                    </div>

                    <div className="mt-2 text-[16px] font-semibold text-[#0f1111]">
                      {price || "\u00A0"}
                    </div>

                    <div className="mt-1 text-[12px] text-[#565959]">
                      {(p.reviews?.count ?? 0)} reviews
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}

/* ============================================================================
   SAFE STATIC INDEX LOADER (fallback only)
============================================================================ */

function useIndexProducts() {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const json = await fetchJsonIfJson("/products/search_index.enriched.json");
        if (!cancelled && Array.isArray(json)) {
          setItems(json);
          setLoaded(true);
        }
      } catch (err) {
        console.error("RelatedProducts index load failed:", err);
        if (!cancelled) {
          setItems([]);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loaded };
}

/* ============================================================================
   RELATED SHARD LOADER (primary)
   Fetches: /indexes/related_products_shards/<prefix>.json.gz
============================================================================ */

function useRelatedShard(slug: string | null) {
  const [items, setItems] = useState<IndexProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!slug) {
        setItems([]);
        setLoaded(true);
        return;
      }

      const pref = slugPrefix(slug, 2);

      // Try multiple locations to be resilient across deploy/R2 layouts
      const candidates = [
        `/indexes/related_products_shards/${pref}.json.gz`,
        `/indexes/related_products_shards/${pref}.json`,
        `/products/related_products_shards/${pref}.json.gz`,
        `/products/related_products_shards/${pref}.json`,
        `/related_products_shards/${pref}.json.gz`,
        `/related_products_shards/${pref}.json`,
      ];

      try {
        let shard: RelatedShard | null = null;

        for (const url of candidates) {
          try {
            const json = await fetchJsonIfJson(url);
            if (json && typeof json === "object") {
              shard = json as RelatedShard;
              break;
            }
          } catch {
            // try next candidate
          }
        }

        const related = shard?.[slug] || [];

        if (!cancelled) {
          setItems(Array.isArray(related) ? related.slice(0, 8) : []);
          setLoaded(true);
        }
      } catch (err) {
        console.error("RelatedProducts shard load failed:", err);
        if (!cancelled) {
          setItems([]);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { items, loaded };
}

/* ============================================================================
   Related Products
   Primary: related_products_shards (1 request)
   Fallback: search_index.enriched.json filter by category_slug
============================================================================ */

export const RelatedProductsSection = (): JSX.Element => {
  const product = useProductPdp();

  const currentKey =
    (product as any)?.slug || (product as any)?.handle || (product as any)?.asin || "";

  const currentCat = (product as any)?.category_slug || "";

  // Primary (fast)
  const { items: shardItems, loaded: shardLoaded } = useRelatedShard(
    currentKey ? String(currentKey) : null
  );

  // Fallback (legacy)
  const { items: indexItems, loaded: indexLoaded } = useIndexProducts();

  const related = useMemo(() => {
    // If shard succeeded and returned data, prefer it
    if (shardLoaded && shardItems.length) {
      return shardItems
        .filter((p) => getProductKey(p) && getProductKey(p) !== currentKey)
        .slice(0, 8);
    }

    // If shard loaded but empty (or shard missing), fall back to category-based filter
    if (!indexLoaded || !product) return [];

    return indexItems
      .filter(
        (p) =>
          getProductKey(p) &&
          getProductKey(p) !== currentKey &&
          p.category_slug &&
          p.category_slug === currentCat
      )
      .slice(0, 8);
  }, [shardLoaded, shardItems, indexLoaded, indexItems, product, currentKey, currentCat]);

  const loading = !shardLoaded && !indexLoaded;

  return <ProductGrid title="Related products" items={related} loading={loading} />;
};

/* ============================================================================
   Customers Also Viewed (unchanged)
============================================================================ */

export const CustomersAlsoViewedSection = (): JSX.Element => {
  const product = useProductPdp();
  const { items: indexItems, loaded } = useIndexProducts();

  const alsoViewed = useMemo(() => {
    if (!loaded || !product) return [];

    const currentKey =
      (product as any)?.slug || (product as any)?.handle || (product as any)?.asin || "";

    return indexItems
      .filter((p) => {
        const key = getProductKey(p);
        return key && key !== currentKey;
      })
      .slice(0, 8);
  }, [loaded, indexItems, product]);

  return <ProductGrid title="Customers also viewed" items={alsoViewed} loading={!loaded} />;
};

export default RelatedProductsSection;
export const CustomersAlsoViewedSection = (): JSX.Element => {
  const product = useProductPdp();
  const { items: indexItems, loaded } = useIndexProducts();

  const alsoViewed = useMemo(() => {
    if (!loaded || !product) return [];

    const currentKey =
      (product as any)?.slug ||
      (product as any)?.handle ||
      (product as any)?.asin ||
      "";

    return indexItems
      .filter((p) => {
        const key = getProductKey(p);
        return key && key !== currentKey;
      })
      .slice(0, 8);
  }, [loaded, indexItems, product]);

  return <ProductGrid title="Customers also viewed" items={alsoViewed} loading={!loaded} />;
};

// ✅ ADD THIS LINE (this is what fixes the build)
export default RelatedProductsSection;
