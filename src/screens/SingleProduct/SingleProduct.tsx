import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProductPdp } from "../../pdp/ProductPdpContext";
import MainContent from "../MainContent";

export default function SingleProduct() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading, error, loadBySlug } = useProductPdp();

  useEffect(() => {
    if (slug) {
      loadBySlug(slug);
    }
  }, [slug]);

  if (loading) {
    return <div className="max-w-[1200px] mx-auto px-6 py-16">Loading product…</div>;
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-16 text-red-600">
        Product failed to load: {error}
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return <MainContent product={product} />;
}



























