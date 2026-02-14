// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // keep your existing CSS import(s)

const el = document.getElementById("app");
if (!el) {
  throw new Error('Root container missing. Expected <div id="app"></div> in index.html');
}

ReactDOM.createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



