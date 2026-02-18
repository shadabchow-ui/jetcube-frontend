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

function semverGte(version: string, target: string) {
  const parse = (v: string) =>
    String(v || "")
      .replace(/^v/i, "")
      .split(".")
      .map((x) => Number(x || 0));
  const a = parse(version);
  const b = parse(target);
  for (let i = 0; i < 3; i++) {
    const ai = a[i] || 0;
    const bi = b[i] || 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return true;
}

const SEO_CLEAN_VERSION = "v1.2.0";

function pickSafeTitle(product: any) {
  const v = String((product as any)?.seo_rewrite_version || "v0.0.0");
  const titleSeo = String((product as any)?.title_seo || "").trim();
  const title = String((product as any)?.title || "").trim();
  if (titleSeo && semverGte(v, SEO_CLEAN_VERSION)) return titleSeo;
  return titleSeo || title || "Product";
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
    pickSafeTitle(product),
    String((product as any)?.brand || "")
  );

  const path: string[] = Array.isArray((product as any)?.category_path)
    ? (product as any).category_path.map((x: any) => String(x || "").trim()).filter(Boolean)
    : [];

  const slug = String((product as any)?.category_slug || "").trim();
  const slugParts = slug ? slug.split("/").filter(Boolean) : [];

  const canUseDynamic = path.length > 0 && slugParts.length > 0;

  return (
    <nav className="w-full border-b border-neutral-200 bg-white" aria-label="Breadcrumb">
      <div className="mx-auto max-w-[1500px] px-4 py-2">
        <ol className="flex flex-wrap items-center text-[12px] leading-[16px] text-[#565959]">
          {canUseDynamic ? (
            <>
              <li>
                <CrumbLink href="/">Home</CrumbLink>
              </li>

              {path.map((label, i) => {
                const href = "/c/" + slugParts.slice(0, i + 1).join("/");
                return (
                  <React.Fragment key={`${label}-${i}`}>
                    <Sep />
                    <li className="capitalize">
                      <CrumbLink href={href}>{label}</CrumbLink>
                    </li>
                  </React.Fragment>
                );
              })}

              <Sep />

              <li className="line-clamp-1 text-[#565959]" aria-current="page">
                {displayTitle || "Product"}
              </li>
            </>
          ) : (
            <>
              <li>
                <CrumbLink href="/">Clothing, Shoes &amp; Jewelry</CrumbLink>
              </li>

              <Sep />

              <li>
                <CrumbLink href="/shop">Shop</CrumbLink>
              </li>

              {product?.category ? (
                <>
                  <Sep />
                  <li className="capitalize">
                    <CrumbLink href="/shop">{String((product as any).category)}</CrumbLink>
                  </li>
                </>
              ) : null}

              <Sep />

              <li className="line-clamp-1 text-[#565959]" aria-current="page">
                {displayTitle || "Product"}
              </li>
            </>
          )}
        </ol>
      </div>
    </nav>
  );
};

export default ProductBreadcrumb;

