// src/App.tsx
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
import { Shop } from "./screens/Shop";

import OrdersPage from "./pages/OrdersPage";
import WishlistPage from "./pages/WishlistPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import AccountPage from "./pages/AccountPage";

// ✅ FIX: help imports must match file casing exactly on Linux
import ConditionsOfUse from "./pages/help/ConditionsOfUse";
import PrivacyNotice from "./pages/help/PrivacyNotice";
import Accessibility from "./pages/help/Accessibility";
import HelpIndex from "./pages/help/HelpIndex";

import SingleProduct from "./screens/SingleProduct/SingleProduct";

// PDP Context
import * as PdpContext from "./pdp/ProductPdpContext";

/* ============================
   Providers
   ============================ */
import { CartProvider } from "./context/CartContext";
import { AssistantProvider } from "./components/RufusAssistant/AssistantContext";

// ✅ Fix runtime crash: wrap app with WishlistProvider
import * as WishlistContextMod from "./context/WishlistContext";

/* ============================
   Lazy module resolver (Vite-safe)
   ============================ */
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
        `lazyCompat(): module loaded but none of exports found: ${exportNames.join(
          ", ",
        )}`,
      );
    }
    return { default: picked };
  });
}

/* ============================
   Lazy-loaded screens with named exports
   ============================ */
// ✅ Corrected path to "./screens" to fix Vite build resolution error
const Cart = lazyCompat(() => import("./screens/Cart"), ["Cart"]);
const Checkout = lazyCompat(() => import("./screens/Checkout"), ["Checkout"]);

/* ============================
   Helpers
   ============================ */

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

async function fetchShard(shardUrl: string) {
  try {
    const res = await fetch(shardUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) return await res.json();

    const buf = await res.arrayBuffer();
    const u8 = new Uint8Array(buf);
    const isGzip = u8[0] === 0x1f && u8[1] === 0x8b;

    if (isGzip && typeof DecompressionStream !== "undefined") {
      const stream = new Response(buf).body?.pipeThrough(
        new DecompressionStream("gzip"),
      );
      if (stream) {
        const text = await new Response(stream).text();
        return JSON.parse(text);
      }
    }

    const text = new TextDecoder().decode(buf);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeProductPath(productPath: string) {
  if (/^https?:\/\//i.test(productPath)) return productPath;
  const clean = productPath.replace(/^\/+/, "");
  return joinUrl(R2_BASE, clean);
}

async function fetchProductJsonWithFallback(finalUrl: string) {
  try {
    return await fetchJson(finalUrl);
  } catch {
    if (!finalUrl.endsWith(".gz")) {
      try {
        return await fetchJson(`${finalUrl}.gz`);
      } catch {
        // fallthrough
      }
    }
    throw new Error("Product JSON not found");
  }
}

function resolveShardKeyFromManifest(
  handle: string,
  shardMap: Record<string, any>,
) {
  const keys = Object.keys(shardMap || {});
  if (!keys.length) return null;

  if (shardMap[handle]) return handle;

  const first = handle.charAt(0).toLowerCase();
  const candidates = [`_${first}`, first, `0${first}`];

  for (const c of candidates) {
    if (c in shardMap) return c;
  }

  return keys[0] || null;
}

/* ============================
   PDP Index loader
   ============================ */

let _indexOncePromise: Promise<any> | null = null;

async function loadIndexOnce() {
  if (_indexOncePromise) return _indexOncePromise;

  const candidates = [
    "indexes/pdp_path_map.json",
    "indexes/pdp_path_map.json.gz",
    "indexes/pdp2/_index.json",
    "indexes/pdp2/_index.json.gz",
    "indexes/_index.json",
    "indexes/_index.json.gz",
  ].map((rel) => joinUrl(R2_BASE, rel));

  _indexOncePromise = (async () => {
    for (const u of candidates) {
      try {
        const data = await fetchShard(u);
        if (data) return data;
      } catch {
        // ignore
      }
    }
    return null;
  })();

  return _indexOncePromise;
}

/* ============================
   PDP API fetch
   ============================ */

async function fetchPdpFromApi(handle: string): Promise<any | null> {
  const url = `/api/pdp/${encodeURIComponent(handle)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && typeof json === "object" && "data" in json && json.ok !== false) {
      return (json as any).data;
    }
    return json;
  } catch {
    return null;
  }
}

/* ============================
   PDP Route Wrapper
   ============================ */

function ProductRoute({ children }: { children: React.ReactNode }) {
  const { slug } = useParams();
  const handle = slug;

  const [product, setProduct] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        setProduct(null);

        if (!handle) throw new Error("Missing product handle");

        const apiProduct = await fetchPdpFromApi(handle);
        if (apiProduct) {
          if (!cancelled) setProduct(apiProduct);
          return;
        }

        let productPath: string | null = null;

        try {
          const idx = await loadIndexOnce();

          if (idx) {
            if (typeof idx === "object" && idx[handle]) {
              productPath = String(idx[handle]);
            }

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
        } catch {
          // ignore
        }

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
    return <div className="max-w-[1200px] mx-auto px-4 py-20">Loading…</div>;
  }

  const ProductPdpProvider = (PdpContext as any).ProductPdpProvider as any;
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
      { path: "", element: <Shop /> },
      { path: "shop", element: <ShopAllCategories /> },
      { path: "wishlist", element: <WishlistPage /> },
      { path: "search", element: <SearchResultsPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "account", element: <AccountPage /> },
      { path: "terms", element: <ConditionsOfUse /> },
      { path: "privacy", element: <PrivacyNotice /> },
      { path: "disclaimer", element: <ConditionsOfUse /> },
      { path: "accessibility", element: <Accessibility /> },

      {
        path: "p/:slug",
        element: (
          <ProductRoute>
            <SingleProduct />
          </ProductRoute>
        ),
      },

      // ✅ Fix: Wrapped lazy-loaded React components with Suspense boundaries to prevent runtime crash
      { 
        path: "checkout", 
        element: (
          <React.Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-20">Loading...</div>}>
            <Checkout />
          </React.Suspense>
        ) 
      },
      { 
        path: "cart", 
        element: (
          <React.Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-20">Loading...</div>}>
            <Cart />
          </React.Suspense>
        ) 
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  {
    path: "/help",
    element: <HelpLayout />,
    children: [{ path: "", element: <HelpIndex /> }],
  },
]);

export default function App() {
  const WishlistProvider = (WishlistContextMod as any).WishlistProvider as any;

  return (
    <CartProvider>
      <WishlistProvider>
        <AssistantProvider>
          <RouterProvider router={router} />
        </AssistantProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
