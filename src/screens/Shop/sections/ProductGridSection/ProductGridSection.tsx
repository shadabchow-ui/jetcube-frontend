import { ArrowLeftRightIcon, HeartIcon, Share2Icon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";

type IndexItem = {
  slug?: string;
  asin?: string;
  ASIN?: string;
  title?: string;
  name?: string;
  brand?: string;
  price?: string | number;
  originalPrice?: string | number;
  original_price?: string | number;
  image?: string;
  thumbnail?: string;
  image_url?: string;
  discount?: string;
  badgeType?: "discount" | "new" | string | null;
};

const INDEX_URLS = ["/indexes/_index.json"];

const paginationItems = [
  { page: "1", active: true },
  { page: "2", active: false },
  { page: "3", active: false },
  { page: "Next", active: false, isNext: true },
];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function pickId(p: IndexItem): string | null {
  const asin = (p.asin || p.ASIN || "").trim();
  if (asin) return asin.toUpperCase();
  const slug = (p.slug || "").trim();
  if (slug) return slug;
  return null;
}

function pickTitle(p: IndexItem): string {
  if (isNonEmptyString(p.title)) return p.title;
  if (isNonEmptyString(p.name)) return p.name;
  if (isNonEmptyString(p.slug)) return p.slug;
  if (isNonEmptyString(p.asin)) return p.asin;
  return "Product";
}

function pickPrice(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) return `$${v.toFixed(2)}`;
  if (typeof v === "string") {
    const s = v.trim();
    return s.length ? s : null;
  }
  return null;
}

function pickImage(p: IndexItem): string | null {
  const src =
    (isNonEmptyString(p.thumbnail) && p.thumbnail) ||
    (isNonEmptyString(p.image) && p.image) ||
    (isNonEmptyString(p.image_url) && p.image_url) ||
    null;

  // Some bad records can have "null" or "None" as strings
  if (!src) return null;
  const bad = src.trim().toLowerCase();
  if (!bad || bad === "null" || bad === "none" || bad === "undefined") return null;

  return src;
}

export const ProductGridSection = (): JSX.Element => {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const [items, setItems] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      for (const url of INDEX_URLS) {
        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (!res.ok) continue;

          const data = await res.json();

          // _index.json should be an array of items
          const arr: IndexItem[] = Array.isArray(data) ? (data as IndexItem[]) : [];

          if (!cancelled) {
            setItems(arr);
            setLoading(false);
          }
          return;
        } catch {
          // try next url
        }
      }

      if (!cancelled) {
        setItems([]);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    // keep it light for the page; you can wire real pagination later
    const cleaned = items
      .map((p) => ({
        ...p,
        asin: isNonEmptyString(p.asin) ? p.asin : p.ASIN,
      }))
      .filter((p) => !!pickId(p));

    return cleaned.slice(0, 16);
  }, [items]);

  return (
    <section className="w-full bg-white py-4">
      <div className="container mx-auto px-[99px]">
        <div className="flex flex-col items-center gap-10">
          <div className="grid grid-cols-4 gap-8 w-full">
            {loading &&
              Array.from({ length: 16 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="block">
                  <Card className="relative overflow-hidden border-0 shadow-none">
                    <CardContent className="p-0">
                      <div className="w-full h-[301px] bg-[#f3f4f6]" />
                      <div className="bg-color-light-bg p-4">
                        <div className="h-6 w-3/4 bg-[#e5e7eb] rounded mb-2" />
                        <div className="h-4 w-2/3 bg-[#e5e7eb] rounded mb-2" />
                        <div className="h-5 w-1/3 bg-[#e5e7eb] rounded" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}

            {!loading &&
              visible.map((product, index) => {
                const id = pickId(product);
                const title = pickTitle(product);
                const img = pickImage(product);

                const price = pickPrice(product.price);
                const original =
                  pickPrice((product as any).originalPrice) ||
                  pickPrice((product as any).original_price);

                // optional badge support if your index includes it
                const badgeType =
                  (product.badgeType as any) ||
                  ((product.discount || (original && price && original !== price)) ? "discount" : null);

                const discountText =
                  (isNonEmptyString(product.discount) && product.discount) ||
                  (badgeType === "discount" ? "Sale" : null);

                const to = id ? `/products/${encodeURIComponent(id)}` : "/shop";

                return (
                  <Link
                    key={`product-${id}-${index}`}
                    to={to}
                    className="block"
                    onMouseEnter={() => setHoveredProduct(index)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <Card className="relative overflow-hidden border-0 shadow-none group">
                      <CardContent className="p-0">
                        <div className="relative">
                          {img ? (
                            <img
                              className="w-full h-[301px] object-cover"
                              alt={title}
                              src={img}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-[301px] bg-[#f3f4f6] flex items-center justify-center text-sm text-[#6b7280]">
                              No image
                            </div>
                          )}

                          {badgeType && (
                            <div className="absolute top-6 right-6">
                              {badgeType === "discount" && (
                                <Badge className="h-12 w-12 rounded-full bg-color-red-accents hover:bg-color-red-accents text-color-white flex items-center justify-center [font-family:'Poppins',Helvetica] font-medium text-base">
                                  {discountText}
                                </Badge>
                              )}
                              {badgeType === "new" && (
                                <Badge className="h-12 w-12 rounded-full bg-color-green-accents hover:bg-color-green-accents text-color-white flex items-center justify-center [font-family:'Poppins',Helvetica] font-medium text-base">
                                  New
                                </Badge>
                              )}
                            </div>
                          )}

                          {hoveredProduct === index && (
                            <div className="absolute inset-0 bg-color-gray-1 bg-opacity-72 flex flex-col items-center justify-center gap-6 z-10">
                              <Link to="/cart">
                                <Button className="bg-color-white hover:bg-color-white text-app-primary h-12 px-14 [font-family:'Poppins',Helvetica] font-semibold text-base">
                                  Add to cart
                                </Button>
                              </Link>

                              <div className="flex items-center gap-5">
                                <button className="flex items-center gap-0.5 text-color-white [font-family:'Poppins',Helvetica] font-semibold text-base">
                                  <Share2Icon className="w-4 h-4" />
                                  <span>Share</span>
                                </button>

                                <Link
                                  to="/product-comparison"
                                  className="flex items-center gap-0.5 text-color-white [font-family:'Poppins',Helvetica] font-semibold text-base"
                                >
                                  <ArrowLeftRightIcon className="w-4 h-4" />
                                  <span>Compare</span>
                                </Link>

                                <button className="flex items-center gap-0.5 text-color-white [font-family:'Poppins',Helvetica] font-semibold text-base">
                                  <HeartIcon className="w-4 h-4" />
                                  <span>Like</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-color-light-bg p-4">
                          <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-color-gray-1 text-2xl leading-[28.8px] mb-2 line-clamp-2">
                            {title}
                          </h3>

                          <p className="[font-family:'Poppins',Helvetica] font-medium text-color-gray-3 text-base leading-6 mb-2">
                            {isNonEmptyString(product.brand) ? product.brand : " "}
                          </p>

                          <div className="flex items-center gap-4">
                            <span className="[font-family:'Poppins',Helvetica] font-semibold text-color-gray-1 text-xl leading-[30px]">
                              {price || "—"}
                            </span>

                            {original && original !== price && (
                              <span className="[font-family:'Poppins',Helvetica] font-normal text-color-gray-4 text-base leading-6 line-through">
                                {original}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>

          {/* keep the existing pagination UI as-is for now */}
          <nav className="flex items-center gap-[38px] pt-[30px]">
            {paginationItems.map((item, index) => (
              <Button
                key={`pagination-${index}`}
                variant="ghost"
                className={`h-[60px] ${item.isNext ? "w-[98px]" : "w-[60px]"} rounded-[10px] p-0 hover:bg-app-primary hover:text-white ${item.active ? "bg-app-primary text-white" : "bg-[#f9f1e7] text-black"
                  } [font-family:'Poppins',Helvetica] ${item.isNext ? "font-light" : "font-normal"} text-xl`}
              >
                {item.page}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
};

