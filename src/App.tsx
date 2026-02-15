import React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  useParams,
} from "react-router-dom";

import { R2_BASE, joinUrl } from "./config/r2";

/* ============================
   Layout Imports
   ============================ */
import MainLayout from "./layouts/MainLayout";
import HelpLayout from "./layouts/HelpLayout";
import ShopAllCategories from "./screens/Shop/ShopAllCategories";
import Shop from "./screens/Shop/Shop";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import ReturnsPage from "./pages/ReturnsPage";
import AccountPage from "./pages/AccountPage";
import HelpIndex from "./pages/help/HelpIndex";
import ReturnsHelp from "./pages/help/Returns";
import ShippingHelp from "./pages/help/Shipping";
import PaymentsHelp from "./pages/help/Payments";
import NewsletterHelp from "./pages/help/Newsletter";
import CustomerServiceHelp from "./pages/help/Contact";
import AdsPrivacy from "./pages/help/AdsPrivacy";
import Accessibility from "./pages/help/Accessibility";
import ConditionsOfUse from "./pages/help/ConditionsOfUse";
import PrivacyNotice from "./pages/help/PrivacyNotice";
import CookiePolicy from "./pages/help/cookiepolicy";
import SearchResultsPageModule from "./pages/SearchResultsPage";
import WishlistPage from "./pages/WishlistPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

/* ============================
   PDP Imports
   ============================ */
import * as PdpContext from "./pdp/ProductPdpContext";

/* ============================
   Providers (fix runtime hook crashes)
   ============================ */
import { CartProvider } from "./context/CartContext";
import { AssistantProvider } from "./components/RufusAssistant/AssistantContext";

/* ============================
   Lazy module resolver (Vite-safe, fixes build-time export errors)
   ============================ */
/**
 * Vite/Rollup require analyzable import() calls.
 * So we use static import() functions (not variable module paths),
 * then resolve either a named export or default export at runtime.
 */
function lazyCompat<TProps = any>(
  importer: () => Promise<any>,
  exportNames: string[] = [],
) {
  return React.lazy(async () => {
    const mod: any = await importer();
    const picked =
      exportNames.map((k) => mod?.[k]).find((v) => v != null) ??
      mod?.default ??
      mod;

    if (!picked) {
      throw new Error(
        `[App] Could not resolve lazy component. Tried exports: ${
          exportNames.join(", ") || "(default)"
        }`,
      );
    }

    return { default: picked as React.ComponentType<TProps> };
  });
}

// Home screen is exported as default; keep the route component name stable.
const Home = lazyCompat(() => import("./screens/Home"), ["Home", "default"]);
// Older code referenced a "ShopAll" screen; in this repo the landing is Home.
const ShopAll = lazyCompat(() => import("./screens/Home"), ["ShopAll", "Home", "default"]);
const SingleProduct = lazyCompat(() => import("./screens/SingleProduct"), ["SingleProduct"]);
const Cart = lazyCompat(() => import("./screens/Cart"), ["Cart"]);
const Checkout = lazyCompat(() => import("./screens/Checkout"), ["Checkout"]);
const CartSidebar = lazyCompat(() => import("./screens/CartSidebar"), ["CartSidebar"]);
const ProductComparison = lazyCompat(() => import("./screens/ProductComparison"), ["ProductComparison"]);
const CategoryPage = lazyCompat(() => import("./screens/category/CategoryPage"), ["CategoryPage"]);

const SearchResultsPage: any =
  (SearchResultsPageModule as any).default || SearchResultsPageModule;

/* ============================
   Fetch helpers (handles .json.gz even when Content-Encoding is missing)
   ============================ */

type FetchJsonOptions = {
  allow404?: boolean;
};

async function fetchJsonAuto<T = any>(
  url: string,
  label: string,
  opts: FetchJsonOptions = {},
): Promise<T | null> {
  const res = await fetch(url, {
    headers: { Accept: "application/json, */*" },
  });

  if (opts.allow404 && res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`[${label}] HTTP ${res.status} for ${url}`);
  }

  const contentEncoding = (res.headers.get("content-encoding") || "").toLowerCase();
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const looksGz =
    url.toLowerCase().endsWith(".gz") ||
    contentType.includes("application/gzip") ||
    contentType.includes("application/x-gzip");

  // If Content-Encoding: gzip is set, the browser transparently decompresses.
  if (!looksGz || contentEncoding.includes("gzip")) {
    const txt = await res.text();
    return txt ? (JSON.parse(txt) as T) : (null as any);
  }

  // If it's a .gz but Content-Encoding is missing, we must decompress in the client.
  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS) {
    throw new Error(
      `[${label}] ${url} appears gzipped but is missing Content-Encoding: gzip, and DecompressionStream is not available in this browser. ` +
        `Fix by setting Content-Encoding: gzip on the object or uploading an uncompressed .json.`,
    );
  }

  const ab = await res.arrayBuffer();
  const ds = new DS("gzip");
  const decompressedStream = new Blob([ab]).stream().pipeThrough(ds);
  const txt = await new Response(decompressedStream).text();
  return txt ? (JSON.parse(txt) as T) : (null as any);
}

/* ============================
   PDP Loader Helpers
   ============================ */

const ProductPdpProvider = (PdpContext as any).ProductPdpProvider as any;

/** Cache the global manifest/index */
let INDEX_CACHE: any | null = null;
let INDEX_PROMISE: Promise<any> | null = null;

const SHARD_CACHE: Record<string, Record<string, string>> = {};

async function loadIndexOnce(): Promise<any> {
  if (INDEX_CACHE) return INDEX_CACHE;
  if (INDEX_PROMISE) return INDEX_PROMISE;

  // IMPORTANT:
  // Your bucket shows indexes/pdp_path_map.json(.gz) exists and is the correct “slug -> real path” map.
  // Prefer normal JSON first for reliability, then try .gz variants.
  const candidates = [
    "indexes/pdp_path_map.json",
    "indexes/pdp_path_map.json.gz",

    // optional/legacy
    "indexes/pdp2/_index.json",
    "indexes/pdp2/_index.json.gz",
    "indexes/_index.json",
    "indexes/_index.json.gz",
  ].map((rel) => joinUrl(R2_BASE, rel));

  INDEX_PROMISE = (async () => {
    for (const u of candidates) {
      const data = await fetchJsonAuto<any>(u, "Index fetch", { allow404: true });
      if (data !== null) {
        INDEX_CACHE = data;
        return data;
      }
    }
    INDEX_CACHE = null;
    return null;
  })();

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

async function fetchShard(shardUrl: string): Promise<Record<string, string> | null> {
  if (SHARD_CACHE[shardUrl]) return SHARD_CACHE[shardUrl];

  try {
    const data = await fetchJsonAuto<Record<string, string>>(shardUrl, "Shard fetch");
    SHARD_CACHE[shardUrl] = data || {};
    return data || {};
  } catch (err) {
    console.warn(`[ProductRoute] shard failed: ${shardUrl}`, err);
    return null;
  }
}

function normalizeProductPath(productPath: string): string {
  // Ensure "products/..." and remove leading slashes
  const cleaned = String(productPath || "").replace(/^\/+/, "");
  return joinUrl(R2_BASE, cleaned);
}

async function fetchProductJsonWithFallback(productUrl: string): Promise<any> {
  const variants: string[] = [];
  const seen = new Set<string>();

  const push = (u: string) => {
    const key = u.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    variants.push(key);
  };

  push(productUrl);

  // If caller asked for .json, try .json.gz too
  if (productUrl.endsWith(".json")) push(`${productUrl}.gz`);
  if (productUrl.endsWith(".json.gz")) push(productUrl.replace(/\.json\.gz$/i, ".json"));

  // If caller asked for non-extension path, try both
  if (!/\.json(\.gz)?$/i.test(productUrl)) {
    push(`${productUrl}.json`);
    push(`${productUrl}.json.gz`);
  }

  let lastErr: any = null;

  for (const u of variants) {
    try {
      const data = await fetchJsonAuto<any>(u, "Product fetch", { allow404: true });
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
   PDP Route Wrapper
   ============================ */

function ProductRoute({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const handle = id;

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

        // ── Strategy 1: Use pdp_path_map.json(.gz) or manifest/index to resolve ──
        try {
          const idx = await loadIndexOnce();

          if (idx) {
            // Case A: direct mapping object: { "<slug>": "products/batch.../<slug>.json", ... }
            if (typeof idx === "object" && idx[handle]) {
              productPath = String(idx[handle]);
            }

            // Case B: shard manifest:
            // { "shards": { "0-": "indexes/pdp2/0-.json.gz", ... } } or similar
            if (!productPath && typeof idx === "object") {
              const shardMap =
                idx?.shards ||
                idx?.pdp2_shards ||
                idx?.pdp_shards ||
                idx?.map ||
                idx?.paths;

              if (shardMap && typeof shardMap === "object") {
                const shardKey = resolveShardKeyFromManifest(handle, shardMap);
                if (shardKey) {
                  const shardRel = String(shardMap[shardKey]);
                  const shardUrl = joinUrl(R2_BASE, shardRel.replace(/^\/+/, ""));
                  const shardObj = await fetchShard(shardUrl);

                  if (shardObj && shardObj[handle]) {
                    productPath = String(shardObj[handle]);
                  }
                }
              }
            }
          }
        } catch (e) {
          // ignore, fall back
        }

        // ── Strategy 2: last-resort fallback ──
        if (!productPath) {
          productPath = `products/${handle}.json`;
        }

        const finalUrl = normalizeProductPath(productPath);
        const data = await fetchProductJsonWithFallback(finalUrl);

        if (!cancelled) setProduct(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load product");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (!product) {
    return <div className="max-w-[1200px] mx-auto px-4 py-20" />;
  }

  return <ProductPdpProvider product={product}>{children}</ProductPdpProvider>;
}

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
      { path: "returns", element: <ReturnsPage /> },
      { path: "account", element: <AccountPage /> },
      { path: "wishlist", element: <WishlistPage /> },
      // Legacy aliases → canonical Help routes
      { path: "terms", element: <Navigate to="/help/conditions" replace /> },
      { path: "privacy", element: <Navigate to="/help/privacy" replace /> },
      { path: "disclaimer", element: <Navigate to="/help/conditions" replace /> },
      { path: "accessibility", element: <Navigate to="/help/accessibility" replace /> },

      // PDP (wrap route content so product is loaded before rendering PDP children)
      {
        path: "p/:id",
        element: (
          <ProductRoute>
            <SingleProduct />
          </ProductRoute>
        ),
      },

      // Legacy alias
      { path: "list", element: <Navigate to="/wishlist" replace /> },
      { path: "checkout", element: <Checkout /> },
      { path: "cart", element: <Cart /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  {
    path: "/help",
    element: <HelpLayout />,
    children: [
      { path: "", element: <HelpIndex /> },
      { path: "returns", element: <ReturnsHelp /> },
      { path: "orders", element: <HelpIndex /> },
      { path: "shipping", element: <ShippingHelp /> },
      { path: "payments", element: <PaymentsHelp /> },
      { path: "newsletter", element: <NewsletterHelp /> },
      { path: "customerservice", element: <CustomerServiceHelp /> },
      { path: "conditions", element: <ConditionsOfUse /> },
      { path: "privacy", element: <PrivacyNotice /> },
      { path: "adsprivacy", element: <AdsPrivacy /> },
      { path: "accessibility", element: <Accessibility /> },
      { path: "cookiepolicy", element: <CookiePolicy /> },
    ],
  },

  // Legacy alias → consolidated categories entrypoint
  { path: "/product-category", element: <Navigate to="/shopallcategories" replace /> },
  { path: "/cart-sidebar", element: <CartSidebar /> },
  { path: "/compare", element: <ProductComparison /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/login", element: <LoginPage /> },
]);

function AppImpl() {
  // Providers here fix the “useX must be used within XProvider” crashes.
  return (
    <React.Suspense fallback={<div />}>
      <AssistantProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AssistantProvider>
    </React.Suspense>
  );
}

/**
 * Export BOTH:
 * - named App (supports: import { App } from "./App")
 * - default App (supports: import App from "./App")
 */
export function App() {
  return <AppImpl />;
}

export default App;

