import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductDetailsSection } from "./sections/ProductDetailsSection/ProductDetailsSection";
import { CustomerReviewsSection } from "./sections/CustomerReviewsSection/CustomerReviewsSection";
import { RelatedProductsSection } from "./sections/RelatedProductsSection/RelatedProductsSection";
import { useProductPdp } from "../../pdp/ProductPdpContext";

const R2_BASE = "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

type PDPPathIndex = Record<string, string>;

export const SingleProduct = (): JSX.Element => {
  const { slug } = useParams<{ slug: string }>();
  const { setProductFromUrl } = useProductPdp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedSlug = useMemo(() => {
    if (!slug) return "";
    return decodeURIComponent(slug).toLowerCase();
  }, [slug]);

  const shard = useMemo(() => {
    if (!normalizedSlug || normalizedSlug.length < 2) return "";
    return normalizedSlug.slice(0, 2);
  }, [normalizedSlug]);

  useEffect(() => {
    let cancelled = false;

    async function resolvePdp() {
      try {
        setLoading(true);
        setError(null);

        if (!normalizedSlug || !shard) {
          throw new Error("Invalid product slug");
        }

        const indexUrl = `${R2_BASE}/indexes/pdp_paths/${shard}.json`;
        const indexRes = await fetch(indexUrl, { cache: "no-store" });

        if (!indexRes.ok) {
          throw new Error(`Failed to load PDP index: ${indexUrl}`);
        }

        const indexJson: PDPPathIndex = await indexRes.json();

        const productPath = indexJson[normalizedSlug];

        if (!productPath) {
          throw new Error("Product not found in PDP index");
        }

        const productUrl = `${R2_BASE}${productPath}`;
        const productRes = await fetch(productUrl, { cache: "no-store" });

        if (!productRes.ok) {
          throw new Error(`Failed to load product JSON: ${productUrl}`);
        }

        const productJson = await productRes.json();

        if (!cancelled) {
          setProductFromUrl(productJson);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("PDP resolver error:", err);
          setError(err?.message || "Product failed to load");
          setLoading(false);
        }
      }
    }

    resolvePdp();

    return () => {
      cancelled = true;
    };
  }, [normalizedSlug, shard, setProductFromUrl]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-red-600">
        Product failed to load
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProductDetailsSection />
      <CustomerReviewsSection />
      <RelatedProductsSection />
    </div>
  );
};

export default SingleProduct;














