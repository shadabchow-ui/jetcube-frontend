import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ProductReview = {
  title?: string;
  body?: string;
  author?: string;
  rating?: number | string;
  date?: string;
  verified?: boolean;
  images?: string[];
};

export type ProductPdp = {
  // Core identity
  handle?: string;
  asin?: string;
  sku?: string;
  brand?: string;

  // Category + taxonomy
  category?: string;
  breadcrumbs?: string[];

  // Primary content
  title?: string;
  about_this_item?: string;
  description?: string;

  // Merch + pricing
  price?: string | number;
  currency?: string;
  availability?: string;

  // Media
  images?: string[];

  // Ratings + reviews
  rating?: number | string;
  ratings_count?: number | string;
  reviews?: ProductReview[];

  // Any other fields your JSON may contain
  [key: string]: any;
};

type ProductPdpContextValue = {
  product: ProductPdp | null;
  setProduct: React.Dispatch<React.SetStateAction<ProductPdp | null>>;
};

const ProductPdpContext = createContext<ProductPdpContextValue | undefined>(
  undefined
);

export function useProductPdp(): ProductPdpContextValue {
  const ctx = useContext(ProductPdpContext);
  if (!ctx) {
    throw new Error("useProductPdp must be used within a ProductPdpProvider");
  }
  return ctx;
}

export function ProductPdpProvider({
  children,
  product,
}: {
  children: ReactNode;
  product: ProductPdp | null;
}) {
  const [current, setCurrent] = useState<ProductPdp | null>(product ?? null);

  // Keep context in sync if the parent swaps product props
  useEffect(() => {
    setCurrent(product ?? null);
  }, [product]);

  const value = useMemo(
    () => ({
      product: current,
      setProduct: setCurrent,
    }),
    [current]
  );

  return (
    <ProductPdpContext.Provider value={value}>
      {children}
    </ProductPdpContext.Provider>
  );
}

export default ProductPdpContext;







