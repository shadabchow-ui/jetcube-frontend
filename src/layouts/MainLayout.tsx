import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { CartSidebar } from "../screens/CartSidebar";
import { useCart } from "../context/CartContext";

/* IMPORTANT:
   Use NAV + FOOTER from Shop sections FOR NOW
   but MainLayout itself remains page-agnostic
*/
import { NavigationSection } from "../screens/Shop/sections/NavigationSection";
import { FooterSection } from "../screens/Shop/sections/FooterSection";

export default function MainLayout() {
  const { isOpen } = useCart();

  useEffect(() => {
    const handler = (e: any) => {
      alert(e?.detail?.message || "Added to cart");
    };
    window.addEventListener("cart:toast", handler as any);
    return () => window.removeEventListener("cart:toast", handler as any);
  }, []);

  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <NavigationSection />

      <main className="flex-1">
        <Outlet />
      </main>

      <FooterSection />

      {isOpen && <CartSidebar />}
    </div>
  );
}




