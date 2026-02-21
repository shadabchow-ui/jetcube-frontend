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
import Home from "./screens/Home";

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
import {
  AssistantContextProvider,
  AssistantLauncher,
  AssistantDrawer,
} from "./components/RufusAssistant";

// ✅ Fix runtime crash: wrap app with WishlistProvider
import * as WishlistContextMod from "./context/WishlistContext";

/* ============================
   Lazy module resolver (Vite-safe)
   ============================ */
function lazyCompat<TProps = any>(
  importer: () => Promise<any>,
  exportNames: string[] = []
) {
  return React.lazy(async () => {
    const mod: any = await importer();
    const picked =
      exportNames.map((k) => mod?.[k]).find((v) => v != null) ??
      mod?.default ??
      mod;

    if (!picked) {
      throw new Error(
        `lazyCompat: could not resolve any export from module. Tried: ${exportNames.join(
          ", "
        )}`
      );
    }

    return { default: picked };
  }) as any;
}

/* ============================
   Lazy-loaded screens (Vite-safe)
   ============================ */
const Checkout = lazyCompat(() => import("./screens/Checkout/Checkout"), [
  "default",
  "Checkout",
]);
const Cart = lazyCompat(() => import("./screens/Cart/Cart"), ["default", "Cart"]);

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
  if (/^https?:\/\//i.test(s)) return s;
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

function resolveShardKeyFromManifest(handle: string, shardMap: Record<string, any>) {
  if (!handle) return null;

  if (Object.prototype.hasOwnProperty.call(shardMap, handle)) return handle;

  const keys = Object.keys(shardMap);
  if (!keys.length) return null;

  const first = handle[0]?.toLowerCase();
  if (first && keys.includes(first)) return first;

  const numericKeys = keys.filter((k) => /^\d+$/.test(k));
  if (numericKeys.length) {
    let h = 0;
    for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
    const sorted = numericKeys.sort((a, b) => Number(a) - Number(b));
    const idx = h % sorted.length;
    return sorted[idx];
  }

  const first2 = handle.slice(0, 2).toLowerCase();
  if (first2 && keys.includes(first2)) return first2;

  return null;
}

async function fetchProductJson(slug: string) {
  const url = `/api/pdp/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status})`);
  }

  const json = await res.json();

  // Supports either raw JSON or { ok, data }
  if (json && typeof json === "object" && "data" in json && (json as any).ok !== false) {
    return (json as any).data;
  }

  return json;
}

function ProductRoute({ children }: { children: React.ReactNode }) {
  const handle = useSlugParam();
  const [product, setProduct] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

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
      { index: true, element: <Home /> },

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
        <AssistantContextProvider>
          <RouterProvider router={router} />
          <AssistantLauncher />
          <AssistantDrawer />
        </AssistantContextProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

/* ============================
   PDP wiring: keep backward compatibility
   ============================ */

// If you previously relied on these exports being present in this file, keep them.
// Otherwise, they can be removed safely.
export const ProductPdpProvider = (PdpContext as any).ProductPdpProvider as any;
export const useProductPdp = (PdpContext as any).useProductPdp as any;

/* ============================
   Notes / Helpers (Existing)
   ============================ */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CartIcon() {
  // This is kept in case you wire the cart icon into a header in the future.
  // If CartContext changes shape, adjust accordingly.
  return (
    <div className="relative inline-flex items-center">
      <span>Cart</span>
    </div>
  );
}
