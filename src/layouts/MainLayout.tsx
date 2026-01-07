import React, { useEffect } from "react";
import { Outlet, useLocation, matchPath } from "react-router-dom";
import { CartSidebar } from "../screens/CartSidebar";
import { useCart } from "../context/CartContext";

import { NavigationSection } from "../screens/Shop/sections/NavigationSection";
import { FooterSection } from "../screens/Shop/sections/FooterSection";

export default function MainLayout() {
  const { isOpen } = useCart();
  const { pathname } = useLocation();

  const enableSearchBootstrap =
    pathname === "/search" || !!matchPath("/c/*", pathname);

  useEffect(() => {
    const handler = (e: any) => {
      alert(e?.detail?.message || "Added to cart");
    };
    window.addEventListener("cart:toast", handler as any);
    return () => window.removeEventListener("cart:toast", handler as any);
  }, []);

  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <NavigationSection enableSearchBootstrap={enableSearchBootstrap} />

      <main className="flex-1">
        <Outlet />
      </main>

      <FooterSection />

      {isOpen && <CartSidebar />}
    </div>
  );
}





