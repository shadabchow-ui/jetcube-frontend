import React from "react";

/* ============================
   Sections
   ============================ */
import * as ProductHeroModule from "./sections/ProductHeroSection";
import * as BreadcrumbModule from "./sections/ProductBreadcrumb";
import ProductDetailsSectionImpl from "./sections/ProductDetailsSection/ProductDetailsSection";

/* ============================
   Rufus Assistant (CORRECT PATHS)
   ============================ */
import { AssistantContextProvider } from "../../components/RufusAssistant/AssistantContext";
import AssistantDrawer from "../../components/RufusAssistant/AssistantDrawer";

/* ============================
   Helper: pick named export if it exists, else default
   ============================ */
function pick<T = any>(mod: any, named: string): T {
  return (mod?.[named] ?? mod?.default) as T;
}

/* ============================
   Sections resolved safely
   ============================ */
const ProductHeroSection = pick<any>(ProductHeroModule, "ProductHeroSection");
const ProductBreadcrumb = pick<any>(BreadcrumbModule, "ProductBreadcrumb");
const ProductDetailsSection = ProductDetailsSectionImpl;

/* ============================
   PDP Screen
   NOTE:
   - No fetching here.
   - Product is loaded by App.tsx ProductRoute and provided via ProductPdpProvider context.
   ============================ */
export function SingleProduct() {
  return (
    <AssistantContextProvider>
      <div className="w-full">
        {ProductBreadcrumb ? <ProductBreadcrumb /> : null}
        {ProductHeroSection ? <ProductHeroSection /> : null}
        {ProductDetailsSection ? <ProductDetailsSection /> : null}

        {/* Rufus assistant (drawer only) */}
        <AssistantDrawer />
      </div>
    </AssistantContextProvider>
  );
}

export default SingleProduct;









