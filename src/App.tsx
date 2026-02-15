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
   Screen / Page Imports (non-fragile)
   ============================ */
import SearchResultsPageModule from "./pages/SearchResultsPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

/* ============================
   Providers (Cart + Assistant)
   ============================ */

// We try to statically import CartContext (most projects have this exact path).
// If yours differs, the "glob provider finder" below will still wrap with CartProvider if it finds it.
import * as CartContextMod from "./context/CartContext";

/** Small helper: safely pick a React component export from a module */
function pickComponent(mod: any, preferredNames: string[] = []) {
  for (const n of preferredNames) {
    if (mod?.[n]) return mod[n];
  }
  if (mod?.default) return mod.default;

  // last resort: first function-like export
  const vals = Object.values(mod || {});
  const candidate = vals.find((v: any) => typeof v === "function");
  return candidate || null;
}

/** Lazy-load screens without relying on named/default exports existing */
function lazyPick(importer: () => Promise<any>, preferredNames: string[] = []) {
  return React.lazy(async () => {
    const mod = await importer();
    const Comp = pickComponent(mod, preferredNames);
    if (!Comp) {
      // fallback component to avoid hard-crash
      return {
        default: () => (
          <div style={{ padding: 24 }}>
            Missing screen export. Check module exports.
          </div>
        ),
      };
    }
    return { default: Comp };
  });
}

/**
 * Find a Provider component by scanning ./context for files containing "Assistant" etc.
 * This avoids guessing exact filenames (AssistantContext vs AssistantProvider etc).
 */
function findProviderInContext(preferredExportNames: string[], globPattern: string) {
  try {
    const mods = import.meta.glob("./context/**/*", { eager: true }) as Record<string, any>;
    const entries = Object.entries(mods);

    for (const [path, mod] of entries) {
      if (!path.toLowerCase().includes(globPattern.toLowerCase())) continue;

      // try explicit exports first
      for (const name of preferredExportNames) {
        if (mod?.[name]) return mod[name];
      }

      // then default
      if (mod?.default) return mod.default;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/** CartProvider: prefer your known module; fallback to glob search */
const CartProvider =
  (CartContextMod as any)?.CartProvider ||
  findProviderInContext(["CartProvider", "Provider"], "cart") ||
  (({ children }: { children: React.ReactNode }) => <>{children}</>);

/** AssistantProvider: discovered via glob */
const AssistantProvider =
  findProviderInContext(["AssistantProvider", "Provider"], "assistant") ||
  (({ children }: { children: React.ReactNode }) => <>{children}</>);

/* ============================
   PDP Loader Helpers
   ============================ */

const ProductPdpProvider = (PdpContext as any).ProductPdpProvider as any;

/** Cache for global maps/indexes */
let INDEX_CACHE: any | null = null;
let INDEX_PROMISE: Promise<any> | null = null;

const SHARD_CACHE: Record<string, Record<string, string>> = {};
let PDP_PATH_MAP_CACHE: Record<string, string> | null = null;
let PDP_PATH_MAP_PROMISE: Promise<Record<string, string> | null> | null = null;

/** Some deployments accidentally point R2_BASE at the SPA origin; add safe fallbacks */
function getR2BaseCandidates(): string[] {
  const bases: string[] = [];
  const push = (b?: string | null) => {
    if (!b) return;
    const s = String(b).replace(/\/+$/, "");
    if (!s) return;
    if (!bases.includes(s)) bases.push(s);
  };

  push(R2_BASE);

  // If R2_BASE is wrong (equals your SPA host), these give you a second chance:
  push("https://r2.ventari.net");
  // If you want, you can keep your public r2.dev base too:
  push("https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev");

  return bases;
}

/**
 * Try to fetch JSON from multiple bases.
 * Important: if the response is actually HTML, fetchJsonStrict should throw or parse-fail.
 */
async function fetchJsonFromBases<T>(relPath: string, label: string, opts?: any): Promise<T | null> {
  const bases = getR2BaseCandidates();
  let lastErr: any = null;

  for (const base of bases) {
    const url = joinUrl(base, relPath.replace(/^\/+/, ""));
    try {
      const data = await fetchJsonStrict<T>(url, label, opts);
      if (data !== null) return data;
    } catch (e) {
      lastErr = e;
    }
  }

  if (opts?.allow404) return null;
  throw lastErr || new Error(`${label} failed for ${relPath}`);
}

async function loadPdpPathMapOnce(): Promise<Record<string, string> | null> {
  if (PDP_PATH_MAP_CACHE) return PDP_PATH_MAP_CACHE;
  if (PDP_PATH_MAP_PROMISE) return PDP_PATH_MAP_PROMISE;

  PDP_PATH_MAP_PROMISE = (async () => {
    const candidates = [
      "indexes/pdp_path_map.json.gz",
      "indexes/pdp_path_map.json",
    ];

    for (const rel of candidates) {
      const data = await fetchJsonFromBases<Record<string, string>>(
        rel,
        "PDP path map fetch",
        { allow404: true }
      );
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

/** Cache the global manifest/index */
async function loadIndexOnce(): Promise<any> {
  if (INDEX_CACHE) return INDEX_CACHE;
  if (INDEX_PROMISE) return INDEX_PROMISE;

  INDEX_PROMISE = (async () => {
    const candidates = [
      // prefer the actual file you DO have:
      "indexes/_index.json",
      "indexes/_index.json.gz",

      // legacy guesses:
      "indexes/pdp2/_index.json.gz",
      "indexes/pdp2/_index.json",
      "indexes/_index.cards.json.gz",
    ];

    for (const rel of candidates) {
      const data = await fetchJsonFromBases<any>(rel, "Index fetch", { allow404: true });
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

  if (shardMap[slug]) return slug;

  const hit = keys.find((k) => slug.toLowerCase().startsWith(k.toLowerCase()));
  return hit || null;
}

async function loadShardByUrl(shardUrl: string): Promise<Record<string, string> | null> {
  if (SHARD_CACHE[shardUrl]) return SHARD_CACHE[shardUrl];

  try {
    const data = await fetchJsonStrict<Record<string, string>>(shardUrl, "Shard fetch", { allow404: true });
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

  if (productUrl.endsWith(".json")) push(`${productUrl}.gz`);
  if (productUrl.endsWith(".json.gz")) push(productUrl.replace(/\.json\.gz$/i, ".json"));

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
   PDP ROUTE — Loader
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

        // ✅ Strategy 0: Use pdp_path_map.json(.gz) (you have this file)
        const pathMap = await loadPdpPathMapOnce();
        if (pathMap && pathMap[handle]) {
          productPath = pathMap[handle];
        }

        // ── Strategy 1: index/manifest shard resolution ──
        if (!productPath) {
          try {
            const index = await loadIndexOnce();

            // simple array index
            if (Array.isArray(index)) {
              const entry = index.find((x: any) => x?.slug === handle);
              if (entry?.path) productPath = entry.path;
            }

            // manifest with shards
            else if (
              index &&
              typeof index === "object" &&
              index.shards &&
              !Array.isArray(index.shards)
            ) {
              const manifest = index as { base: string; shards: Record<string, string> };
              const shardKey = resolveShardKeyFromManifest(handle, manifest.shards);

              if (shardKey && manifest.shards[shardKey]) {
                const base = String(manifest.base || "indexes/pdp2/")
                  .replace(/^\/+/, "")
                  .replace(/\/+$/, "")
                  .concat("/");
                const filename = manifest.shards[shardKey].replace(/^\/+/, "");
                const shardUrl = joinUrl(getR2BaseCandidates()[0], `${base}${filename}`);

                const shard = await loadShardByUrl(shardUrl);
                if (shard && shard[handle]) productPath = shard[handle];
              }
            }
          } catch (e) {
            console.warn("[ProductRoute] index resolution failed:", e);
          }
        }

        // ── Strategy 2: fallback to direct products/<slug>.json ──
        if (!productPath) productPath = `products/${handle}.json`;

        const bases = getR2BaseCandidates();
        const productUrl =
          /^https?:\/\//i.test(productPath) || productPath.startsWith("/")
            ? productPath
            : joinUrl(bases[0], productPath);

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
   Lazy Screens (prevents Rollup export errors)
   ============================ */

const Home = lazyPick(() => import("./screens/Home"), ["Home", "default"]);
const ShopAll = lazyPick(() => import("./screens/Shop"), ["ShopAll", "default"]);
const SingleProduct = lazyPick(() => import("./screens/SingleProduct"), ["SingleProduct", "default"]);
const Cart = lazyPick(() => import("./screens/Cart"), ["Cart", "default"]);
const Checkout = lazyPick(() => import("./screens/Checkout"), ["Checkout", "default"]);
const CartSidebar = lazyPick(() => import("./screens/CartSidebar"), ["CartSidebar", "default"]);
const ProductComparison = lazyPick(() => import("./screens/ProductComparison"), ["ProductComparison", "default"]);
const CategoryPage = lazyPick(() => import("./screens/category/CategoryPage"), ["CategoryPage", "default"]);

const SearchResultsPage =
  (SearchResultsPageModule as any).default || SearchResultsPageModule;

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
   App
   ============================ */

export function App() {
  return (
    <React.Suspense fallback={<div />}>
      <CartProvider>
        <AssistantProvider>
          <RouterProvider router={router} fallbackElement={<div />} />
        </AssistantProvider>
      </CartProvider>
    </React.Suspense>
  );
}

// ✅ IMPORTANT: default export for src/index.tsx
export default App;
