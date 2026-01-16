import "./App.css";
import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { Menu, Search, ShoppingCart, User, Heart, Shield, Truck, RefreshCw, FileText, ExternalLink } from "lucide-react";

import { useCart } from "./context/CartContext";
import { useWishlist } from "./context/WishlistContext";

import Home from "./pages/Home";
import SearchResultsPage from "./pages/SearchResultsPage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import AccessibilityPage from "./pages/AccessibilityPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";

import ShopHub from "./pages/ShopHub";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import OrdersPage from "./pages/OrdersPage";

// IMPORTANT: CategoryPage is a default export in its module.
// Some bundlers may wrap it; we normalize below.
import CategoryPageModule from "./pages/CategoryPage";
const CategoryPage: React.FC = (CategoryPageModule as any).default
  ? (CategoryPageModule as any).default
  : (CategoryPageModule as any);

function TopNav() {
  const { items } = useCart();
  const { wishlistCount } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();

  const [q, setQ] = useState("");

  useEffect(() => {
    // Clear search box when navigating
    setQ("");
  }, [location.pathname]);

  const cartCount = useMemo(() => items.reduce((sum, it) => sum + (it.qty || 1), 0), [items]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="topnav">
      <div className="topnav-inner">
        <div className="left">
          <button
            className="burger"
            aria-label="Open menu"
            onClick={() => window.dispatchEvent(new CustomEvent("ventari:open-menu"))}
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="brand" aria-label="Ventari Home">
            <span className="brand-mark">v</span>
          </Link>
        </div>

        <form className="search" onSubmit={onSubmit}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Ventari"
            aria-label="Search"
          />
          <button type="submit" aria-label="Search">
            <Search size={18} />
          </button>
        </form>

        <div className="right">
          <button className="icon-btn" onClick={() => navigate("/orders")} aria-label="Account">
            <User size={20} />
            <span className="icon-label">Account</span>
          </button>

          <button className="icon-btn" onClick={() => navigate("/wishlist")} aria-label="Wishlist">
            <Heart size={20} />
            <span className="badge">{wishlistCount}</span>
          </button>

          <button className="icon-btn" onClick={() => navigate("/cart")} aria-label="Cart">
            <ShoppingCart size={20} />
            <span className="badge">{cartCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SideMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("ventari:open-menu", onOpen as any);
    return () => window.removeEventListener("ventari:open-menu", onOpen as any);
  }, []);

  if (!open) return null;

  return (
    <div className="sidemenu-overlay" onClick={() => setOpen(false)}>
      <div className="sidemenu" onClick={(e) => e.stopPropagation()}>
        <div className="sidemenu-header">
          <div className="sidemenu-title">Menu</div>
          <button className="close" onClick={() => setOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/shop");
          }}
        >
          Shop
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/wishlist");
          }}
        >
          Wishlist
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/orders");
          }}
        >
          Orders
        </button>

        <div className="sidemenu-divider" />

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/help/conditions-of-use");
          }}
        >
          Conditions of Use
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/help/privacy-notice");
          }}
        >
          Privacy Notice
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/help/cookie-policy");
          }}
        >
          Cookie Policy
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/help/accessibility");
          }}
        >
          Accessibility
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/help/terms");
          }}
        >
          Terms and Conditions
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/help/disclaimer");
          }}
        >
          Disclaimer
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/help/contact");
          }}
        >
          Contact
        </button>

        <button
          className="sidemenu-item"
          onClick={() => {
            setOpen(false);
            navigate("/help/about");
          }}
        >
          About
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-cols">
          <div className="footer-col">
            <h4>Get to Know Us</h4>
            <Link to="/help/about">About Ventari</Link>
            <Link to="/help/accessibility">Accessibility</Link>
            <Link to="/help/contact">Contact Ventari</Link>
          </div>

          <div className="footer-col">
            <h4>Shopping Confidence</h4>
            <Link to="/help/privacy-notice">Privacy Notice</Link>
            <Link to="/help/conditions-of-use">Conditions of Use</Link>
            <Link to="/help/terms">Terms and Conditions</Link>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/help/disclaimer">Disclaimer</Link>
            <Link to="/help/cookie-policy">Cookie Policy</Link>
          </div>

          <div className="footer-col">
            <h4>Discover & Experience</h4>
            <Link to="/shop">Shop</Link>
            <Link to="/search?q=">Search</Link>
            <Link to="/shop#categories">Categories</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-links">
            <Link to="/help/conditions-of-use">Conditions of Use</Link>
            <Link to="/help/privacy-notice">Privacy Notice</Link>
            <Link to="/help/cookie-policy">Your Ads Privacy Choices</Link>
          </div>
          <div className="footer-copy">© 2026 Ventari. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

function MainLayout() {
  return (
    <div className="app-shell">
      <TopNav />
      <SideMenu />
      <div className="app-content">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function OrdersEmpty() {
  return (
    <div className="page">
      <div className="page-inner">
        <h1>Your Orders</h1>
        <p className="muted">You don’t have any orders yet.</p>

        <div className="card">
          <div className="card-row">
            <Truck size={18} />
            <div>
              <div className="card-title">Track packages</div>
              <div className="card-subtitle">When you place an order, tracking appears here.</div>
            </div>
          </div>
          <div className="card-row">
            <Shield size={18} />
            <div>
              <div className="card-title">Order support</div>
              <div className="card-subtitle">Returns, refunds, and help with issues.</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <Link to="/shop" className="btn">
            Start shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrderComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const orderId = params.get("order_id") || "";
  const total = params.get("total") || "";
  const currency = params.get("currency") || "USD";
  const last4 = params.get("last4") || "";
  const brand = params.get("brand") || "Card";

  return (
    <div className="page">
      <div className="page-inner">
        <div className="success-hero">
          <div className="success-badge">Payment successful</div>
          <h1>Thanks for your order</h1>
          <p className="muted">
            Your payment was processed successfully. You’ll see your order details below.
          </p>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="kv">
            <div className="k">Order ID</div>
            <div className="v mono">{orderId || "—"}</div>
          </div>

          <div className="kv">
            <div className="k">Total</div>
            <div className="v">
              {total ? `${Number(total).toFixed(2)} ${currency}` : "—"}
            </div>
          </div>

          <div className="kv">
            <div className="k">Payment</div>
            <div className="v">
              {brand} {last4 ? `•••• ${last4}` : ""}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-row">
            <FileText size={18} />
            <div>
              <div className="card-title">What’s next?</div>
              <div className="card-subtitle">
                If you need help, contact support and include your order ID.
              </div>
            </div>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn" onClick={() => navigate("/orders")}>
            View orders
          </button>
          <button className="btn secondary" onClick={() => navigate("/shop")}>
            Keep shopping
          </button>
        </div>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },

      // Shop Hub (All Departments)
      { path: "shop", element: <ShopHub /> },

      // Search
      { path: "search", element: <SearchResultsPage /> },

      // Category pages
      { path: "c/*", element: <CategoryPage /> },

      // Product pages
      { path: "p/:slug", element: <ProductPage /> },

      // Cart / Checkout
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },

      // Wishlist / Orders
      { path: "wishlist", element: <WishlistPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/empty", element: <OrdersEmpty /> },
      { path: "order-complete", element: <OrderComplete /> },

      // Help / Legal
      { path: "help/about", element: <AboutPage /> },
      { path: "help/contact", element: <ContactPage /> },
      { path: "help/privacy-notice", element: <PrivacyPolicyPage /> },
      { path: "help/conditions-of-use", element: <TermsPage /> },
      { path: "help/terms", element: <TermsPage /> },
      { path: "help/disclaimer", element: <DisclaimerPage /> },
      { path: "help/accessibility", element: <AccessibilityPage /> },
      { path: "help/cookie-policy", element: <CookiePolicyPage /> },

      // Fallback: treat unknown routes as category routes (legacy /<category-path>)
      { path: "*", element: <CategoryPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
