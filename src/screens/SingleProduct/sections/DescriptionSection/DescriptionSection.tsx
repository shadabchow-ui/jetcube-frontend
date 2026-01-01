import React, { useState } from "react";
import { Separator } from "../../../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";
import { ProductReviewsSection } from "./ProductReviewsSection";

const tabItems = [
  { value: "description", label: "Description" },
  { value: "additional", label: "Additional Information" },
  { value: "reviews", label: "Reviews [5]" },
];

export const DescriptionSection = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState("description");
  const product = useProductPdp();

  // ✅ These are template “description” images, NOT product gallery images.
  const img1 = "/img/group-109-1.png";
  const img2 = "/img/group-109-1.png";

  const shortDescription = product?.short_description;
  const longDescriptionBlocks =
    product?.long_description?.split("\n\n").filter(Boolean) ?? [];

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

              {longDescriptionBlocks.map((block, index) => (
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

          {/* REVIEWS TAB (NOW FULLY WIRED) */}
          <TabsContent value="reviews" className="mt-0">
            <ProductReviewsSection />
          </TabsContent>
        </Tabs>
      </div>

      <Separator className="mt-12" />
    </section>
  );
};

