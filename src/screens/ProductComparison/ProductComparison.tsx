import React from "react";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { ProductComparisonSection } from "./sections/ProductComparisonSection";
import { ProductFeaturesSection } from "./sections/ProductFeaturesSection";
import { WarrantyInformationSection } from "./sections/WarrantyInformationSection";

export const ProductComparison = (): JSX.Element => {
  return (
    <main
      className="bg-white overflow-hidden w-full min-w-[1440px] flex flex-col"
      data-model-id="117:641"
    >
      <HeaderSection />
      <ProductComparisonSection />
      <WarrantyInformationSection />
      <ProductFeaturesSection />
      <FooterSection />
    </main>
  );
};
