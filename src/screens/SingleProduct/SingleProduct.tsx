import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

/* ============================
   Sections
   ============================ */
import * as ProductHeroModule from "./sections/ProductHeroSection";
import * as BreadcrumbModule from "./sections/ProductBreadcrumb";
import ProductDetailsSectionImpl from "./sections/ProductDetailsSection/ProductDetailsSection";

/* ============================
   Rufus Assistant (CORRECT PATHS)
   ============================ */
import {
  AssistantContextProvider,
} from "../../components/RufusAssistant/AssistantContext";
import AssistantDrawer from "../../components/RufusAssistant/AssistantDrawer";

/* ============================
   PDP Context (CORRECT PATH)
   ============================ */
import { ProductPdpProvider } from "../../pdp/ProductPdpContext";

/* ============================
   R2 CONFIG (TEMP INLINE)
   ============================ */
const R2_BASE =
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

/* ============================
   Helpers
   ============================ */
function pick<T = any>(mod: any, named: string): T {
  return (mod?.[named] ?? mod?.default) as T;
}

/* ============================
   Sections resolved safely
   ============================ */
const ProductHeroSection = pick<any>(
  ProductHeroModule,
  "ProductHeroSection"
);
const ProductBreadcrumb = pick<any>(
  BreadcrumbModule,
  "ProductBreadcrumb"
);
const ProductDetailsSection = ProductDetailsSectionImpl;

/* ============================
   Inner PDP Renderer
   ============================ */
function SingleProductInner() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        setProduct(null);

        if (!id) throw new Error("Missing product id");

        /* ============================
           LOAD PRODUCT INDEX (R2)
           ============================ */
        const indexRes = await fetch(
          `${R2_BASE}/indexes/_index.json`,
          { cache: "no-store" }
        );

        const indexText = await indexRes.text();

        if (indexText.trim().startsWith("<")) {
          throw new Error("Index returned HTML");
        }

        const index = JSON.parse(indexText);
        const entry = index.find((p: any) => p.slug === id);

        if (!entry?.path) {
          throw new Error("Product not found in index");
        }

        /* ============================
           LOAD PRODUCT JSON (R2)
           ============================ */
        const res = await fetch(
          `${R2_BASE}/${entry.path}`,
          { cache: "no-store" }
        );

        const text = await res.text();

        if (text.trim().startsWith("<")) {
          throw new Error("Expected JSON but received HTML");
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = JSON.parse(text);
        if (!cancelled) setProduct(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Product failed to load");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, location.key]);

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="border border-red-300 bg-red-50 text-red-800 rounded p-4">
          <div className="font-semibold">Product failed to load</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 text-sm text-gray-600">
        Loading product…
      </div>
    );
  }

  return (
    <ProductPdpProvider product={product}>
      <div className="w-full">
        {ProductBreadcrumb ? <ProductBreadcrumb /> : null}
        {ProductHeroSection ? <ProductHeroSection /> : null}
        {ProductDetailsSection ? <ProductDetailsSection /> : null}

        {/* Rufus assistant (drawer only) */}
        <AssistantDrawer />
      </div>
    </ProductPdpProvider>
  );
}

/* ============================
   Outer Provider Wrapper
   ============================ */
export function SingleProduct() {
  return (
    <AssistantContextProvider>
      <SingleProductInner />
    </AssistantContextProvider>
  );
}

export default SingleProduct;






