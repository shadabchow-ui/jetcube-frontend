import React from "react";
import { useProductPdp } from "../../../pdp/ProductPdpContext";

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripBrandPrefix(title: string, brand?: string): string {
  const t = (title || "").trim();
  const b = (brand || "").trim();
  if (!t || !b) return t;

  const re = new RegExp(`^\\s*${escapeRegExp(b)}\\s*[-–—:|·]*\\s*`, "i");
  const out = t.replace(re, "").trim();
  return out || t;
}

const CrumbLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <a
      href={href}
      className="text-[#565959] hover:text-[#c45500] hover:underline"
    >
      {children}
    </a>
  );
};

const Sep = () => <span className="mx-1 text-[#565959]">›</span>;

const ProductBreadcrumb = () => {
  const product = useProductPdp();
  const displayTitle = stripBrandPrefix(
    String(product.title || ""),
    (product as any).brand
  );

  return (
    <nav className="w-full border-b border-neutral-200 bg-white" aria-label="Breadcrumb">
      {/* widen it a bit to match the Amazon-wide layout */}
      <div className="mx-auto max-w-[1500px] px-4 py-2">
        <ol className="flex flex-wrap items-center text-[12px] leading-[16px] text-[#565959]">
          <li>
            <CrumbLink href="/">Clothing, Shoes &amp; Jewelry</CrumbLink>
          </li>

          <Sep />

          <li>
            <CrumbLink href="/shop">Women</CrumbLink>
          </li>

          {product.category ? (
            <>
              <Sep />
              <li className="capitalize">
                <CrumbLink href="/shop">{String(product.category)}</CrumbLink>
              </li>
            </>
          ) : null}

          <Sep />

          {/* current page crumb - Amazon keeps it same gray and not a link */}
          <li className="line-clamp-1 text-[#565959]" aria-current="page">
            {displayTitle}
          </li>
        </ol>
      </div>
    </nav>
  );
};

export default ProductBreadcrumb;
