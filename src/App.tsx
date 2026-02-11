import React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  useParams,
} from "react-router-dom";

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
   R2 Base (PUBLIC)
   ============================ */
const R2_PUBLIC_BASE =
  import.meta.env.VITE_R2_PUBLIC_BASE ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

/* ============================
   ✅ Validated JSON fetch
   - Rejects text/html (Cloudflare SPA fallback)
   - Handles gzip transparently (browser decompresses)
   ============================ */
async function fetchJson(url: string) {
  const res = await fetch(encodeURI(url), { cache: "force-cache" });

  const ct = (res.headers.get("content-type") || "").toLowerCase();

  // Reject HTML fallback pages
  if (ct.includes("text/html")) {
    throw new Error(
      `Expected JSON at ${url} but got text/html (file missing from R2 or wrong Content-Type)`
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} at ${url}: ${text.slice(0, 140)}`);
  }

  const text = await res.text();

  // Extra guard: body starts with HTML
  if (text.trim().startsWith("<")) {
    throw new Error(
      `Expected JSON at ${url} but got HTML (file missing or misrouted)`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON at ${url} but got non-JSON: ${text.slice(0, 140)}`
    );
  }
}

/* ============================
   ✅ GLOBAL INDEX CACHE
   - Loads indexes/_index.json.gz once
   - Supports both flat array and manifest { version, base, shards }
   ============================ */
let INDEX_CACHE: any = null;
let INDEX_PROMISE: Promise<any> | null = null;

async function loadIndexOnce(): Promise<any> {
  if (INDEX_CACHE) return INDEX_CACHE;
  if (INDEX_PROMISE) return INDEX_PROMISE;

  const url = joinUrl(R2_PUBLIC_BASE, "indexes/_index.json.gz");

  INDEX_PROMISE = (async () => {
    try {
      const parsed = await fetchJson(url);
      INDEX_CACHE = parsed;
      return parsed;
    } catch (e) {
      console.error("Failed to load global index:", e);
      throw e;
    }
  })().finally(() => {
    INDEX_PROMISE = null;
  });

  return INDEX_PROMISE;
}

/* ============================
   ✅ SHARD CACHE
   ============================ */
const SHARD_CACHE: Record<string, any> = {};

async function loadShard(shardKey: string): Promise<Record<string, string> | null> {
  if (SHARD_CACHE[shardKey]) return SHARD_CACHE[shardKey];

  const url = joinUrl(R2_PUBLIC_BASE, `indexes/pdp_paths/${shardKey}.json.gz`);

  try {
    const data = await fetchJson(url);
    SHARD_CACHE[shardKey] = data;
    return data;
  } catch (err) {
    console.warn(`[ProductRoute] Shard ${shardKey} failed:`, err);
    return null;
  }
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

        // ── Strategy 1: Shard lookup (fast path) ──
        const shardKey = handle.slice(0, 2).toLowerCase();
        if (/^[a-z0-9]{2}$/.test(shardKey)) {
          const shard = await loadShard(shardKey);
          if (shard && shard[handle]) {
            productPath = shard[handle];
            console.log("[ProductRoute] Found path in shard:", productPath);
          }
        }

        // ── Strategy 2: Fallback to global index ──
        if (!productPath) {
          console.log("[ProductRoute] Shard miss, checking global index…");
          const index = await loadIndexOnce();

          if (Array.isArray(index)) {
            // Flat array format: [{ slug, path, … }]
            const entry = index.find((p: any) => p?.slug === handle);
            if (entry?.path) {
              productPath = entry.path;
              console.log("[ProductRoute] Found in flat index:", productPath);
            }
          } else if (index && typeof index === "object" && Array.isArray(index.shards)) {
            // Manifest format: { version, base, shards: ["aa.json.gz", …] }
            // Try loading each shard until we find the slug
            for (const shardFile of index.shards) {
              const key = String(shardFile).replace(/\.json(\.gz)?$/i, "");
              const shard = await loadShard(key);
              if (shard && shard[handle]) {
                productPath = shard[handle];
                console.log("[ProductRoute] Found in manifest shard:", key, productPath);
                break;
              }
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
        const productUrl = joinUrl(R2_PUBLIC_BASE, productPath);
        console.log("[ProductRoute] Fetching product JSON:", productUrl);
        const p = await fetchJson(productUrl);

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
