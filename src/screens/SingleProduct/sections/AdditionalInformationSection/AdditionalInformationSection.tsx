import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";

type RelatedItem = {
  id: string;
  title?: string;
  images?: string[];
  price?: number | string;
  badge?: {
    type?: string;
    value?: string;
    className?: string;
  };
};

function formatPrice(price: number | string | undefined): string | null {
  if (price == null) return null;

  if (typeof price === "number" && isFinite(price)) {
    return `$${price.toFixed(2)}`;
  }

  const s = String(price).trim();
  if (!s) return null;

  // normalize "$49\n.\n99" -> "$49.99"
  const cleaned = s.replace(/\s+/g, "");
  const m = cleaned.match(/^\$?\d+(\.\d{2})?$/);
  if (m) {
    const withDollar = cleaned.startsWith("$") ? cleaned : `$${cleaned}`;
    return withDollar;
  }

  return s;
}

export const AdditionalInformationSection = (): JSX.Element => {
  const product = useProductPdp();

  const related: RelatedItem[] = useMemo(() => {
    const items = Array.isArray(product?.related) ? product.related : [];
    // Keep only items with an id
    return items.filter((x: any) => x && typeof x.id === "string" && x.id.trim());
  }, [product]);

  // match your “4 when only 5 total products” idea (we’ll show up to 4 here)
  const visible = related.slice(0, 4);

  // If no related items exist, keep section but show an empty-safe message
  return (
    <section className="w-full bg-white py-14">
      <div className="container mx-auto px-[100px]">
        <h2 className="[font-family:'Poppins',Helvetica] font-medium text-black text-4xl tracking-[0] leading-normal text-center mb-20">
          Related Products
        </h2>

        {visible.length === 0 ? (
          <div className="w-full flex justify-center">
            <p className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base text-center">
              No related products available yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-8 mb-8">
            {visible.map((item) => {
              const image = item.images?.[0];
              const name = item.title || "Product";
              const priceText = formatPrice(item.price);

              return (
                <Link
                  key={item.id}
                  to={`/p/${encodeURIComponent(item.id)}`}
                  className="block group"
                >
                  <Card className="border-0 shadow-none overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative">
                        {image ? (
                          <img
                            className="w-full h-[301px] object-cover"
                            alt={name}
                            src={image}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-[301px] bg-[#f3f3f3]" />
                        )}

                        {item.badge?.value && (
                          <Badge
                            className={`absolute top-6 right-6 ${item.badge.className || "bg-color-green-accents"
                              } text-color-white rounded-3xl h-12 w-12 flex items-center justify-center [font-family:'Poppins',Helvetica] font-medium text-base`}
                          >
                            {item.badge.value}
                          </Badge>
                        )}
                      </div>

                      <div className="bg-color-light-bg p-4">
                        <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-color-gray-1 text-2xl tracking-[0] leading-[28.8px] mb-2 line-clamp-2">
                          {name}
                        </h3>

                        {/* Keep the same spacing even if description doesn't exist */}
                        <p className="[font-family:'Poppins',Helvetica] font-medium text-color-gray-3 text-base tracking-[0] leading-6 mb-2">
                          {""}
                        </p>

                        <div className="flex items-center gap-4">
                          {priceText ? (
                            <span className="[font-family:'Poppins',Helvetica] font-semibold text-color-gray-1 text-xl tracking-[0] leading-[30px]">
                              {priceText}
                            </span>
                          ) : (
                            <span className="[font-family:'Poppins',Helvetica] font-semibold text-color-gray-1 text-xl tracking-[0] leading-[30px]">
                              —
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
        )}

        <div className="flex justify-center">
          <Button
            asChild
            variant="outline"
            className="h-12 w-[247px] bg-color-white border-app-primary text-app-primary [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 hover:bg-app-primary hover:text-color-white"
          >
            <Link to="/shop">Show More</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AdditionalInformationSection;

