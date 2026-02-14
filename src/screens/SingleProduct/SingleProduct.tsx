import React from "react";
import ProductBreadcrumb from "./sections/ProductBreadcrumb";
import { ProductHeroSection } from "./sections/ProductHeroSection";
import { ProductDetailsSection } from "./sections/ProductDetailsSection";
import { RelatedProductsSection, CustomersAlsoViewedSection } from "./sections/RelatedProductsSection/RelatedProductsSection";
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
      <ProductDetailsSection />
      <RelatedProductsSection />
      <CustomersAlsoViewedSection />
      <FooterSection />
    </>
  );
} 






























