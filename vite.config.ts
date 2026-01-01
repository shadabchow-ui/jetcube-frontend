import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { screenGraphPlugin } from "@animaapp/vite-plugin-screen-graph";
import tailwind from "tailwindcss";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "development" && screenGraphPlugin(),
  ],

  // 🔑 STATIC IS SERVED FROM ROOT
  publicDir: "static",

  base: "/",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@pdp": path.resolve(__dirname, "src/pdp"),
    },
  },

  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
}));












