import React, { useMemo, useState } from "react";
import type { IndexProduct } from "../data/useIndexProducts";

type Props = {
  product: IndexProduct;
};

function toProductUrl(p: IndexProduct) {
  // your app uses /p/:slug routes
  return `/p/${encodeURIComponent(p.slug || p.handle)}`;
}

export function ProductCard({ product }: Props) {
  const href = useMemo(() => toProductUrl(product), [product.handle, product.slug]);

  // Start with normalized image from the hook
  const [imgOk, setImgOk] = useState(true);

  const imgSrc = product.image || null;

  return (
    <a
      href={href}
      className="block bg-white border border-[#D5D9D9] rounded-[6px] overflow-hidden hover:shadow-sm"
      style={{ textDecoration: "none" }}
    >
      <div className="w-full h-[150px] bg-[#F7F8F8] flex items-center justify-center">
        {imgSrc && imgOk ? (
          <img
            src={imgSrc}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="text-[12px] text-[#565959]">No image</div>
        )}
      </div>

      <div className="p-2">
        <div className="text-[12px] leading-[16px] text-[#0F1111] line-clamp-2">
          {product.title}
        </div>

        {typeof product.price === "number" ? (
          <div className="mt-1 text-[13px] font-semibold text-[#0F1111]">
            ${product.price.toFixed(2)}
          </div>
        ) : null}
      </div>
    </a>
  );
}
