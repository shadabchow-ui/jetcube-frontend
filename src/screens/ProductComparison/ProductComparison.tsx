


// src/screens/ProductComparison/ProductComparison.tsx

import * as NavigationSectionMod from "../Shop/sections/NavigationSection";
import * as ProductComparisonSectionMod from "./sections/ProductComparisonSection";
import * as QualityAssuranceSectionMod from "../CartSidebar/sections/QualityAssuranceSection";
import * as RelatedProductsSectionMod from "../SingleProduct/sections/RelatedProductsSection";

// Support either default-export OR named-export without changing UI/layout
const NavigationSection =
  (NavigationSectionMod as any).default ??
  (NavigationSectionMod as any).NavigationSection;

const ProductComparisonSection =
  (ProductComparisonSectionMod as any).ProductComparisonSection ??
  (ProductComparisonSectionMod as any).default;

const QualityAssuranceSection =
  (QualityAssuranceSectionMod as any).QualityAssuranceSection ??
  (QualityAssuranceSectionMod as any).default;

const RelatedProductsSection =
  (RelatedProductsSectionMod as any).RelatedProductsSection ??
  (RelatedProductsSectionMod as any).default;

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


