import React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  useParams,
} from "react-router-dom";

/* ============================
   Layout
   ============================ */
import MainLayout from "./layouts/MainLayout";
import HelpLayout from "./layouts/HelpLayout";

/* ============================
   PDP Context
   ============================ */
import * as PdpContext from "./pdp/ProductPdpContext";

/* ============================
   Cart Context
   ============================ */
import { CartProvider } from "./context/CartContext";

/* ============================
   Screens / Pages
   ============================ */
import * as HomeModule from "./screens/Home";
import * as ShopModule from "./screens/Shop";
import * as SingleProductModule from "./screens/SingleProduct";
import * as CartModule from "./screens/Cart";
import * as CheckoutModule from "./screens/Checkout";
import * as CartSidebarModule from "./screens/CartSidebar";
import * as ProductComparisonModule from "./screens/ProductComparison";

/* ============================
   Pages
   ============================ */
import * as SearchResultsPageModule from "./pages/SearchResultsPage";
import * as CategoryPageModule from "./pages/CategoryPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";

/* ============================
   Brand Pages (now in /pages/help)
   ============================ */
import * as AboutUsModule from "./pages/help/AboutUs";
import * as CareersModule from "./pages/help/Careers";
import * as PressModule from "./pages/help/Press";
import * as SustainabilityModule from "./pages/help/Sustainability";
import * as NewsletterModule from "./pages/help/Newsletter";

/* ============================
   Help / Legal Pages
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

/* ============================
   Helper: pick named export if it exists, else default
   ============================ */
function pick<T = any>(mod: any, named: string): T {
  return (mod?.[named] ?? mod?.default) as T;
}

/* ============================
   Pages
   ============================ */
const Home = pick<any>(HomeModule, "Home");
const Shop = pick<any>(ShopModule, "Shop");
const SingleProduct = pick<any>(SingleProductModule, "SingleProduct");
const Cart = pick<any>(CartModule, "Cart");
const Checkout = pick<any>(CheckoutModule, "Checkout");
const CartSidebar = pick<any>(CartSidebarModule, "CartSidebar");
const ProductComparison = pick<any>(ProductComparisonModule, "ProductComparison");
const SearchResultsPage = pick<any>(SearchResultsPageModule, "SearchResultsPage");
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

/* ============================
   PDP Provider
   ============================ */
const ProductPdpProvider =
  pick<any>(PdpContext, "ProductPdpProvider") || (({ children }: any) => <>{children}</>);

/* ============================
   PDP ROUTE
   ============================ */
function ProductRoute({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const handle = (id || "").trim();
  const [product, setProduct] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchJson(url: string) {
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();

      if (!res.ok) {
        // Avoid JSON.parse on HTML fallbacks (index.html, 404 pages, etc.)
        throw new Error(`HTTP ${res.status} at ${url}: ${text.slice(0, 140)}`);
      }

      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Expected JSON at ${url} but got non-JSON: ${text.slice(0, 140)}`);
      }
    }

    async function load() {
      try {
        setError(null);
        setProduct(null);

        if (!handle) throw new Error("Missing product handle");

        const looksLikeAsin = /^[A-Za-z0-9]{10}$/.test(handle);
        const asinKey = handle.toUpperCase();

        // 1) Try handle-based filename first (most common)
        try {
          const byHandle = await fetchJson(`/products/${handle}.json`);
          if (!cancelled) setProduct(byHandle);
          return;
        } catch {
          // continue
        }

        // 2) Load ASIN -> handle map
        const asinToHandle = await fetchJson("/products/_asin_map.json");

        // If URL is /p/ASIN, the map key IS the ASIN and value IS the handle/filename base
        if (looksLikeAsin) {
          const mappedHandle =
            asinToHandle?.[asinKey] ||
            asinToHandle?.[handle] ||
            asinToHandle?.[handle.toLowerCase()];

          if (mappedHandle) {
            // ✅ Try mapped handle file
            try {
              const byMappedHandle = await fetchJson(`/products/${mappedHandle}.json`);
              if (!cancelled) setProduct(byMappedHandle);
              return;
            } catch {
              // continue
            }
          }

          // 3) Legacy fallback: maybe you still have ASIN.json
          const byAsin = await fetchJson(`/products/${asinKey}.json`);
          if (!cancelled) setProduct(byAsin);
          return;
        }

        // If URL is /p/<handle> but your files are ASIN.json, do reverse lookup (handle -> asin)
        const foundAsin = Object.entries(asinToHandle || {}).find(([, v]) => String(v) === handle)?.[0];
        if (foundAsin) {
          const byAsin = await fetchJson(`/products/${foundAsin}.json`);
          if (!cancelled) setProduct(byAsin);
          return;
        }

        throw new Error("Product not found");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load product");
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
   ORDER COMPLETE (NEW ROUTE TARGET)
   ============================ */
function OrderComplete() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="bg-white border border-[#d5dbdb] rounded p-6">
        <div className="text-[22px] font-bold text-[#0F1111]">Order complete</div>
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
          <a href="/shop" className="text-[#007185] hover:underline text-[13px]">
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
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "search", element: <SearchResultsPage /> },
      { path: "c/*", element: <CategoryPage /> },

      // ✅ ORDERS
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderDetailsPage /> },

      // ✅ ACCOUNT (TOP-LEVEL)
      { path: "account", element: <AccountPage /> },

      // Brand
      { path: "about", element: <AboutUs /> },
      { path: "careers", element: <Careers /> },
      { path: "press", element: <Press /> },
      { path: "sustainability", element: <Sustainability /> },
      { path: "newsletter", element: <Newsletter /> },
      { path: "signup", element: <SignupPage /> },
      { path: "login", element: <LoginPage /> },

      // Help
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
        ],
      },

      // PDP
      {
        path: "p/:id",
        element: (
          <ProductRoute>
            <SingleProduct />
          </ProductRoute>
        ),
      },

      // Cart / Checkout
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "cart-sidebar", element: <CartSidebar /> },

      // ✅ ORDER COMPLETE (NEW)
      { path: "order-complete", element: <OrderComplete /> },

      // Comparison
      { path: "product-comparison", element: <ProductComparison /> },

      // Fallbacks
      { path: "single-product", element: <Navigate to="/shop" replace /> },
      { path: "*", element: <Shop /> },
    ],
  },
]);

/* ============================
   APP EXPORT
   ============================ */
export const App = () => {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
};

export default App;















