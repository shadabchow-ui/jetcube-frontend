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
   Screen / Page Imports
   ============================ */
import SearchResultsPageModule from "./pages/SearchResultsPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

/* ============================
   Providers (fix runtime hook crashes)
   ============================ */
import { CartProvider } from "./context/CartContext";
import { AssistantProvider } from "./components/RufusAssistant/AssistantContext";

/* ============================
   Lazy module resolver (fix build-time export errors)
   ============================ */
function lazyPick(modulePath: string, exportNames: string[]) {
  return React.lazy(async () => {
    const mod: any = await import(/* @vite-ignore */ modulePath);
    const picked =
      mod?.default ??
      exportNames.map((k) => mod?.[k]).find((v) => typeof v === "function") ??
      exportNames.map((k) => mod?.[k]).find((v) => v != null);

    if (!picked) {
      throw new Error(
        `[App] Could not resolve component from ${modulePath}. Tried exports: ${exportNames.join(
          ", ",
        )}`,
      );
    }

    return { default: picked };
  });
}

/* These were causing Cloudflare build failures because rollup enforces named exports.
   Using lazyPick avoids compile-time “X is not exported by …” errors. */
const Home = lazyPick("./screens/Home", ["Home", "default"]);
const ShopAll = lazyPick("./screens/Shop", ["ShopAll", "default"]);
const SingleProduct = lazyPick("./screens/SingleProduct", ["SingleProduct", "default"]);
const Cart = lazyPick("./screens/Cart", ["Cart", "default"]);
const Checkout = lazyPick("./screens/Checkout", ["Checkout", "default"]);
const CartSidebar = lazyPick("./screens/CartSidebar", ["CartSidebar", "default"]);
const ProductComparison = lazyPick("./screens/ProductComparison", ["ProductComparison", "default"]);
const CategoryPage = lazyPick("./screens/category/CategoryPage", ["CategoryPage", "default"]);

const SearchResultsPage: any =
  (SearchResultsPageModule as any).default || SearchResultsPageModule;

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
  // So we try that FIRST, then fall back to other legacy candidates.
  const candidates = [
    "indexes/pdp_path_map.json.gz",
    "indexes/pdp_path_map.json",

    // optional/legacy
    "indexes/pdp2/_index.json.gz",
    "indexes/pdp2/_index.json",
    "indexes/_index.json.gz",
    "indexes/_index.json",
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

async function loadShardByUrl(shardUrl: string): Promise<Record<string, string> | null> {
  if (SHARD_CACHE[shardUrl]) return SHARD_CACHE[shardUrl];

  try {
    const data = await fetchJsonStrict<Record<string, string>>(shardUrl, "Shard fetch");
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
  if (productUrl.endsWith(".json.gz")) push(productUrl.replace(/\.json\.gz$/i, ".json"));

  // If no json extension, try both
  if (!/\.json(\.gz)?$/i.test(productUrl)) {
    push(`${productUrl}.json`);
    push(`${productUrl}.json.gz`);
  }

  let lastErr: any = null;

  for (const u of variants) {
    try {
      const data = await fetchJsonStrict<any>(u, "Product fetch", { allow404: true });
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
   PDP ROUTE — uses pdp_path_map.json first
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

        // ── Strategy 1: Use pdp_path_map.json(.gz) or manifest/index to resolve ──
        try {
          const index = await loadIndexOnce();

          // Case A: direct mapping object: { "<slug>": "products/batch5/<slug>.json", ... }
          if (index && typeof index === "object" && !Array.isArray(index)) {
            if (typeof (index as any)[handle] === "string") {
              productPath = (index as any)[handle];
            }

            // Case B: manifest: { base: "indexes/pdp2/", shards: {...} }
            if (!productPath && (index as any).shards && !Array.isArray((index as any).shards)) {
              const manifest = index as { base: string; shards: Record<string, string> };
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
          }

          // Case C: array index: [{ slug, path }]
          if (!productPath && Array.isArray(index)) {
            const entry = index.find((x: any) => x?.slug === handle);
            if (entry?.path) productPath = entry.path;
          }
        } catch (e) {
          console.warn("[ProductRoute] index resolution failed:", e);
        }

        // ── Strategy 2: last-resort fallback (may 404 if your products are not in /products/<slug>.json) ──
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

