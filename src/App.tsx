import React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  useParams,
} from "react-router-dom";

import { R2_BASE, joinUrl, fetchJsonStrict } from "./config/r2";

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
   App-wide Providers (fixes useCart/useAssistant errors)
   ============================ */
// NOTE: If your Assistant provider lives at a different path,
// update this import to match your repo.
import { CartProvider } from "./context/CartContext";
import { AssistantProvider } from "./context/AssistantContext";

/* ============================
   Screen / Page Imports
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
   PDP Loader Helpers
   ============================ */

const ProductPdpProvider = (PdpContext as any).ProductPdpProvider as any;

/** Cache the global manifest/index */
let INDEX_CACHE: any | null = null;
let INDEX_PROMISE: Promise<any> | null = null;

const SHARD_CACHE: Record<string, Record<string, string>> = {};

/**
 * Your bucket DOES have:
 *  - /indexes/pdp_path_map.json.gz   ✅ (seen in your R2 screenshot)
 *  - /indexes/pdp2/*.json.gz shards ✅
 * But it DOES NOT have:
 *  - /indexes/pdp2/_index.json(.gz) ❌ (404 in your console)
 *
 * So we try the real mapping files FIRST.
 *
 * IMPORTANT: If your .json.gz objects are stored as "application/gzip"
 * WITHOUT `Content-Encoding: gzip`, browsers will NOT auto-decompress.
 * In that case, prefer uploading a non-gz `.json` variant too.
 */
async function loadIndexOnce(): Promise<any> {
  if (INDEX_CACHE) return INDEX_CACHE;
  if (INDEX_PROMISE) return INDEX_PROMISE;

  const candidates = [
    // ✅ Best: direct slug->path map (your screenshot shows this exists as .json.gz)
    "indexes/pdp_path_map.json",
    "indexes/pdp_path_map.json.gz",

    // ✅ Sometimes stored under a folder
    "indexes/pdp_paths/_index.json",
    "indexes/pdp_paths/_index.json.gz",

    // Legacy/alternate shapes you previously tried
    "indexes/pdp2/_index.json",
    "indexes/pdp2/_index.json.gz",

    // General indexes in your bucket
    "indexes/_index.json",
    "indexes/_index.json.gz",
    "indexes/_index.cards.json",
    "indexes/_index.cards.json.gz",
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
  shardMap: Record<string, string>,
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
  shardUrl: string,
): Promise<Record<string, string> | null> {
  if (SHARD_CACHE[shardUrl]) return SHARD_CACHE[shardUrl];

  try {
    const data = await fetchJsonStrict<Record<string, string>>(shardUrl, "Shard fetch", {
      allow404: true,
    });
    SHARD_CACHE[shardUrl] = data || {};
    return data || {};
  } catch (err) {
    console.warn(`[ProductRoute] shard failed: ${shardUrl}`, err);
    return null;
  }
}

/**
 * Try multiple URL variants for product json.
 * NOTE: We prefer `.json` first to avoid `.json.gz` content-encoding issues.
 */
async function fetchProductJsonWithFallback(productUrl: string): Promise<any> {
  const variants: string[] = [];
  const seen = new Set<string>();

  const push = (u: string) => {
    if (!u) return;
    if (seen.has(u)) return;
    seen.add(u);
    variants.push(u);
  };

  // Prefer non-gz first
  if (productUrl.endsWith(".json.gz")) {
    push(productUrl.replace(/\.json\.gz$/i, ".json"));
    push(productUrl);
  } else if (productUrl.endsWith(".json")) {
    push(productUrl);
    push(`${productUrl}.gz`);
  } else {
    push(`${productUrl}.json`);
    push(`${productUrl}.json.gz`);
    push(productUrl);
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

/**
 * Resolve a product path from whatever index shape you have.
 */
async function resolveProductPathFromAnyIndex(handle: string): Promise<string | null> {
  const index = await loadIndexOnce();

  // Shape A: array entries: [{ slug, path }, ...]
  if (Array.isArray(index)) {
    const entry = index.find((x: any) => x?.slug === handle || x?.handle === handle);
    return entry?.path || entry?.url || null;
  }

  // Shape B: direct map: { "<slug>": "products/batch5/<slug>.json", ... }
  if (index && typeof index === "object") {
    if (typeof (index as any)[handle] === "string") return (index as any)[handle];

    // Common nested keys
    const direct =
      (index as any).pdp_path_map?.[handle] ||
      (index as any).paths?.[handle] ||
      (index as any).map?.[handle] ||
      (index as any).items?.[handle];
    if (typeof direct === "string") return direct;

    // Shape C: manifest with shards
    if ((index as any).shards && typeof (index as any).shards === "object") {
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
        if (shard && shard[handle]) return shard[handle];
      }
    }
  }

  return null;
}

/* ============================
   PDP ROUTE — Full loader
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

        // ── Strategy 1: Resolve path from index (pdp_path_map.json, etc.) ──
        let productPath: string | null = null;
        try {
          productPath = await resolveProductPathFromAnyIndex(handle);
        } catch (e) {
          console.warn("[ProductRoute] index resolution failed:", e);
        }

        // ── Strategy 2: fallback to legacy direct products/<slug>.json ──
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
   Safe module export resolver (fixes build errors)
   ============================ */
function pickComponent(mod: any, fallbackKeys: string[]) {
  if (!mod) return null;
  if (mod.default) return mod.default;
  for (const k of fallbackKeys) {
    if (mod[k]) return mod[k];
  }
  // last resort: first exported function/component
  const first = Object.values(mod).find((v: any) => typeof v === "function");
  return first || null;
}

/* ============================
   Router
   ============================ */

const Home = pickComponent(HomeModule as any, ["Home", "HomeScreen", "HomePage"]);
const ShopAll = pickComponent(ShopModule as any, ["ShopAll", "ShopAllPage", "Shop"]);
const SingleProduct = pickComponent(SingleProductModule as any, [
  "SingleProduct",
  "Product",
  "ProductPage",
]);
const Cart = pickComponent(CartModule as any, ["Cart", "CartPage"]);
const Checkout = pickComponent(CheckoutModule as any, ["Checkout", "CheckoutPage"]);
const CartSidebar = pickComponent(CartSidebarModule as any, ["CartSidebar"]);
const ProductComparison = pickComponent(ProductComparisonModule as any, [
  "ProductComparison",
  "Compare",
]);
const SearchResultsPage =
  (SearchResultsPageModule as any).default || (SearchResultsPageModule as any);
const CategoryPage = pickComponent(CategoryPageModule as any, ["CategoryPage"]);

if (!Home || !SingleProduct || !Cart || !Checkout || !CategoryPage) {
  // Don’t throw; just log. This helps you spot wrong export names without killing prod.
  console.warn("[App] One or more route components could not be resolved:", {
    Home: !!Home,
    ShopAll: !!ShopAll,
    SingleProduct: !!SingleProduct,
    Cart: !!Cart,
    Checkout: !!Checkout,
    CartSidebar: !!CartSidebar,
    ProductComparison: !!ProductComparison,
    CategoryPage: !!CategoryPage,
  });
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "", element: Home ? <Home /> : <Navigate to="/shop" replace /> },
      { path: "shop", element: <Shop /> },
      { path: "shopall", element: ShopAll ? <ShopAll /> : <Shop /> },
      { path: "shopallcategories", element: <ShopAllCategories /> },
      { path: "search", element: <SearchResultsPage /> },
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

  // Help section (kept separate)
  {
    path: "/help",
    element: <HelpLayout />,
    children: [
      { path: "", element: <Help /> },
      { path: "*", element: <Help /> },
    ],
  },

  // Auth + misc routes
  { path: "/signup", element: <SignupPage /> },
  { path: "/login", element: <LoginPage /> },

  // These routes often use Cart/Assistant hooks; keep them under providers (App root)
  { path: "/cart", element: Cart ? <Cart /> : <Navigate to="/shop" replace /> },
  { path: "/checkout", element: Checkout ? <Checkout /> : <Navigate to="/cart" replace /> },
  { path: "/cart-sidebar", element: CartSidebar ? <CartSidebar /> : <Navigate to="/cart" replace /> },
  { path: "/compare", element: ProductComparison ? <ProductComparison /> : <Navigate to="/shop" replace /> },
]);

/* ============================
   App Root
   ============================ */

// Keep BOTH exports:
// - default export: fixes src/index.tsx importing `import App from "./App"`
// - named export: useful elsewhere/tests
export function App() {
  return (
    <AssistantProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AssistantProvider>
  );
}

export default App;

