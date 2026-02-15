import React, { useEffect, useState } from "react";
import { createBrowserRouter, Navigate, RouterProvider, useParams } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HelpLayout from "./layouts/HelpLayout";

import Home from "./screens/Home";
import Shop from "./screens/Shop/Shop";
import ShopAllCategories from "./screens/Shop/ShopAllCategories";
import CategoryPage from "./screens/category/CategoryPage";

import Cart from "./screens/Cart";
import CartSidebar from "./screens/CartSidebar/CartSidebar";
import ProductComparison from "./screens/ProductComparison/ProductComparison";
import SingleProduct from "./screens/SingleProduct/SingleProduct";

import SearchResultsPage from "./pages/SearchResultsPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetail from "./pages/OrderDetailsPage";
import ReturnsPage from "./pages/ReturnsPage";
import AccountPage from "./pages/AccountPage";

// Help / Legal pages (case-sensitive file names)
import HelpIndex from "./pages/help/HelpIndex";
import ReturnsHelp from "./pages/help/Returns";
import ShippingHelp from "./pages/help/Shipping";
import PaymentsHelp from "./pages/help/Payments";
import NewsletterHelp from "./pages/help/Newsletter";
import AboutUs from "./pages/help/AboutUs";
import Careers from "./pages/help/Careers";
import Sustainability from "./pages/help/Sustainability";
import Press from "./pages/help/Press";
import DevicesHelp from "./pages/help/Devices";
import ProductSafetyHelp from "./pages/help/ProductSafety";
import ConsumerDataHelp from "./pages/help/ConsumerData";
import AdsPrivacy from "./pages/help/AdsPrivacy";
import ContactHelp from "./pages/help/Contact";
import Terms from "./pages/help/ConditionsOfUse";
import PrivacyPolicy from "./pages/help/PrivacyNotice";
import CookiePolicy from "./pages/help/cookiepolicy";
import AccessibilityStatement from "./pages/help/Accessibility";

import { CartProvider } from "./context/CartContext";
import { AssistantProvider } from "./components/RufusAssistant/AssistantContext";

/* ============================
   Product fetch helpers
============================ */

// IMPORTANT: set this to your public R2 custom domain
const R2_PUBLIC_BASE = "https://r2.ventari.net";

// Index locations (these are being served successfully in your screenshot)
const PDP_MAP_URLS = [
  `${R2_PUBLIC_BASE}/indexes/pdp_path_map.json`,
  `${R2_PUBLIC_BASE}/indexes/pdp_path_map.json.gz`,
];

type PdpPathMap = Record<string, string>;

async function fetchJsonMaybeGz(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  // If it's .gz, we still expect the server to transparently serve decompressed JSON
  // OR your fetch layer handles it. If not, you must only use non-gz.
  // Your current network shows .json 404 and .json.gz 200, so we try both.
  const text = await res.text();
  return JSON.parse(text);
}

let _pdpMapPromise: Promise<PdpPathMap> | null = null;
async function getPdpPathMap(): Promise<PdpPathMap> {
  if (_pdpMapPromise) return _pdpMapPromise;

  _pdpMapPromise = (async () => {
    let lastErr: any = null;
    for (const url of PDP_MAP_URLS) {
      try {
        const json = await fetchJsonMaybeGz(url);
        return json as PdpPathMap;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr ?? new Error("Failed to load pdp_path_map");
  })();

  return _pdpMapPromise;
}

async function fetchProductBySlug(slug: string) {
  const map = await getPdpPathMap();
  const relPath = map[slug];

  const tried: string[] = [];
  if (relPath) {
    const url1 = `${R2_PUBLIC_BASE}/${relPath}`;
    tried.push(url1);
    try {
      const r = await fetch(url1);
      if (r.ok) return await r.json();
    } catch {}
    const url2 = `${R2_PUBLIC_BASE}/${relPath}.gz`;
    tried.push(url2);
    try {
      const r = await fetch(url2);
      if (r.ok) {
        const txt = await r.text();
        return JSON.parse(txt);
      }
    } catch {}
  }

  // fallback: try direct key convention
  const direct1 = `${R2_PUBLIC_BASE}/products/${slug}.json`;
  tried.push(direct1);
  try {
    const r = await fetch(direct1);
    if (r.ok) return await r.json();
  } catch {}

  const direct2 = `${R2_PUBLIC_BASE}/products/${slug}.json.gz`;
  tried.push(direct2);
  try {
    const r = await fetch(direct2);
    if (r.ok) {
      const txt = await r.text();
      return JSON.parse(txt);
    }
  } catch {}

  throw new Error(`Product not found. Tried: ${tried.join(", ")}`);
}

/* ============================
   Route wrappers
============================ */

function ProductRoute() {
  const { slug } = useParams();

  const [product, setProduct] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setProduct(null);
    setErr(null);

    (async () => {
      try {
        if (!slug) throw new Error("Missing slug");
        const data = await fetchProductBySlug(slug);
        if (!mounted) return;
        setProduct(data);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || String(e));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (err) {
    return (
      <div style={{ padding: 24, color: "red" }}>
        {err}
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 24 }}>
        Loading…
      </div>
    );
  }

  return <SingleProduct product={product} />;
}

/* ============================
   Router
============================ */

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "shopall", element: <ShopAllCategories /> },
      { path: "shopallcategories", element: <ShopAllCategories /> },

      { path: "p/:slug", element: <ProductRoute /> },

      { path: "search", element: <SearchResultsPage /> },
      { path: "s", element: <SearchResultsPage /> },
      { path: "list", element: <SearchResultsPage /> },

      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Cart /> },
      { path: "cart-sidebar", element: <CartSidebar /> },

      { path: "product-comparison", element: <ProductComparison /> },

      { path: "category/:category", element: <CategoryPage /> },
      { path: "category/:category/:subcategory", element: <CategoryPage /> },
      { path: "product-category", element: <CategoryPage /> },

      { path: "signup", element: <SignupPage /> },
      { path: "login", element: <LoginPage /> },

      { path: "orders", element: <OrdersPage /> },
      { path: "order/:orderId", element: <OrderDetail /> },
      { path: "returns", element: <ReturnsPage /> },
      { path: "account", element: <AccountPage /> },

      // Footer top-level links
      { path: "about", element: <AboutUs /> },
      { path: "newsletter", element: <NewsletterHelp /> },
      { path: "careers", element: <Careers /> },
      { path: "sustainability", element: <Sustainability /> },
      { path: "press", element: <Press /> },

      // Optional top-level legal aliases (keep if something links here)
      { path: "terms", element: <Terms /> },
      { path: "privacy", element: <PrivacyPolicy /> },
      { path: "accessibility", element: <AccessibilityStatement /> },
      { path: "cookiepolicy", element: <CookiePolicy /> },
      { path: "your-ads-privacy-choices", element: <AdsPrivacy /> },
    ],
  },

  {
    path: "/help",
    element: <HelpLayout />,
    children: [
      { path: "", element: <HelpIndex /> },

      { path: "returns", element: <ReturnsHelp /> },
      { path: "shipping", element: <ShippingHelp /> },
      { path: "payments", element: <PaymentsHelp /> },
      { path: "newsletter", element: <NewsletterHelp /> },

      // No CustomerService page exists in this repo; route to HelpIndex as the hub
      { path: "customerservice", element: <HelpIndex /> },
      { path: "customer-service", element: <HelpIndex /> },

      // Footer / legal links (these ARE in your repo)
      { path: "contact", element: <ContactHelp /> },
      { path: "accessibility", element: <AccessibilityStatement /> },
      { path: "cookiepolicy", element: <CookiePolicy /> },
      { path: "conditions-of-use", element: <Terms /> },
      { path: "privacy-notice", element: <PrivacyPolicy /> },
      { path: "ads-privacy", element: <AdsPrivacy /> },
      { path: "devices", element: <DevicesHelp /> },
      { path: "product-safety", element: <ProductSafetyHelp /> },
      { path: "consumer-data", element: <ConsumerDataHelp /> },
    ],
  },

  // fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <AssistantProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AssistantProvider>
  );
}
