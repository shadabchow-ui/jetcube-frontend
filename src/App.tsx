import React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  useParams,
} from "react-router-dom";

import { R2_BASE, joinUrl, fetchJsonStrict } from "./config/r2";

/* ============================
   Providers
   ============================ */
import { CartProvider } from "./context/CartContext";

/* ============================
   Layouts
   ============================ */
import MainLayout from "./layouts/MainLayout";
import HelpLayout from "./layouts/HelpLayout";

/* ============================
   Concrete pages (these exist)
   ============================ */
import ShopAllCategories from "./screens/Shop/ShopAllCategories";
import Shop from "./screens/Shop/Shop";
import Help from "./pages/help/HelpIndex";

import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

import SearchResultsPageModule from "./pages/SearchResultsPage";

/* ============================
   PDP Context
   ============================ */
import * as PdpContext from "./pdp/ProductPdpContext";
const ProductPdpProvider =
  ((PdpContext as any).ProductPdpProvider as any) ||
  ((props: any) => props.children);

/* ============================
   IMPORTANT:
   Use namespace imports to avoid Rollup export errors.
   Do NOT assume default/named exports exist.
   ============================ */
import * as HomeModule from "./screens/Home";
import * as ShopIndexModule from "./screens/Shop";
import * as SingleProductIndexModule from "./screens/SingleProduct";
import * as CartIndexModule from "./screens/Cart";
import * as CheckoutIndexModule from "./screens/Checkout";
import * as CartSidebarIndexModule from "./screens/CartSidebar";
import * as ProductComparisonIndexModule from "./screens/ProductComparison";
import * as CategoryPageModule from "./screens/category/CategoryPage";

/* ============================
   Safe component picker
   - Never causes build-time "not exported" errors.
   - Tries default, common names, then any function export.
   ============================ */
function pickComponent(mod: any, preferredNames: string[] = []) {
  if (!mod) return null;

  if (mod.default) return mod.default;

  for (const name of preferredNames) {
    if (mod[name]) return mod[name];
  }

  // last resort: first function export
  for (const v of Object.values(mod)) {
    if (typeof v === "function") return v as any;
  }

  return null;
}

/* ============================
   PDP Loader Helpers
   ============================ */

/** Cache the global manifest/index */
let INDEX_CACHE: any | null = null;
let INDEX_PROMISE: Promise<any> | null = null;

const SHARD_CACHE: Record<string, Record<string, string>> = {};

async function loadIndexOnce(): Promise<any> {
  if (INDEX_CACHE) return INDEX_CACHE;
  if (INDEX_PROMISE) return INDEX_PROMISE;

  const candidates = [
    "indexes/pdp2/_index.json.gz",
    "indexes/pdp2/_index.json",
    "indexes/_index.json.gz",
    "indexes/_index.json",
  ].map((rel) => joinUrl(R2_BASE, rel));

  INDEX_PROMISE = (async () => {
    for (const u of candidates) {
      const data = await fetchJsonStrict<any>(u, "Index fetch", {
        allow404: true,
      });
      if (data !== null) {
        INDEX_CACHE = data;
        return data;
      }
    }
    throw new Error(`Global PDP index not found. Tried: ${candidates.join(", ")}`);
  })().catch((err) => {
    INDEX_PROMISE = null;
    throw err;
  });

  return INDEX_PROMISE;
}

function resolveShardKeyFromManifest(
  slug: string,
  shardMap: Record<string, string>
): string | null {
  const keys = Object.keys(shardMap || {});
  if (!keys.length) return null;

  // Exact match
  if (shardMap[slug]) return slug;

  // Fallback: prefix match
  const hit = keys.find((k) => slug.toLowerCase().startsWith(k.toLowerCase()));
  return hit || null;
}

async function loadShardByUrl(
  shardUrl: string
): Promise<Record<string, string> | null> {
  if (SHARD_CACHE[shardUrl]) return SHARD_CACHE[shardUrl];

  try {
    const data = await fetchJsonStrict<Record<string, string>>(
      shardUrl,
      "Shard fetch"
    );
    SHARD_CACHE[shardUrl] = data || {};
    return data || {};
  } catch (err) {
    console.warn(`[ProductRoute] shard failed: ${shardUrl}`, err);
    return null;
  }
}

async function fetchProductJsonWithFallback(productUrl: string): Promise<any> {
  const variants: string[] = [];
  const seen = new Set<string>();

  const push = (u: string) => {
    if (!u) return;
    if (seen.has(u)) return;
    seen.add(u);
    variants.push(u);
  };

  push(productUrl);

  // If caller asked for .json, try .json.gz too
  if (productUrl.endsWith(".json")) push(`${productUrl}.gz`);
  if (productUrl.endsWith(".json.gz"))
    push(productUrl.replace(/\.json\.gz$/i, ".json"));

  // If no json extension, try both
  if (!/\.json(\.gz)?$/i.test(productUrl)) {
    push(`${productUrl}.json`);
    push(`${productUrl}.json.gz`);
  }

  let lastErr: any = null;

  for (const u of variants) {
    try {
      const data = await fetchJsonStrict<any>(u, "Product fetch", {
        allow404: true,
      });
      if (data !== null) return data;
    } catch (e) {
      lastErr = e;
    }
  }

  const tried = variants.join(", ");
  if (lastErr) {
    throw new Error(
      `${lastErr?.message || "Product fetch failed"}. Tried: ${tried}`
    );
  }
  throw new Error(`Product not found. Tried: ${tried}`);
}

/* ============================
   PDP ROUTE — Full shard-based loader
   ============================ */
function ProductRoute({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();

  // Prefer router param, but fall back to window.location.pathname for deep links
  const pathHandle =
    typeof window !== "undefined" && window.location.pathname.startsWith("/p/")
      ? window.location.pathname.replace(/^\/p\//, "").split("/")[0]
      : null;

  const handle = id || pathHandle;

  const [product, setProduct] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        setProduct(null);

        if (!handle) throw new Error("Missing product handle");

        let productPath: string | null = null;

        // ── Strategy 1: Use manifest/index to resolve shard ──
        try {
          const index = await loadIndexOnce();

          if (Array.isArray(index)) {
            const entry = index.find((x: any) => x?.slug === handle);
            if (entry?.path) productPath = entry.path;
          } else if (
            index &&
            typeof index === "object" &&
            index.shards &&
            !Array.isArray(index.shards)
          ) {
            const manifest = index as {
              base: string;
              shards: Record<string, string>;
            };

            const shardKey = resolveShardKeyFromManifest(handle, manifest.shards);

            if (shardKey && manifest.shards[shardKey]) {
              const base = String(manifest.base || "indexes/pdp2/")
                .replace(/^\/+/, "")
                .replace(/\/+$/, "")
                .concat("/");
              const filename = String(manifest.shards[shardKey] || "").replace(
                /^\/+/,
                ""
              );
              const shardUrl = joinUrl(R2_BASE, `${base}${filename}`);

              const shard = await loadShardByUrl(shardUrl);
              if (shard && shard[handle]) productPath = shard[handle];
            }
          }
        } catch (e) {
          console.warn("[ProductRoute] index resolution failed:", e);
        }

        // ── Strategy 2: fallback to direct products/<slug>.json (legacy) ──
        if (!productPath) {
          productPath = `products/${handle}.json`;
        }

        const productUrl =
          /^https?:\/\//i.test(productPath) || productPath.startsWith("/")
            ? productPath
            : joinUrl(R2_BASE, productPath);

        console.log("[ProductRoute] Fetching product JSON:", productUrl);
        const p = await fetchProductJsonWithFallback(productUrl);

        if (!cancelled) setProduct(p);
      } catch (e: any) {
        if (!cancelled) {
          console.error("PDP Load Error:", e);
          setError(e?.message || "Failed to load product");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="border border-red-200 bg-red-50 text-red-800 rounded p-4">
          <div className="font-semibold">Product failed to load</div>
          <div className="text-sm mt-1">{error}</div>
          <a href="/shop" className="inline-block mt-3 text-blue-600 hover:underline">
            Return to Shop
          </a>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 flex justify-center">
        <div className="text-gray-500">Loading product…</div>
      </div>
    );
  }

  return <ProductPdpProvider product={product}>{children}</ProductPdpProvider>;
}

/* ============================
   Router component bindings
   ============================ */

const Home = pickComponent(HomeModule, ["Home", "HomePage"]);
const ShopAll = pickComponent(ShopIndexModule, ["ShopAll", "ShopAllPage"]);
const SingleProduct = pickComponent(SingleProductIndexModule, ["SingleProduct"]);
const Cart = pickComponent(CartIndexModule, ["Cart", "CartPage"]);
const Checkout = pickComponent(CheckoutIndexModule, ["Checkout", "CheckoutPage"]);
const CartSidebar = pickComponent(CartSidebarIndexModule, ["CartSidebar"]);
const ProductComparison = pickComponent(ProductComparisonIndexModule, [
  "ProductComparison",
]);
const CategoryPage = pickComponent(CategoryPageModule, ["CategoryPage"]);

const SearchResultsPage =
  (SearchResultsPageModule as any).default || (SearchResultsPageModule as any);

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "", element: Home ? <Home /> : <Navigate to="/shop" replace /> },
      { path: "shop", element: <Shop /> },

      // Keep these routes (don’t drop anything)
      { path: "shopall", element: ShopAll ? <ShopAll /> : <Shop /> },
      { path: "shopallcategories", element: <ShopAllCategories /> },
      { path: "search", element: <SearchResultsPage /> },
      { path: "category/:category", element: CategoryPage ? <CategoryPage /> : <Shop /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderDetailsPage /> },

      // PDP route wrapper
      {
        path: "p/:id",
        element: (
          <ProductRoute>
            {SingleProduct ? <SingleProduct /> : <div />}
          </ProductRoute>
        ),
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // Help
  {
    path: "/help",
    element: <HelpLayout />,
    children: [
      { path: "", element: <Help /> },
      { path: "*", element: <Help /> },
    ],
  },

  // Top-level routes preserved
  { path: "/cart", element: Cart ? <Cart /> : <Navigate to="/" replace /> },
  { path: "/checkout", element: Checkout ? <Checkout /> : <Navigate to="/" replace /> },
  { path: "/cart-sidebar", element: CartSidebar ? <CartSidebar /> : <Navigate to="/" replace /> },
  { path: "/compare", element: ProductComparison ? <ProductComparison /> : <Navigate to="/" replace /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/login", element: <LoginPage /> },
]);

/* ============================
   App root
   ============================ */

// Named export (your original requirement)
export function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}

// Default export (fixes your current src/index.tsx build error)
export default App;


