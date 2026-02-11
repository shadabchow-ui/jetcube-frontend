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

/* ============================
   Context Imports
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
import * as SearchResultsPageModule from "./pages/SearchResultsPage";
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
import * as CookiePolicyModule from "./pages/help/cookiepolicy";

/* ============================
   Root Layout Alias
   ============================ */
const RootLayout = MainLayout;

/* ============================
   R2 / Index / Shard Utilities
   ============================ */

/**
 * Notes:
 * - R2_BASE comes from VITE_R2_BASE_URL (preferred) or VITE_R2_BASE (legacy)
 * - joinUrl prevents double slashes + protocol-relative URLs
 * - fetchJsonStrict hardens against 401/403/404 + HTML error pages + gzip header mismatches
 */

let INDEX_CACHE: any = null;
let INDEX_PROMISE: Promise<any> | null = null;

async function loadIndexOnce(): Promise<any> {
  if (INDEX_CACHE) return INDEX_CACHE;
  if (INDEX_PROMISE) return INDEX_PROMISE;

  const url = joinUrl(R2_BASE, "indexes/_index.json.gz");

  INDEX_PROMISE = (async () => {
    const parsed = await fetchJsonStrict<any>(url, "Index fetch");
    INDEX_CACHE = parsed;
    return parsed;
  })().finally(() => {
    INDEX_PROMISE = null;
  });

  return INDEX_PROMISE;
}

/** Cache shards by URL (manifest can map many keys → filenames). */
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

/**
 * Resolve a shard key from a slug using the keys present in the manifest.
 * Works with common naming schemes like:
 * - "12" (first 2 chars)
 * - "0-" (first 2 chars with dash)
 * - "_a" (underscore + first char)
 * - "a" (first char)
 */
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
    const hit = keys.find((x) => x.toLowerCase() === k);
    if (hit) return hit;
  }

  // Fallback: deterministic hash bucketing into available keys
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  return keys[Math.abs(hash) % keys.length];
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
const ProductComparison = pick<any>(
  ProductComparisonModule,
  "ProductComparison"
);
const SearchResultsPage = pick<any>(
  SearchResultsPageModule,
  "SearchResultsPage"
);
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

/* Legal */
const ConditionsOfUse = pick<any>(ConditionsOfUseModule, "ConditionsOfUse");
const PrivacyNotice = pick<any>(PrivacyNoticeModule, "PrivacyNotice");
const Accessibility = pick<any>(AccessibilityModule, "Accessibility");
const CookiePolicy = pick<any>(CookiePolicyModule, "CookiePolicy");

/* ============================
   PDP Provider
   ============================ */
const ProductPdpProvider =
  pick<any>(PdpContext, "ProductPdpProvider") ||
  (({ children }: any) => <>{children}</>);

/* ============================
   PDP ROUTE — Full shard-based loader
   ============================ */
function ProductRoute({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const handle = decodeURIComponent(id || "").trim();
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

        // ── Strategy 1: Fast shard guess (optional) ──
        // Many builds shard by the first 2 characters of the slug (e.g. "12", "0-").
        // We'll try that as a quick win, but we do NOT rely on it.
        const guessedKey = handle.slice(0, 2).toLowerCase();
        if (guessedKey) {
          const guessedUrl = joinUrl(
            R2_BASE,
            `indexes/pdp_paths/${guessedKey}.json.gz`
          );
          const shard = await loadShardByUrl(guessedUrl);
          if (shard && shard[handle]) {
            productPath = shard[handle];
            console.log("[ProductRoute] Found path in guessed shard:", productPath);
          }
        }

        // ── Strategy 2: Use _index manifest (authoritative) ──
        if (!productPath) {
          console.log("[ProductRoute] Checking _index manifest…");
          const index = await loadIndexOnce();

          if (Array.isArray(index)) {
            // Flat array format: [{ slug, path, … }]
            const entry = index.find((p: any) => p?.slug === handle);
            if (entry?.path) {
              productPath = entry.path;
              console.log("[ProductRoute] Found in flat index:", productPath);
            }
          } else if (
            index &&
            typeof index === "object" &&
            index.shards &&
            typeof index.shards === "object" &&
            !Array.isArray(index.shards)
          ) {
            // Manifest format: { version, base, shards: { key: filename } }
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
                console.log("[ProductRoute] Found via manifest shard:", shardKey, productPath);
              } else {
                console.warn("[ProductRoute] Slug not found in resolved shard:", shardKey, shardUrl);
              }
            } else {
              console.warn("[ProductRoute] Could not resolve shard key for slug:", handle);
            }
          }
        }

        // ── Strategy 3: Direct fetch by convention ──
        if (!productPath) {
          // Try direct R2 path: products/<slug>.json
          productPath = `products/${handle}.json`;
          console.log("[ProductRoute] Trying direct path:", productPath);
        }

        // ── Fetch the product JSON ──
        const productUrl = joinUrl(R2_BASE, productPath);
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
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 text-sm text-gray-600">
        Loading product…
      </div>
    );
  }

  return <ProductPdpProvider product={product}>{children}</ProductPdpProvider>;
}

/* ============================
   ORDER COMPLETE
   ============================ */
function OrderComplete() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="bg-white border border-[#d5dbdb] rounded p-6">
        <div className="text-[22px] font-bold text-[#0F1111]">
          Order complete
        </div>
        <div className="mt-2 text-[14px] text-[#565959]">
          Thanks! Your payment was successful.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/orders"
            className="inline-flex items-center justify-center bg-[#ffd814] hover:bg-[#f7ca00] text-black text-[13px] font-semibold px-4 py-2 rounded"
          >
            View orders
          </a>
          <a
            href="/shop"
            className="text-[#007185] hover:underline text-[13px]"
          >
            Continue shopping
          </a>
        </div>
      </div>
    </div>
  );
}

/* ============================
   ROUTER
   ============================ */
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
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
      { path: "signup", element: <SignupPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "single-product", element: <Navigate to="/shop" replace /> },
      { path: "*", element: <CategoryPage /> },
      {
        path: "help",
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
          { path: "cookiepolicy", element: <CookiePolicy /> },
        ],
      },
    ],
  },
]);

/* ============================
   CONSENT BANNER
   ============================ */
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type ConsentChoice = "granted" | "denied";
const CONSENT_KEY = "ventari_consent_v1";

function applyConsent(choice: ConsentChoice) {
  window.gtag?.("consent", "update", {
    ad_storage: choice,
    analytics_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

function ConsentBanner() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const saved =
      (localStorage.getItem(CONSENT_KEY) as ConsentChoice | null) || null;
    if (saved) {
      applyConsent(saved);
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed left-4 right-4 bottom-4 z-[9999]">
      <div className="max-w-[900px] mx-auto bg-white border border-[#d5dbdb] rounded-xl shadow-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-[#0F1111]">
              Cookies & analytics
            </div>
            <div className="mt-1 text-[13px] text-[#565959] leading-relaxed">
              We use cookies/analytics to understand traffic and improve the
              site. You can accept or reject.
            </div>
          </div>

          <div className="flex gap-2 sm:justify-end">
            <button
              className="px-4 py-2 rounded-lg border border-[#d5dbdb] text-[13px] font-semibold text-[#0F1111] hover:bg-gray-50"
              onClick={() => {
                localStorage.setItem(CONSENT_KEY, "denied");
                applyConsent("denied");
                setOpen(false);
              }}
            >
              Reject
            </button>

            <button
              className="px-4 py-2 rounded-lg bg-[#0F1111] text-white text-[13px] font-semibold hover:opacity-90"
              onClick={() => {
                localStorage.setItem(CONSENT_KEY, "granted");
                applyConsent("granted");
                setOpen(false);
              }}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================
   APP EXPORT
   ============================ */
export const App = () => {
  return (
    <CartProvider>
      <WishlistProvider>
        <ConsentBanner />
        <RouterProvider router={router} />
      </WishlistProvider>
    </CartProvider>
  );
};

export default App;
