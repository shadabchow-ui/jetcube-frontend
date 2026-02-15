import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const el =
  document.getElementById("app") ||
  document.getElementById("root");

if (!el) {
  throw new Error(
    'Root container missing: expected <div id="app"></div> or <div id="root"></div> in index.html',
  );
}

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
); 



