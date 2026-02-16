// src/screens/ProductComparison/ProductComparison.tsx
import NavigationSection from "../Shop/sections/NavigationSection";
import { ProductComparisonSection } from "./sections/ProductComparisonSection";
import { QualityAssuranceSection } from "./sections/QualityAssuranceSection";
import { RelatedProductsSection } from "../SingleProduct/sections/RelatedProductsSection";

export const ProductComparison = (): JSX.Element => {
  return (
    <div className="product-comparison">
      <div className="div-9">
        <NavigationSection />
        <ProductComparisonSection />
        <QualityAssuranceSection />
        <RelatedProductsSection />
      </div>
    </div>
  );
};

export default ProductComparison;


