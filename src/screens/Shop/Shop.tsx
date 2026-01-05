import React from "react";
import { ShopHubSection } from "./sections/ShopHubSection";

export const Shop = (): JSX.Element => {
  return (
    <div className="bg-white w-full">
      {/* Shop hub only – no headers, no filters, no grid */}
      <ShopHubSection />
    </div>
  );
};

export default Shop;




