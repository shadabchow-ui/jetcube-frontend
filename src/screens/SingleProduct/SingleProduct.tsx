import React from "react";
import ProductBreadcrumb from "./sections/ProductBreadcrumb";
import { ProductHeroSection } from "./sections/ProductHeroSection";

// ✅ Build-fix: import ONLY the default export from ProductDetailsSection.
// We do not rely on named section exports (AboutThisItemSection, etc.).
import ProductDetailsSection from "./sections/ProductDetailsSection";

import {
  RelatedProductsSection,
  CustomersAlsoViewedSection,
} from "./sections/RelatedProductsSection/RelatedProductsSection";
import { FooterSection } from "./sections/FooterSection";

/**
 * SingleProduct — PDP page shell.
 *
 * Product data is already loaded by <ProductRoute> in App.tsx and provided
 * via <ProductPdpProvider product={…}>. Every section below calls
 * useProductPdp() to get the product object.
 *
 * ⚠️  DO NOT add fetch logic here — it's handled by ProductRoute.
 */
export default function SingleProduct() {
  return (
    <>
      <ProductBreadcrumb />
      <ProductHeroSection />

      {/* Sticky anchor tabs (simple <a href="#...">, no scroll-spy) */}
      {/* Note: section-level anchors should live inside ProductDetailsSection. */}
      <div className="sticky top-0 z-30 bg-white border-b border-black/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <nav className="flex gap-4 sm:gap-6 overflow-x-auto py-3 text-sm whitespace-nowrap">
            <a href="#about" className="text-gray-700 hover:text-gray-900">
              About this item
            </a>
            <a href="#details" className="text-gray-700 hover:text-gray-900">
              Product details
            </a>
            <a href="#aplus" className="text-gray-700 hover:text-gray-900">
              From the brand
            </a>
            <a href="#reviews" className="text-gray-700 hover:text-gray-900">
              Reviews
            </a>
          </nav>
        </div>
      </div>

      {/* Below-the-fold sections */}
      <div className="max-w-[1200px] mx-auto">
        {/* ProductDetailsSection is responsible for rendering:
            - About this item (bullets) with id="about"
            - Product details/specs with id="details"
            - A+ / brand content with id="aplus"
            - Videos (optional)
            - Reviews with id="reviews"
           Keeping everything in one module avoids build-breaks from missing named exports.
        */}
        <ProductDetailsSection />

        {/* Render these ONLY once (prefer here, not inside ProductDetailsSection) */}
        <RelatedProductsSection />
        <CustomersAlsoViewedSection />
      </div>

      <FooterSection />
    </>
  );
}
