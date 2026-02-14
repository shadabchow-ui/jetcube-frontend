import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CartProvider } from "./context/CartContext";

const mount =
  document.getElementById("root") ||
  document.getElementById("app") ||
  document.getElementById("main");

if (!mount) {
  // Don’t hard-crash; fail gracefully so you can inspect DOM if needed
  console.error("No mount element found. Expected #root or #app or #main.");
} else {
  createRoot(mount).render(
    <StrictMode>
      <CartProvider>
        <App />
      </CartProvider>
    </StrictMode>
  );
}

