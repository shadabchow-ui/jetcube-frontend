import React from "react";
import ProductBreadcrumb from "./sections/ProductBreadcrumb";
import { ProductHeroSection } from "./sections/ProductHeroSection";

// ✅ Build-fix: ONLY import the default export.
// This avoids missing named exports like AboutThisItemSection.
import ProductDetailsSection from "./sections/ProductDetailsSection";

import {
  RelatedProductsSection,
  CustomersAlsoViewedSection,
} from "./sections/RelatedProductsSection/RelatedProductsSection";
import { FooterSection } from "./sections/FooterSection";

export default function SingleProduct() {
  return (
    <>
      <ProductBreadcrumb />
      <ProductHeroSection />

      {/* Optional sticky anchor tabs (anchors should exist in ProductDetailsSection) */}
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

      <div className="max-w-[1200px] mx-auto">
        <ProductDetailsSection />
        <RelatedProductsSection />
        <CustomersAlsoViewedSection />
      </div>

      <FooterSection />
    </>
  );
}
