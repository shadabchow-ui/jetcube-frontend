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

export const HeaderSection = (): JSX.Element => {
  return (
    <section className="relative w-full h-[316px]">
      <img
        className="absolute inset-0 w-full h-full object-cover"
        alt="Shop header background"
        src="/img/rectangle-1-3.png"
      />

      <div className="relative h-full flex flex-col items-center justify-center gap-6">
        <h1 className="font-medium text-5xl [font-family:'Poppins',Helvetica] text-black tracking-[0] leading-normal">
          Shop
        </h1>

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
                Shop
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </section>
  );
};
