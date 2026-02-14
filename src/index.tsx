import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const mount = document.getElementById("app");

if (!mount) {
  throw new Error('Root container "#app" missing in index.html');
}

createRoot(mount).render(
  <StrictMode>
    <App />
  </StrictMode>
);


