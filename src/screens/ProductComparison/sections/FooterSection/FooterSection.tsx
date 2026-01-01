import React from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Separator } from "../../../../components/ui/separator";

const linksData = [
  { label: "Home", href: "#" },
  { label: "Shop", href: "#" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];

const helpData = [
  { label: "Payment Options", href: "#" },
  { label: "Returns", href: "#" },
  { label: "Privacy Policies", href: "#" },
];

export const FooterSection = (): JSX.Element => {
  return (
    <footer className="w-full bg-white border-t border-[#0000002b]">
      <div className="max-w-[1240px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-6">
            <h2 className="[font-family:'Poppins',Helvetica] font-bold text-black text-2xl">
              Funiro.
            </h2>
            <address className="not-italic [font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-base leading-normal">
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
              {linksData.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="[font-family:'Poppins',Helvetica] font-medium text-black text-base hover:underline"
                  >
                    {link.label}
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
              {helpData.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="[font-family:'Poppins',Helvetica] font-medium text-black text-base hover:underline"
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
            <form className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter Your Email Address"
                  className="border-0 border-b border-black rounded-none px-0 [font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button
                type="submit"
                variant="ghost"
                className="border-0 border-b border-black rounded-none px-0 h-auto [font-family:'Poppins',Helvetica] font-medium text-black text-sm hover:bg-transparent"
              >
                SUBSCRIBE
              </Button>
            </form>
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
