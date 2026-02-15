import React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  useParams,
} from "react-router-dom";

import { R2_BASE, joinUrl, fetchJsonStrict } from "./config/r2";

/* ============================
   Global Providers (Fixes useCart/useAssistant crashes)
   ============================ */
import * as CartContext from "./context/CartContext";
import * as AssistantContext from "./context/AssistantContext";

/* ============================
   Layout Imports
   ============================ */
import MainLayout from "./layouts/MainLayout";
import HelpLayout from "./layouts/HelpLayout";
import ShopAllCategories from "./screens/Shop/ShopAllCategories";
import Shop from "./screens/Shop/Shop";
import Help from "./pages/help/HelpIndex";

/* ============================
   PDP Imports
   ============================ */
import * as PdpContext from "./pdp/ProductPdpContext";

/* ============================
   Screen / Page Imports
   (namespace imports prevent Vite “export not found” build failures)
   ============================ */
import * as HomeModule from "./screens/Home";
import * as ShopModule from "./screens/Shop";
import * as SingleProductModule from "./screens/SingleProduct";
import * as CartModule from "./screens/Cart";
import * as CheckoutModule from "./screens/Checkout";
import * as CartSidebarModule from "./screens/CartSidebar";
import * as ProductComparisonModule from "./screens/ProductComparison";
import SearchResultsPageModule from "./pages/SearchResultsPage";
import * as CategoryPageModule from "./screens/category/CategoryPage";

import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

/* ============================
   Provider Resolution Helpers
   (works even if provider is named export or default export)
   ============================ */
const CartProvider =
  (CartContext as any).CartProvider ||
  (CartContext as any).default ||
  (({ children }: any) => <>{children}</>);

const AssistantProvider =
  (AssistantContext as any).AssistantProvider ||
  (AssistantContext as any).default ||
  (({ children }: any) => <>{children}</>);

const ProductPdpProvider = (PdpContext as any).ProductPdpProvider as any;

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

  // Try multiple likely locations so deployments don’t “lose” index.json(.gz)
  const candidates = [
    "indexes/pdp2/_index.json.gz",
    "indexes/pdp2/_index.json",
    "indexes/pdp/_index.json.gz",
    "indexes/pdp/_index.json",
    "indexes/_index.json.gz",
    "indexes/_index.json",
    "_index.json.gz",
    "_index.json",
  ].map((rel) => joinUrl(R2_BASE, rel));

  INDEX_PROMISE = (async () => {
    for (const u of candidates) {
      const data = await fetchJsonStrict<any>(u, "Index fetch", { allow404: true });
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
    throw new Error(`${lastErr?.message || "Product fetch failed"}. Tried: ${tried}`);
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

          // Case A: index is an array of {slug, path}
          if (Array.isArray(index)) {
            const entry = index.find((x: any) => x?.slug === handle);
            if (entry?.path) productPath = entry.path;
          }
          // Case B: index is a manifest with shards map
          else if (
            index &&
            typeof index === "object" &&
            index.shards &&
            !Array.isArray(index.shards)
          ) {
            const manifest = index as {
              base?: string;
              shards: Record<string, string>;
            };

            const shardKey = resolveShardKeyFromManifest(handle, manifest.shards);

            if (shardKey && manifest.shards[shardKey]) {
              const base = String(manifest.base || "indexes/pdp2/")
                .replace(/^\/+/, "")
                .replace(/\/+$/, "")
                .concat("/");
              const filename = String(manifest.shards[shardKey]).replace(/^\/+/, "");
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
   Router Component Resolution
   ============================ */

const Home =
  (HomeModule as any).default ||
  (HomeModule as any).Home ||
  (HomeModule as any).HomePage ||
  (HomeModule as any).Index;

const ShopAll =
  (ShopModule as any).default ||
  (ShopModule as any).ShopAll ||
  (ShopModule as any).ShopAllPage ||
  (ShopModule as any).Index;

const SingleProduct =
  (SingleProductModule as any).default ||
  (SingleProductModule as any).SingleProduct ||
  (SingleProductModule as any).Product ||
  (SingleProductModule as any).Index;

const Cart =
  (CartModule as any).default ||
  (CartModule as any).Cart ||
  (CartModule as any).CartPage ||
  (CartModule as any).Index;

const Checkout =
  (CheckoutModule as any).default ||
  (CheckoutModule as any).Checkout ||
  (CheckoutModule as any).CheckoutPage ||
  (CheckoutModule as any).Index;

const CartSidebar =
  (CartSidebarModule as any).default ||
  (CartSidebarModule as any).CartSidebar ||
  (CartSidebarModule as any).Index;

const ProductComparison =
  (ProductComparisonModule as any).default ||
  (ProductComparisonModule as any).ProductComparison ||
  (ProductComparisonModule as any).Index;

const SearchResultsPage =
  (SearchResultsPageModule as any).default || SearchResultsPageModule;

const CategoryPage =
  (CategoryPageModule as any).default ||
  (CategoryPageModule as any).CategoryPage ||
  (CategoryPageModule as any).Index;

/* ============================
   Router
   ============================ */
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "", element: Home ? <Home /> : <Navigate to="/shop" replace /> },
      { path: "shop", element: <Shop /> },
      { path: "shopall", element: ShopAll ? <ShopAll /> : <Shop /> },
      { path: "shopallcategories", element: <ShopAllCategories /> },
      { path: "search", element: SearchResultsPage ? <SearchResultsPage /> : <Shop /> },
      { path: "category/:category", element: CategoryPage ? <CategoryPage /> : <Shop /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderDetailsPage /> },

      // PDP route wrapper
      {
        path: "p/:id",
        element: SingleProduct ? (
          <ProductRoute>
            <SingleProduct />
          </ProductRoute>
        ) : (
          <Navigate to="/shop" replace />
        ),
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // Help section
  {
    path: "/help",
    element: <HelpLayout />,
    children: [
      { path: "", element: <Help /> },
      { path: "*", element: <Help /> },
    ],
  },

  // Top-level pages
  { path: "/cart", element: Cart ? <Cart /> : <Navigate to="/shop" replace /> },
  { path: "/checkout", element: Checkout ? <Checkout /> : <Navigate to="/cart" replace /> },
  { path: "/cart-sidebar", element: CartSidebar ? <CartSidebar /> : <Navigate to="/cart" replace /> },
  { path: "/compare", element: ProductComparison ? <ProductComparison /> : <Navigate to="/shop" replace /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/login", element: <LoginPage /> },
]);

/* ============================
   App Root
   ============================ */
function App() {
  return (
    <AssistantProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AssistantProvider>
  );
}

export default App;
export { App };
