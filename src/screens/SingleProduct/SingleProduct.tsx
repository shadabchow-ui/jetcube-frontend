import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductPdpProvider } from "../../pdp/ProductPdpContext";
import { ProductHeroSection } from "./sections/ProductHeroSection/ProductHeroSection";
import { ProductDetailsSection } from "./sections/ProductDetailsSection/ProductDetailsSection";
import { RelatedProductsSection } from "./sections/RelatedProductsSection/RelatedProductsSection";

// IMPORTANT: guard optional section so build never fails
let CustomerReviewsSection: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CustomerReviewsSection =
    require("./sections/CustomerReviewsSection/CustomerReviewsSection")
      .CustomerReviewsSection;
} catch (e) {
  console.warn("CustomerReviewsSection not found, skipping.");
}

type PDP = any;

function resolvePdpIndex(slug: string) {
  const first = slug?.[0]?.toLowerCase();
  if (!first || !/^[a-z0-9]$/.test(first)) {
    return "misc";
  }
  return first;
}

export default function SingleProduct(): JSX.Element {
  const { slug = "" } = useParams();
  const [product, setProduct] = useState<PDP | null>(null);
  const [error, setError] = useState<string | null>(null);

  const indexKey = useMemo(() => resolvePdpIndex(slug), [slug]);

  useEffect(() => {
    if (!slug) return;

    const indexUrl = `https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/pdp_paths/${indexKey}.json`;

    console.log("[PDP] slug:", slug);
    console.log("[PDP] index:", indexUrl);

    fetch(indexUrl)
      .then((r) => r.json())
      .then((map) => {
        const productUrl = map[slug];

        if (!productUrl) {
          throw new Error("Slug not found in PDP index");
        }

        console.log("[PDP] productUrl:", productUrl);

        return fetch(productUrl);
      })
      .then((r) => r.json())
      .then(setProduct)
      .catch((err) => {
        console.error("[PDP] failed:", err);
        setError("Product not found");
      });
  }, [slug, indexKey]);

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-24 text-red-600">
        Product failed to load
        <div className="text-sm opacity-70 mt-2">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <ProductPdpProvider product={product}>
      <main className="min-h-screen">
        <ProductHeroSection />
        <ProductDetailsSection />
        {CustomerReviewsSection ? <CustomerReviewsSection /> : null}
        <RelatedProductsSection />
      </main>
    </ProductPdpProvider>
  );
}
















