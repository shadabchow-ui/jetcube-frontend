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
// import CategoryDirectory from "./pages/CategoryDirectory"; // ❌ Removed: Missing file

/* ============================
   PDP Imports
   ============================ */
import * as PdpContext from "./pdp/ProductPdpContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

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
import AccountPage from "./pages/AccountPage";
import WishlistPage from "./pages/WishlistPage";

/* ============================
   Brand Page Imports
   ============================ */
import * as AboutUsModule from "./pages/help/AboutUs";
import * as CareersModule from "./pages/help/Careers";
import * as PressModule from "./pages/help/Press";
import * as SustainabilityModule from "./pages/help/Sustainability";
import * as NewsletterModule from "./pages/help/Newsletter";

/* ============================
   Help / Legal Page Imports
   ============================ */
import * as HelpIndexModule from "./pages/help/HelpIndex";
import * as ContactModule from "./pages/help/Contact";
import * as ShippingModule from "./pages/help/Shipping";
import * as ReturnsModule from "./pages/help/Returns";
import * as PaymentsModule from "./pages/help/Payments";
import * as AdsPrivacyModule from "./pages/help/AdsPrivacy";
import * as ConsumerDataModule from "./pages/help/ConsumerData";
import * as ProductSafetyModule from "./pages/help/ProductSafety";
import * as DevicesModule from "./pages/help/Devices";
import * as ConditionsOfUseModule from "./pages/help/ConditionsOfUse";
import * as PrivacyNoticeModule from "./pages/help/PrivacyNotice";
import * as AccessibilityModule from "./pages/help/Accessibility";
// import * as CookiePolicyModule from "./pages/help/CookiePolicy"; // ❌ Removed: Missing file

/* ============================
   PDP Loader Helpers
   ============================ */

const ProductPdpProvider = (PdpContext as any).ProductPdpProvider as any;

/** Cache the global manifest (indexes/_index.json.gz) */
let INDEX_CACHE: any | null = null;
let INDEX_PROMISE: Promise<any> | null = null;

async function loadIndexOnce(): Promise<any> {
  if (INDEX_CACHE) return INDEX_CACHE;
  if (INDEX_PROMISE) return INDEX_PROMISE;

  const url = joinUrl(R2_BASE, "indexes/_index.json.gz");

  INDEX_PROMISE = (async () => {
    const parsed = await fetchJsonStrict<any>(url, "Index fetch");
    INDEX_CACHE = parsed;
    return parsed;
  })().catch(() => {
    INDEX_PROMISE = null;
  });

  return INDEX_PROMISE;
}

/** Cache shards by URL */
const SHARD_CACHE: Record<string, any> = {};

async function loadShardByUrl(
  shardUrl: string
): Promise<Record<string, string> | null> {
  if (SHARD_CACHE[shardUrl]) return SHARD_CACHE[shardUrl];

  try {
    const data = await fetchJsonStrict<Record<string, string>>(
      shardUrl,
      "Shard fetch"
    );
    SHARD_CACHE[shardUrl] = data;
    return data;
  } catch (err) {
    console.warn(`[ProductRoute] shard failed: ${shardUrl}`, err);
    return null;
  }
}

function resolveShardKeyFromManifest(slug: string, shards: Record<string, string>): string | null {
  const keys = Object.keys(shards || {});
  if (!slug || keys.length === 0) return null;

  const a = slug.charAt(0).toLowerCase();
  const b = slug.charAt(1).toLowerCase();

  const candidates = [
    a + b,      // "12", "0-"
    a,          // "a"
    "_" + a,    // "_a"
  ];

  for (const k of candidates) {
    if (shards[k]) return k;
  }

  // Fallback: prefix match
  const hit2 = keys.find((k) => slug.toLowerCase().startsWith(k.toLowerCase()));
  return hit2 || null;
}

/* ============================
   PDP ROUTE — Full shard-based loader
   ============================ */
function ProductRoute({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();

  // Prefer router param, but fall back to window.location.pathname for deep links
  const pathHandle =
    typeof window !== "undefined" && window.location.pathname.startsWith("/p/")
      ? decodeURIComponent(window.location.pathname.slice(3).split("/")[0] || "").trim()
      : "";

  const handle = decodeURIComponent(id || "").trim() || pathHandle;
  const [product, setProduct] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        setProduct(null);

        if (!handle) throw new Error("Missing product handle");

        let productPath: string | null = null;

        // ── Strategy 1: Use manifest to resolve shard ──
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
              const base = String(manifest.base || "indexes/pdp_paths/")
                .replace(/^\/+/, "")
                .replace(/\/+$/, "")
                .concat("/");
              const filename = manifest.shards[shardKey].replace(/^\/+/, "");
              const shardUrl = joinUrl(R2_BASE, `${base}${filename}`);

              const shard = await loadShardByUrl(shardUrl);
              if (shard && shard[handle]) {
                productPath = shard[handle];
              }
            }
          }
        } catch (e) {
          console.warn("[ProductRoute] Index/Shard lookup failed, trying fallback", e);
        }

        // Fallback: direct product path
        if (!productPath) {
          productPath = `products/${handle}.json`;
        }

        // ── Fetch the product JSON ──
        const productUrl = /^https?:\/\//i.test(productPath)
          ? productPath
          : joinUrl(R2_BASE, productPath);

        console.log("[ProductRoute] Fetching product JSON:", productUrl);
        const p = await fetchJsonStrict(productUrl, "Product fetch");

        if (!cancelled) {
          setProduct(p);
        }
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
          <a href="/shop" className="inline-block mt-3 text-blue-600 hover:underline">Return to Shop</a>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 flex justify-center">
        <div className="text-gray-500 animate-pulse">Loading product details...</div>
      </div>
    );
  }

  return <ProductPdpProvider product={product}>{children}</ProductPdpProvider>;
}

/* ============================
   Helper: pick named export
   ============================ */
function pick<T = any>(mod: any, named: string): T {
  return (mod?.[named] ?? mod?.default) as T;
}

/* ============================
   Component Resolvers
   ============================ */
const Home = pick<any>(HomeModule, "Home");
const Shop = pick<any>(ShopModule, "Shop");
const SingleProduct = pick<any>(SingleProductModule, "SingleProduct");
const Cart = pick<any>(CartModule, "Cart");
const Checkout = pick<any>(CheckoutModule, "Checkout");
const CartSidebar = pick<any>(CartSidebarModule, "CartSidebar");
const ProductComparison = pick<any>(ProductComparisonModule, "ProductComparison");
const SearchResultsPage = pick<any>(SearchResultsPageModule, "default");
const CategoryPage = pick<any>(CategoryPageModule, "CategoryPage");

/* Brand */
const AboutUs = pick<any>(AboutUsModule, "AboutUs");
const Careers = pick<any>(CareersModule, "Careers");
const Press = pick<any>(PressModule, "Press");
const Sustainability = pick<any>(SustainabilityModule, "Sustainability");
const Newsletter = pick<any>(NewsletterModule, "Newsletter");

/* Help */
const HelpIndex = pick<any>(HelpIndexModule, "HelpIndex");
const Contact = pick<any>(ContactModule, "Contact");
const Shipping = pick<any>(ShippingModule, "Shipping");
const Returns = pick<any>(ReturnsModule, "Returns");
const Payments = pick<any>(PaymentsModule, "Payments");
const AdsPrivacy = pick<any>(AdsPrivacyModule, "AdsPrivacy");
const ConsumerData = pick<any>(ConsumerDataModule, "ConsumerData");
const ProductSafety = pick<any>(ProductSafetyModule, "ProductSafety");
const Devices = pick<any>(DevicesModule, "Devices");
const ConditionsOfUse = pick<any>(ConditionsOfUseModule, "ConditionsOfUse");
const PrivacyNotice = pick<any>(PrivacyNoticeModule, "PrivacyNotice");
const Accessibility = pick<any>(AccessibilityModule, "Accessibility");
// const CookiePolicy = pick<any>(CookiePolicyModule, "CookiePolicy"); // ❌ Removed

/* ============================
   Router
   ============================ */
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <CartProvider>
        <WishlistProvider>
          <MainLayout />
        </WishlistProvider>
      </CartProvider>
    ),
    children: [
      { index: true, element: <Home /> },
      {
        path: "shop",
        children: [
          { index: true, element: <ShopAllCategories /> },
          { path: "browse", element: <Shop /> },
          { path: "all", element: <Navigate to="/shop" replace /> },
        ],
      },
      { path: "search", element: <SearchResultsPage /> },
      { path: "c/*", element: <CategoryPage /> },
      {
        path: "p/:id",
        element: (
          <ProductRoute>
            <SingleProduct />
          </ProductRoute>
        ),
      },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderDetailsPage /> },
      { path: "account", element: <AccountPage /> },
      { path: "wishlist", element: <WishlistPage /> },
      { path: "about", element: <AboutUs /> },
      { path: "careers", element: <Careers /> },
      { path: "press", element: <Press /> },
      { path: "sustainability", element: <Sustainability /> },
      { path: "newsletter", element: <Newsletter /> },
      // { path: "category-directory", element: <CategoryDirectory /> }, // ❌ Removed
      { path: "single-product", element: <Navigate to="/shop" replace /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  {
    path: "/help",
    element: <HelpLayout />,
    children: [
      { index: true, element: <HelpIndex /> },
      { path: "shipping", element: <Shipping /> },
      { path: "returns", element: <Returns /> },
      { path: "payments", element: <Payments /> },
      { path: "conditions-of-use", element: <ConditionsOfUse /> },
      { path: "privacy-notice", element: <PrivacyNotice /> },
      { path: "accessibility", element: <Accessibility /> },
      { path: "ads-privacy", element: <AdsPrivacy /> },
      { path: "consumer-data", element: <ConsumerData /> },
      { path: "product-safety", element: <ProductSafety /> },
      { path: "devices", element: <Devices /> },
      { path: "contact", element: <Contact /> },
      // { path: "cookiepolicy", element: <CookiePolicy /> }, // ❌ Removed
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

// ✅ Named export is REQUIRED by index.tsx
export function App() {
  return <RouterProvider router={router} />;
}
