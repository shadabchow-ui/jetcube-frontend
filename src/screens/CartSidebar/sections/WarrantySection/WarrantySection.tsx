import React, { useState } from "react";
import { Separator } from "../../../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";

const tabItems = [
  { value: "description", label: "Description" },
  { value: "additional", label: "Additional Information" },
  { value: "reviews", label: "Reviews [5]" },
];

const descriptionParagraphs = [
  "Embodying the raw, wayward spirit of rock 'n' roll, the Kilburn portable active stereo speaker takes the unmistakable look and sound of Marshall, unplugs the chords, and takes the show on the road.",
  "Weighing in under 7 pounds, the Kilburn is a lightweight piece of vintage styled engineering. Setting the bar as one of the loudest speakers in its class, the Kilburn is a compact, stout-hearted hero with a well-balanced audio which boasts a clear midrange and extended highs for a sound that is both articulate and pronounced. The analogue knobs allow you to fine tune the controls to your personal preferences while the guitar-influenced leather strap enables easy and stylish travel.",
];

export const WarrantySection = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState("description");

  return (
    <section className="w-full bg-white">
      <Separator className="w-full" />

      <div className="w-full py-12 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center gap-[53px] bg-transparent h-auto border-0">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="[font-family:'Poppins',Helvetica] font-normal text-2xl tracking-[0] leading-[normal] data-[state=active]:text-black data-[state=inactive]:text-[#9f9f9f] bg-transparent border-0 shadow-none px-0"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="description" className="mt-12">
            <div className="max-w-[1030px] mx-auto flex flex-col gap-[30px]">
              {descriptionParagraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base text-justify tracking-[0] leading-[normal]"
                >
                  {paragraph}
                </p>
              ))}

              <div className="mt-[30px] w-full">
                <img
                  className="w-full max-w-[1239px] mx-auto"
                  alt="Product images"
                  src="/img/group-109-1.png"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="additional" className="mt-12">
            <div className="max-w-[1030px] mx-auto">
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base text-justify tracking-[0] leading-[normal]">
                Additional information content goes here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-12">
            <div className="max-w-[1030px] mx-auto">
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base text-justify tracking-[0] leading-[normal]">
                Reviews content goes here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator className="w-full" />
    </section>
  );
};
