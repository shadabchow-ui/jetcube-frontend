import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css"; // ✅ REQUIRED

const el = document.getElementById("app");
if (!el) {
  throw new Error(
    'Root container missing: expected <div id="app"></div> in index.html',
  );
}

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);



