import React from "react";
import ProductBreadcrumb from "./sections/ProductBreadcrumb";
import { ProductHeroSection } from "./sections/ProductHeroSection";

// PATCH: Use existing section components from the same module (no new data/loaders).
// If your ./sections/ProductDetailsSection file exports these named components, this will work as-is.
// If any export names differ, keep the structure below and align the names in that module (not here).
import {
  AboutThisItemSection,
  ProductDetailsSectionInner,
  FromTheBrandSection,
  VideosSection,
  CustomerReviewsSection,
} from "./sections/ProductDetailsSection";

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
      <div className="sticky top-0 z-30 bg-white border-b border-black/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <nav className="flex gap-4 sm:gap-6 overflow-x-auto py-3 text-sm whitespace-nowrap">
            <a
              href="#about"
              className="text-gray-700 hover:text-gray-900"
            >
              About this item
            </a>
            <a
              href="#details"
              className="text-gray-700 hover:text-gray-900"
            >
              Product details
            </a>
            <a
              href="#aplus"
              className="text-gray-700 hover:text-gray-900"
            >
              From the brand
            </a>
            <a
              href="#reviews"
              className="text-gray-700 hover:text-gray-900"
            >
              Reviews
            </a>
          </nav>
        </div>
      </div>

      {/* Below-the-fold sections in Amazon-style order */}
      <div className="max-w-[1200px] mx-auto">
        {/* Anchor targets + scroll offset so sticky tabs don't cover headings */}
        <div id="about" className="scroll-mt-24" />
        <AboutThisItemSection />

        <div id="details" className="scroll-mt-24" />
        <ProductDetailsSectionInner />

        <div id="aplus" className="scroll-mt-24" />
        <FromTheBrandSection />

        <VideosSection />

        <div id="reviews" className="scroll-mt-24" />
        <CustomerReviewsSection />

        {/* IMPORTANT: Render these ONLY once (prefer here, not inside ProductDetailsSection) */}
        <RelatedProductsSection />
        <CustomersAlsoViewedSection />
      </div>

      <FooterSection />
    </>
  );
}






























