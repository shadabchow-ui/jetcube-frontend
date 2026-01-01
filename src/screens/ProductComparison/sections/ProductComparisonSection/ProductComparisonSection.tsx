import { ChevronRightIcon } from "lucide-react";
import React from "react";

export const ProductComparisonSection = (): JSX.Element => {
  return (
    <section className="relative w-full">
      <img
        className="w-full h-[316px] object-cover"
        alt="Rectangle"
        src="/img/rectangle-1-2.png"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <img
            className="w-[77px] h-[77px] object-cover"
            alt="Meubel house logos"
            src="/img/meubel-house-logos-05-6.png"
          />

          <h1 className="[font-family:'Poppins',Helvetica] font-medium text-black text-5xl text-center tracking-[0] leading-[normal]">
            Product Comparison
          </h1>
        </div>

        <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
          <span className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]">
            Home
          </span>

          <ChevronRightIcon className="w-5 h-5 text-black" />

          <span className="[font-family:'Poppins',Helvetica] font-light text-black text-base tracking-[0] leading-[normal]">
            Comparison
          </span>
        </nav>
      </div>
    </section>
  );
};
