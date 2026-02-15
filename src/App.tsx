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
   Assistant Provider (fix: useAssistant must be inside provider)
   ============================ */
import * as AssistantContextModule from "./components/RufusAssistant/AssistantContext";

/* ============================
   Screen / Page Imports (namespace imports to avoid missing exports)
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
   Safe module export picker
   - IMPORTANT: uses bracket access with variable keys so Rollup/Vite
     does NOT turn it into static named/default imports (which caused your build errors)
   ============================ */
function pickExport<T = any>(mod: any, keys: string[]): T {
  for (const k of keys) {
    try {
      const v = mod?.[k];
      if (v) return v as T;
    } catch {
      // ignore
    }
  }
  return undefined as any;
}

/* ============================
   PDP Loader Helpers
   ============================ */

const ProductPdpProvider =
  pickExport<any>(PdpContext, ["ProductPdpProvider", "default"]) ||
  (({ children }: any) => <>{children}</>);

/** Cache: pdp_path_map */
let PDP_PATH_MAP_CACHE: Record<string, string> | null = null;
let PDP_PATH_MAP_PROMISE: Promise<Record<string, string> | null> | null = null;

/** Cache per shard url */
const SHARD_CACHE: Record<string, Record<string, string>> = {};

async function loadPdpPathMapOnce(): Promise<Record<string, string> | null> {
  if (PDP_PATH_MAP_CACHE) return PDP_PATH_MAP_CACHE;
  if (PDP_PATH_MAP_PROMISE) return PDP_PATH_MAP_PROMISE;

  const candidates = [
    "indexes/pdp_path_map.json.gz",
    "indexes/pdp_path_map.json",
  ].map((rel) => joinUrl(R2_BASE, rel));

  PDP_PATH_MAP_PROMISE = (async () => {
    for (const u of candidates) {
      const data = await fetchJsonStrict<Record<string, string>>(u, "pdp_path_map fetch", {
        allow404: true,
      });
      if (data) {
        PDP_PATH_MAP_CACHE = data;
        return data;
      }
    }
    return null;
  })().catch((err) => {
    PDP_PATH_MAP_PROMISE = null;
    throw err;
  });

  return PDP_PATH_MAP_PROMISE;
}

function shardKey2(handle: string): string {
  const h = String(handle || "").toLowerCase();
  if (!h) return "--";
  if (h.length === 1) return `${h}-`;
  return h.slice(0, 2);
}

async function loadShardMap(prefix2: string): Promise<Record<string, string> | null> {
  const key = shardKey2(prefix2);

  // try both folders you have in R2: indexes/pdp2/ and indexes/pdp_paths/
  const rels = [
    `indexes/pdp2/${key}.json.gz`,
    `indexes/pdp2/${key}.json`,
    `indexes/pdp_paths/${key}.json.gz`,
    `indexes/pdp_paths/${key}.json`,
  ];

  for (const rel of rels) {
    const shardUrl = joinUrl(R2_BASE, rel);
    if (SHARD_CACHE[shardUrl]) return SHARD_CACHE[shardUrl];

    const data = await fetchJsonStrict<Record<string, string>>(shardUrl, "pdp shard fetch", {
      allow404: true,
    });

    if (data) {
      SHARD_CACHE[shardUrl] = data;
      return data;
    }
  }

  return null;
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
      const data = await fetchJsonStrict<any>(u, "product fetch", { allow404: true });
      if (data !== null) return data;
    } catch (e) {
      lastErr = e;
    }
  }

  const tried = variants.join(", ");
  if (lastErr) throw new Error(`${lastErr?.message || "Product fetch failed"}. Tried: ${tried}`);
  throw new Error(`Product not found. Tried: ${tried}`);
}

/* ============================
   PDP ROUTE — path-map + shard + legacy fallback
   ============================ */
function ProductRoute({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();

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

        // 1) Fast path: pdp_path_map (you have indexes/pdp_path_map.json.gz)
        try {
          const pathMap = await loadPdpPathMapOnce();
          if (pathMap && pathMap[handle]) {
            productPath = pathMap[handle];
          }
        } catch (e) {
          console.warn("[ProductRoute] pdp_path_map resolution failed:", e);
        }

        // 2) Shard path: indexes/pdp2/<first2>.json(.gz) mapping slug -> productPath
        if (!productPath) {
          try {
            const key = shardKey2(handle);
            const shard = await loadShardMap(key);
            if (shard && shard[handle]) {
              productPath = shard[handle];
            }
          } catch (e) {
            console.warn("[ProductRoute] shard resolution failed:", e);
          }
        }

        // 3) Legacy fallback (some builds used products/<slug>.json)
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
   Router component resolution (NO static .default/.Home access)
   ============================ */
const Home = pickExport<any>(HomeModule, ["default", "Home"]) || (() => null);
const ShopAll = pickExport<any>(ShopModule, ["default", "ShopAll"]) || (() => null);
const SingleProduct =
  pickExport<any>(SingleProductModule, ["default", "SingleProduct"]) || (() => null);
const Cart = pickExport<any>(CartModule, ["default", "Cart"]) || (() => null);
const Checkout = pickExport<any>(CheckoutModule, ["default", "Checkout"]) || (() => null);
const CartSidebar =
  pickExport<any>(CartSidebarModule, ["default", "CartSidebar"]) || (() => null);
const ProductComparison =
  pickExport<any>(ProductComparisonModule, ["default", "ProductComparison"]) || (() => null);

const SearchResultsPage =
  (typeof SearchResultsPageModule === "function"
    ? SearchResultsPageModule
    : pickExport<any>(SearchResultsPageModule as any, ["default"])) || (() => null);

const CategoryPage =
  pickExport<any>(CategoryPageModule, ["default", "CategoryPage"]) || (() => null);

/* ============================
   Router
   ============================ */
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "", element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "shopall", element: <ShopAll /> },
      { path: "shopallcategories", element: <ShopAllCategories /> },
      { path: "search", element: <SearchResultsPage /> },
      { path: "category/:category", element: <CategoryPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderDetailsPage /> },

      // PDP route wrapper
      {
        path: "p/:id",
        element: (
          <ProductRoute>
            <SingleProduct />
          </ProductRoute>
        ),
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // Help routes
  {
    path: "/help",
    element: <HelpLayout />,
    children: [
      { path: "", element: <Help /> },
      { path: "*", element: <Help /> },
    ],
  },

  { path: "/cart", element: <Cart /> },
  { path: "/checkout", element: <Checkout /> },
  { path: "/cart-sidebar", element: <CartSidebar /> },
  { path: "/compare", element: <ProductComparison /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/login", element: <LoginPage /> },
]);

/* ============================
   App export (fixes src/index.tsx default import)
   ============================ */
function AppInner() {
  return <RouterProvider router={router} />;
}

const AssistantProvider =
  pickExport<any>(AssistantContextModule, ["AssistantProvider", "default"]) || null;

export function App() {
  if (AssistantProvider) {
    return (
      <AssistantProvider>
        <AppInner />
      </AssistantProvider>
    );
  }
  return <AppInner />;
}

export default App;
