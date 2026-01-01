import React from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

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

export const SupportSection = (): JSX.Element => {
  return (
    <footer className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
        <div className="space-y-6">
          <h2 className="[font-family:'Poppins',Helvetica] font-bold text-black text-2xl tracking-[0] leading-[normal]">
            Funiro.
          </h2>
          <address className="not-italic [font-family:'Poppins',Helvetica] font-normal text-base tracking-[0] leading-[normal] text-[#9f9f9f]">
            400 University Drive Suite 200 Coral Gables,
            <br />
            FL 33134 USA
          </address>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <nav className="space-y-6">
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#9f9f9f] text-base tracking-[0] leading-[normal]">
              Links
            </h3>
            <ul className="space-y-6">
              {linksData.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal] hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="space-y-6">
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#9f9f9f] text-base tracking-[0] leading-[normal]">
              Help
            </h3>
            <ul className="space-y-6">
              {helpData.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal] hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-6">
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#9f9f9f] text-base tracking-[0] leading-[normal]">
              Newsletter
            </h3>
            <form className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Enter Your Email Address"
                  className="border-0 border-b border-[#9f9f9f] rounded-none px-0 [font-family:'Poppins',Helvetica] font-normal text-[#9f9f9f] text-sm tracking-[0] leading-[normal] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button
                type="submit"
                variant="ghost"
                className="h-auto p-0 border-0 border-b border-black rounded-none [font-family:'Poppins',Helvetica] font-medium text-black text-sm tracking-[0] leading-[normal] hover:bg-transparent"
              >
                SUBSCRIBE
              </Button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};
