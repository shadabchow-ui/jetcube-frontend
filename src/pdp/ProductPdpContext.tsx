import React, { createContext, useContext } from "react";

/**
 * Review item shape
 */
export type ProductReview = {
  title?: string;
  body?: string;
  author?: string;
  rating?: number;
  date?: string;

  // ✅ Support review images ONLY inside reviews
  images?: string[];

  // Optional metadata if present
  verified?: boolean;
};

/**
 * Long description blocks allow inline A+ images between paragraphs
 * (used by ProductDetailsSection.tsx).
 */
export type LongDescriptionBlock =
  | { type: "p"; text: string }
  | { type: "img"; src: string; alt?: string };

/**
 * Video shape (MP4 vs HLS)
 */
export type ProductVideo = {
  src: string;
  type?: string; // e.g. "video/mp4" or "application/x-mpegURL"
  poster?: string;
};

/**
 * Main PDP product shape
 */
export type ProductPdp = {
  id: string;
  title: string;

  brand?: string;

  price?: number | string;
  images?: string[];

  // “About this item”
  short_description?: string;

  // Rewritten long description text fallback
  long_description?: string;

  // ✅ Prefer blocks when present (paragraph + inline A+ images)
  long_description_blocks?: LongDescriptionBlock[];

  // ✅ Videos playable (MP4 vs HLS)
  videos?: ProductVideo[];

  sku?: string;
  category?: string;
  tags?: string[];

  // Optional extras used elsewhere
  bought_in_past_month?: string;
  size_chart?: any;

  reviews?: {
    // Keep compatible with current usage, but allow missing values safely
    count?: number;
    average_rating?: number;

    // ✅ “Customers say” (ONLY if extracted into JSON)
    customers_say?: string;

    items: ProductReview[];
  };

  /**
   * Allow additional scraped fields
   */
  [key: string]: any;
};

/**
 * PDP Context
 */
const ProductPdpContext = createContext<ProductPdp | null>(null);

/**
 * Provider
 */
export function ProductPdpProvider({
  product,
  children,
}: {
  product: ProductPdp;
  children: React.ReactNode;
}) {
  return (
    <ProductPdpContext.Provider value={product}>
      {children}
    </ProductPdpContext.Provider>
  );
}

/**
 * Hook
 */
export function useProductPdp(): ProductPdp {
  const ctx = useContext(ProductPdpContext);

  if (!ctx) {
    throw new Error("useProductPdp must be used within <ProductPdpProvider>");
  }

  return ctx;
}

export default ProductPdpContext;





