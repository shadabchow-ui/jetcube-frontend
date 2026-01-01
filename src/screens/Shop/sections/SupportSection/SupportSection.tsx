import React from "react";
import { Button } from "../../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Separator } from "../../../../components/ui/separator";

export const SupportSection = (): JSX.Element => {
  const viewIcons = [
    {
      src: "/img/vector-60.svg",
      alt: "Grid view",
      width: "w-[58.33%]",
      height: "h-[58.33%]",
      top: "top-[20.83%]",
      left: "left-[20.83%]",
    },
    {
      src: "/img/vector-59.svg",
      alt: "List view",
      width: "w-[87.50%]",
      height: "h-[81.25%]",
      top: "top-[9.38%]",
      left: "left-[6.25%]",
    },
  ];

  return (
    <section className="w-full h-[100px] flex items-center bg-[#f9f1e7] px-[98px] gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <div className="w-[25px] h-[25px] relative">
            <img
              className="absolute w-[76.19%] h-[66.67%] top-[17.05%] left-[9.90%]"
              alt="Filter icon"
              src="/img/vector-58.svg"
            />
          </div>
          <span className="ml-3 [font-family:'Poppins',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal]">
            Filter
          </span>
        </Button>
      </div>

      <div className="flex items-center gap-6">
        {viewIcons.map((icon, index) => (
          <Button
            key={index}
            variant="ghost"
            className="h-auto p-0 hover:bg-transparent"
          >
            <div className={`${index === 0 ? "w-7 h-7" : "w-6 h-6"} relative`}>
              <img
                className={`absolute ${icon.width} ${icon.height} ${icon.top} ${icon.left}`}
                alt={icon.alt}
                src={icon.src}
              />
            </div>
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-8 ml-[30px]">
        <Separator
          orientation="vertical"
          className="h-[37px] w-0.5 bg-[#9f9f9f]"
        />
        <p className="[font-family:'Poppins',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
          Showing 1–16 of 32 results
        </p>
      </div>

      <div className="flex items-center gap-[17px] ml-auto">
        <span className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal]">
          Show
        </span>
        <Select defaultValue="16">
          <SelectTrigger className="w-[55px] h-[55px] bg-white border-0 [font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="8">8</SelectItem>
            <SelectItem value="16">16</SelectItem>
            <SelectItem value="32">32</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-[17px] ml-[27px]">
        <span className="[font-family:'Poppins',Helvetica] font-normal text-black text-xl tracking-[0] leading-[normal]">
          Short by
        </span>
        <Select defaultValue="default">
          <SelectTrigger className="w-[188px] h-[55px] bg-white border-0 [font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
};
