import React from "react";
import { FilterSection } from "./sections/FilterSection";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { NavigationSection } from "./sections/NavigationSection";
import { ProductGridSection } from "./sections/ProductGridSection";
import { SupportSection } from "./sections/SupportSection";

export const Shop = (): JSX.Element => {
  return (
    <div
      className="bg-white overflow-hidden w-full min-w-[1440px] relative"
      data-model-id="117:538"
    >
      <NavigationSection />
      <HeaderSection />
      <SupportSection />
      <ProductGridSection />
      <FilterSection />
      <FooterSection />
    </div>
  );
};
export default Shop;
