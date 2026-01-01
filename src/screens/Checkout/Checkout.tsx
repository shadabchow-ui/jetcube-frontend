import React from "react";
import { BillingDetailsSection } from "./sections/BillingDetailsSection";
import { CheckoutFormSection } from "./sections/CheckoutFormSection";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { ProductSummarySection } from "./sections/ProductSummarySection";

export const Checkout = (): JSX.Element => {
  return (
    <main
      className="bg-white w-full min-w-[1440px] flex flex-col"
      data-model-id="117:1143"
    >
      <HeaderSection />
      <ProductSummarySection />
      <BillingDetailsSection />
      <CheckoutFormSection />
      <FooterSection />
    </main>
  );
};
export default Checkout;
