import React, { Suspense } from "react";
import { RouterProvider, createBrowserRouter, Outlet, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import "./App.css";

/**
 * Providers / global context
 */
import { CartProvider } from "./context/CartContext";
import { AssistantProvider } from "./context/AssistantContext";
import { ProductProvider } from "./context/ProductContext";

/**
 * Core pages
 */
import HomePage from "./pages/HomePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import ProductCategoryPage from "./pages/ProductCategory";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import ReturnsPage from "./pages/ReturnsPage";
import WishlistPage from "./pages/WishlistPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AccountPage from "./pages/AccountPage";

/**
 * Screens (Anima / layout-driven)
 */
import Shop from "./screens/Shop";
import CategoryPage from "./screens/category/CategoryPage";
import Cart from "./screens/Cart";
import CartSidebar from "./screens/CartSidebar";
import Checkout from "./screens/Checkout";

/**
 * Help / legal pages (they live under src/pages/help)
 */
import HelpIndex from "./pages/help/HelpIndex";
import OrdersHelp from "./pages/help/Orders";
import ReturnsHelp from "./pages/help/Returns";
import ShippingHelp from "./pages/help/Shipping";
import PaymentsHelp from "./pages/help/Payments";
import NewsletterHelp from "./pages/help/Newsletter";
import CustomerServiceHelp from "./pages/help/CustomerService";
import ContactUsHelp from "./pages/help/Contact";
import AccessibilityStatement from "./pages/help/Accessibility";
import PrivacyPolicy from "./pages/help/PrivacyNotice";
import CookiePolicy from "./pages/help/CookiePolicy";
import TermsOfUse from "./pages/help/ConditionsOfUse";
import Disclaimer from "./pages/help/Disclosure";
import AboutVentari from "./pages/help/AboutVentari";

/**
 * Scroll helper
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

/**
 * Lazy loader that supports both:
 *  - default exports, and
 *  - named exports (common in Anima screens)
 */
function lazyCompat<T extends Record<string, any>>(
  loader: () => Promise<T>,
  exportNames: string[]
): React.LazyExoticComponent<React.ComponentType<any>> {
  return React.lazy(async () => {
    const mod = await loader();

    // Prefer default if present
    if ("default" in mod && mod.default) {
      return { default: mod.default };
    }

    // Otherwise try known named exports
    for (const name of exportNames) {
      if (name in mod) {
        return { default: (mod as any)[name] };
      }
    }

    // Fall back to first export (best-effort) to avoid hard crashes in dev
    const first = Object.values(mod)[0];
    if (first) return { default: first as any };

    throw new Error(`lazyCompat: could not find any of [${exportNames.join(", ")}] in module`);
  });
}

/**
 * Screens that are (or may become) named-export-only.
 * We keep these lazy to reduce bundle size and to avoid "default export" mismatches.
 */
const ProductComparison = lazyCompat(() => import("./screens/ProductComparison"), [
  "ProductComparison",
  "default",
]);

const SingleProduct = lazyCompat(() => import("./screens/SingleProduct"), [
  "SingleProduct",
  "default",
]);

/**
 * Shared layout wrapper for nested routes.
 * (Keeps providers mounted once.)
 */
function AppShell() {
  return (
    <HelmetProvider>
      <CartProvider>
        <AssistantProvider>
          <ProductProvider>
            <Outlet />
          </ProductProvider>
        </AssistantProvider>
      </CartProvider>
    </HelmetProvider>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      // Home
      { index: true, element: <HomePage /> },

      // Catalog / browsing
      { path: "shop", element: <Shop /> },
      { path: "shop/:categorySlug", element: <Shop /> },

      // Category pages (different layouts in your repo)
      { path: "category/:categorySlug", element: <CategoryPage /> },
      { path: "c/:categorySlug", element: <ProductCategoryPage /> },

      // Search
      { path: "search", element: <SearchResultsPage /> },

      // PDP / compare
      { path: "p/:slug", element: <SingleProduct /> },
      { path: "compare", element: <ProductComparison /> },

      // Cart / checkout
      { path: "cart", element: <Cart /> },
      { path: "cart-sidebar", element: <CartSidebar /> },
      { path: "checkout", element: <Checkout /> },

      // Account
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "account", element: <AccountPage /> },

      // Orders / returns / wishlist
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderDetailsPage /> },
      { path: "returns", element: <ReturnsPage /> },
      { path: "wishlist", element: <WishlistPage /> },

      // Help hub + help articles
      { path: "help", element: <HelpIndex /> },
      { path: "help/orders", element: <OrdersHelp /> },
      { path: "help/returns", element: <ReturnsHelp /> },
      { path: "help/shipping", element: <ShippingHelp /> },
      { path: "help/payments", element: <PaymentsHelp /> },
      { path: "help/newsletter", element: <NewsletterHelp /> },
      { path: "help/customer-service", element: <CustomerServiceHelp /> },
      { path: "help/contact", element: <ContactUsHelp /> },

      // Legal (canonical URLs) mapped to pages that actually exist
      { path: "accessibility", element: <AccessibilityStatement /> },
      { path: "privacy", element: <PrivacyPolicy /> },
      { path: "privacy-policy", element: <PrivacyPolicy /> },
      { path: "cookie-policy", element: <CookiePolicy /> },
      { path: "terms", element: <TermsOfUse /> },
      { path: "conditions-of-use", element: <TermsOfUse /> },
      { path: "disclaimer", element: <Disclaimer /> },
      { path: "about", element: <AboutVentari /> },

      // 404
      { path: "*", element: <div className="p-8 text-center text-sm">Page not found.</div> },
    ],
  },
]);

export default function App(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center text-sm opacity-70">
          Loading…
        </div>
      }
    >
      <ScrollToTop />
      <RouterProvider router={router} />
    </Suspense>
  );
}
