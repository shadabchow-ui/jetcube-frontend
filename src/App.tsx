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

import { CartProvider } from "./context/CartContext";
import { useCart } from "./context/CartContext";
import * as WishlistContextMod from "./context/WishlistContext";

import AssistantProvider from "./assistant/AssistantProvider";

const Checkout = React.lazy(() => import("./pages/Checkout"));
const Cart = React.lazy(() => import("./pages/Cart"));

/* ============================
   Product Fetch Wrapper
   ============================ */

function useSlugParam() {
  const { slug } = useParams();
  return slug || "";
}

function normalizeProductPath(p: string) {
  const s = String(p || "").trim();
  if (!s) return s;
  // If it's already a full URL, keep it.
  if (/^https?:\/\//i.test(s)) return s;
  // Normalize leading slashes so joinUrl behaves.
  return s.replace(/^\/+/, "");
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return await res.json();
}

async function fetchProductJsonWithFallback(productRelOrUrl: string) {
  const url = /^https?:\/\//i.test(productRelOrUrl)
    ? productRelOrUrl
    : joinUrl(R2_BASE, productRelOrUrl);
  return await fetchJson(url);
}

async function fetchIndexManifest() {
  // These are the common manifest locations we’ve used across builds.
  // Keep deterministic, no extra endpoints beyond R2_BASE.
  const candidates = [
    joinUrl(R2_BASE, "_index.json"),
    joinUrl(R2_BASE, "indexes/_index.json"),
    joinUrl(R2_BASE, "index/_index.json"),
    joinUrl(R2_BASE, "search/_index.json"),
  ];

  for (const u of candidates) {
    try {
      return await fetchJson(u);
    } catch {
      // try next
    }
  }
  return null;
}

async function fetchShard(url: string) {
  try {
    return await fetchJson(url);
  } catch {
    return null;
  }
}

// Simple deterministic shard key resolver.
// Different manifests may encode shard naming differently; we handle common patterns.
function resolveShardKeyFromManifest(handle: string, shardMap: Record<string, any>) {
  if (!handle) return null;

  // 1) Direct key match (rare but exists)
  if (Object.prototype.hasOwnProperty.call(shardMap, handle)) return handle;

  // 2) If keys are like "a", "b", "c" or "00", "01", etc, hash by first char / suffix.
  const keys = Object.keys(shardMap);
  if (!keys.length) return null;

  // Common: alphabetical buckets (a..z)
  const first = handle[0]?.toLowerCase();
  if (first && keys.includes(first)) return first;

  // Common: numeric shards like "00".."99" based on simple hash/mod
  const numericKeys = keys.filter((k) => /^\d+$/.test(k));
  if (numericKeys.length) {
    let h = 0;
    for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
    const sorted = numericKeys.sort((a, b) => Number(a) - Number(b));
    const idx = h % sorted.length;
    return sorted[idx];
  }

  // Fallback: try first 2 chars bucket if present
  const first2 = handle.slice(0, 2).toLowerCase();
  if (first2 && keys.includes(first2)) return first2;

  return null;
}

async function fetchProductJson(slug: string) {
  // Default fallback path if manifests aren’t available.
  const defaultRel = `p/${slug}.json`;
  const defaultUrl = joinUrl(R2_BASE, defaultRel);

  try {
    return await fetchJson(defaultUrl);
  } catch {
    // fall through to manifest-based resolution
  }

  // Try to resolve via manifest shards.
  const idx = await fetchIndexManifest();
  if (!idx) return null;

  const handle = slug;
  let productPath: string | null =
    idx?.products?.[handle] ||
    idx?.pdp?.[handle] ||
    idx?.pdp2?.[handle] ||
    idx?.paths?.[handle] ||
    idx?.map?.[handle] ||
    null;

  // If not a direct lookup, attempt shard resolution.
  if (!productPath) {
    try {
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
    } catch {
      // ignore
    }
  }

  if (!productPath) {
    productPath = `products/${handle}.json`;
  }

  const finalUrl = normalizeProductPath(productPath);
  return await fetchProductJsonWithFallback(finalUrl);
}

function ProductRoute({ children }: { children: React.ReactNode }) {
  const handle = useSlugParam();
  const [product, setProduct] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PdpContext = require("./pdp/ProductPdpContext");

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const data = await fetchProductJson(handle);
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
      // ✅ FIX: homepage should not be the category directory
      { index: true, element: <Shop /> },

      // ✅ Category directory lives here
      { path: "departments", element: <ShopAllCategories /> },

      // ✅ Back-compat: keep /shop as an alias to /departments
      { path: "shop", element: <Navigate to="/departments" replace /> },

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
          <React.Suspense
            fallback={
              <div className="max-w-[1200px] mx-auto px-4 py-20">
                Loading...
              </div>
            }
          >
            <Checkout />
          </React.Suspense>
        ),
      },
      {
        path: "cart",
        element: (
          <React.Suspense
            fallback={
              <div className="max-w-[1200px] mx-auto px-4 py-20">
                Loading...
              </div>
            }
          >
            <Cart />
          </React.Suspense>
        ),
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

/* ============================
   Notes / Helpers (Existing)
   ============================ */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CartIcon() {
  // This is kept in case you wire the cart icon into a header in the future.
  const cart = useCart();
  const count = cart?.items?.length ?? 0;

  return (
    <div className="relative inline-flex items-center">
      <span>Cart</span>
      {count > 0 && (
        <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </div>
  );
}
