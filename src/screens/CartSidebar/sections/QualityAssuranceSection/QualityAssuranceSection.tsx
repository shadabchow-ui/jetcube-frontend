import { ChevronRightIcon } from "lucide-react";
import React from "react";
import { Separator } from "../../../../components/ui/separator";

const breadcrumbItems = [
  { label: "Home", isActive: false },
  { label: "Shop", isActive: false },
];

export const QualityAssuranceSection = (): JSX.Element => {
  return (
    <nav className="w-full h-[100px] flex items-center bg-white px-[99px]">
      <div className="flex items-center gap-[22px]">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center gap-3.5">
              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base tracking-[0] leading-[normal]">
                {item.label}
              </span>
              <ChevronRightIcon className="w-5 h-5 text-[#9f9f9f]" />
            </div>
          </React.Fragment>
        ))}

        <div className="flex items-center gap-8">
          <Separator
            orientation="vertical"
            className="h-[37px] w-0.5 bg-[#9f9f9f]"
          />
          <span className="[font-family:'Poppins',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal]">
            Asgaard sofa
          </span>
        </div>
      </div>
    </nav>
  );
};
