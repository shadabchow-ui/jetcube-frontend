import {
  HeartIcon,
  SearchIcon,
  ShoppingCartIcon,
  UserIcon,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../components/ui/button";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const HeaderSection = (): JSX.Element => {
  return (
    <header className="w-full h-[100px] flex flex-row px-[54px] py-[29px] justify-between items-center bg-white">
      <Link to="/cart-sidebar" className="flex items-center gap-[5px]">
        <img
          className="w-[50px] h-8"
          alt="Meubel house logos"
          src="/img/meubel-house-logos-05-8.png"
        />
        <div className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[34px] tracking-[0] leading-[normal]">
          Furniro
        </div>
      </Link>

      <nav className="flex items-center gap-[75px]">
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            to={item.href}
            className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-[45px]">
        <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
          <UserIcon className="w-[23px] h-[23px]" />
        </Button>
        <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
          <SearchIcon className="w-[23px] h-[23px]" />
        </Button>
        <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
          <HeartIcon className="w-[23px] h-[23px]" />
        </Button>
        <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
          <ShoppingCartIcon className="w-[23px] h-[23px]" />
        </Button>
      </div>
    </header>
  );
};
