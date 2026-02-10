import React from "react";
import { useParams } from "react-router-dom";
import { ProductPdpProvider } from "../../pdp/ProductPdpContext";
import MainContent from "../MainContent";

export default function SingleProduct() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return <div>Missing product slug</div>;

  return (
    <ProductPdpProvider slug={slug}>
      <MainContent />
    </ProductPdpProvider>
  );
}


























