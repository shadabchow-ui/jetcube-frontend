import { ChevronRightIcon } from "lucide-react";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../../components/ui/breadcrumb";

export const NavigationSection = (): JSX.Element => {
  return (
    <section className="relative w-full h-[316px]">
      <img
        className="absolute inset-0 w-full h-full object-cover"
        alt="Cart background"
        src="/img/rectangle-1-2.png"
      />

      <div className="relative flex flex-col items-center justify-center h-full gap-[61px] pt-[61px]">
        <div className="flex flex-col items-center gap-[61px]">
          <img
            className="w-[77px] h-[77px] object-cover"
            alt="Meubel house logos"
            src="/img/meubel-house-logos-05-6.png"
          />

          <h1 className="font-medium text-5xl [font-family:'Poppins',Helvetica] text-black tracking-[0] leading-normal">
            Cart
          </h1>
        </div>

        <Breadcrumb>
          <BreadcrumbList className="gap-1.5">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-normal"
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRightIcon className="w-5 h-5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-light text-base [font-family:'Poppins',Helvetica] text-black tracking-[0] leading-normal">
                Cart
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </section>
  );
};
