import React, { useState } from "react";
import { Separator } from "../../../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";

const tabItems = [
  { value: "description", label: "Description" },
  { value: "additional", label: "Additional Information" },
  { value: "reviews", label: "Reviews" },
];

export const DescriptionSection = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState("description");
  const product = useProductPdp();

  // ✅ These are template "description" images, NOT product gallery images.
  const img1 = "/img/group-109-1.png";
  const img2 = "/img/group-109-1.png";

  const shortDescription = product?.short_description || "";
  const longDescriptionBlocks =
    (product?.long_description || "").split?.("\n\n")?.filter?.(Boolean) ?? [];

  return (
    <section className="w-full bg-white py-12">
      <Separator className="mb-12" />

      <div className="container mx-auto px-4 max-w-[1240px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex justify-center gap-[52px] bg-transparent h-auto mb-9">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="[font-family:'Poppins',Helvetica] text-2xl tracking-[0] leading-normal data-[state=active]:text-black data-[state=active]:font-medium data-[state=inactive]:text-[#9f9f9f] data-[state=inactive]:font-normal bg-transparent border-0 shadow-none px-0 h-auto"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* DESCRIPTION TAB */}
          <TabsContent value="description" className="mt-0">
            <div className="flex flex-col gap-[30px] mb-[37px] max-w-[1026px] mx-auto">
              {shortDescription && (
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base text-justify tracking-[0] leading-normal">
                  {shortDescription}
                </p>
              )}

              {longDescriptionBlocks.map((block: string, index: number) => (
                <p
                  key={index}
                  className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base text-justify tracking-[0] leading-normal"
                >
                  {block}
                </p>
              ))}
            </div>

            <div className="flex justify-center gap-[29px] max-w-[1239px] mx-auto">
              <img
                className="w-[605px] h-[348px] object-cover rounded-[10px]"
                alt={`${product?.title ? String(product.title) : "Product"} description 1`}
                src={img1}
              />
              <img
                className="w-[605px] h-[348px] object-cover rounded-[10px]"
                alt={`${product?.title ? String(product.title) : "Product"} description 2`}
                src={img2}
              />
            </div>
          </TabsContent>

          {/* ADDITIONAL INFO TAB (unchanged placeholder) */}
          <TabsContent value="additional" className="mt-0">
            <div className="max-w-[1026px] mx-auto">
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base text-justify tracking-[0] leading-normal">
                Additional information content would go here.
              </p>
            </div>
          </TabsContent>

          {/* REVIEWS TAB — inline fallback (ProductReviewsSection doesn't exist) */}
          <TabsContent value="reviews" className="mt-0">
            <div className="max-w-[1026px] mx-auto">
              {Array.isArray(product?.reviews?.items) && product.reviews.items.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.items.slice(0, 10).map((r: any, idx: number) => (
                    <div key={idx} className="border-b pb-4">
                      <div className="font-medium text-sm">
                        {r?.author || "Verified buyer"}
                      </div>
                      {r?.body ? (
                        <p className="text-sm text-gray-600 mt-1">{r.body}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base text-center">
                  No reviews yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator className="mt-12" />
    </section>
  );
};

