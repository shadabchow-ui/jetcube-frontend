import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CartProvider } from "./context/CartContext";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root container missing in index.html");
}

createRoot(root).render(
  <StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>
);

