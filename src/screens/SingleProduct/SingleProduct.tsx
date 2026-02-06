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
   Types
   ============================ */
type SingleProductProps = {
  product: any; // keep as-is; upstream data may be flexible
};

export function SingleProduct({ product }: SingleProductProps) {
  const ProductHeroSection =
    (ProductHeroModule as any).default ?? (ProductHeroModule as any).ProductHeroSection;
  const ProductBreadcrumb =
    (BreadcrumbModule as any).default ?? (BreadcrumbModule as any).ProductBreadcrumb;

  return (
    <AssistantContextProvider>
      <div className="min-h-screen">
        {/* Breadcrumb */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
          {ProductBreadcrumb ? <ProductBreadcrumb product={product} /> : null}
        </div>

        {/* Hero */}
        <div className="px-4 sm:px-6 lg:px-8 pt-2">
          {ProductHeroSection ? <ProductHeroSection product={product} /> : null}
        </div>

        {/* Details */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          <ProductDetailsSectionImpl product={product} />
        </div>

        {/* Assistant Drawer */}
        <AssistantDrawer />
      </div>
    </AssistantContextProvider>
  );
}

export default SingleProduct;











