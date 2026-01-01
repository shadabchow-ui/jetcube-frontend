import React from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Separator } from "../../../../components/ui/separator";

const linkItems = [
  { label: "Home" },
  { label: "Shop" },
  { label: "About" },
  { label: "Contact" },
];

const helpItems = [
  { label: "Payment Options" },
  { label: "Returns" },
  { label: "Privacy Policies" },
];

export const FooterSection = (): JSX.Element => {
  return (
    <footer className="w-full bg-white border-t border-[#0000002b] mt-2">
      <div className="max-w-[1240px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-6">
            <h2 className="[font-family:'Poppins',Helvetica] font-bold text-black text-2xl">
              Funiro.
            </h2>
            <address className="not-italic [font-family:'Poppins',Helvetica] font-normal text-base text-[#9f9f9f]">
              400 University Drive Suite 200 Coral Gables,
              <br />
              FL 33134 USA
            </address>
          </div>

          <nav className="space-y-6">
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#9f9f9f] text-base">
              Links
            </h3>
            <ul className="space-y-6">
              {linkItems.map((item, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="[font-family:'Poppins',Helvetica] font-medium text-black text-base hover:text-[#9f9f9f] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="space-y-6">
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#9f9f9f] text-base">
              Help
            </h3>
            <ul className="space-y-6">
              {helpItems.map((item, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="[font-family:'Poppins',Helvetica] font-medium text-black text-base hover:text-[#9f9f9f] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-6">
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#9f9f9f] text-base">
              Newsletter
            </h3>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="email"
                  placeholder="Enter Your Email Address"
                  className="[font-family:'Poppins',Helvetica] font-normal text-sm text-[#9f9f9f] border-0 border-b border-black rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button
                variant="ghost"
                className="[font-family:'Poppins',Helvetica] font-medium text-black text-sm border-0 border-b border-black rounded-none px-0 hover:bg-transparent h-auto"
              >
                SUBSCRIBE
              </Button>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        <p className="[font-family:'Poppins',Helvetica] font-normal text-black text-base">
          2023 furino. All rights reverved
        </p>
      </div>
    </footer>
  );
};
