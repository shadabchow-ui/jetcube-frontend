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
      <Link to="/" className="flex items-center gap-[5px]">
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
        {navigationItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-[45px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-auto w-auto p-0"
          asChild
        >
          <Link to="/account">
            <UserIcon className="w-[23px] h-[23px]" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-auto w-auto p-0"
          asChild
        >
          <Link to="/search">
            <SearchIcon className="w-[22px] h-[22px]" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-auto w-auto p-0"
          asChild
        >
          <Link to="/wishlist">
            <HeartIcon className="w-[23px] h-[20.5px]" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-auto w-auto p-0"
          asChild
        >
          <Link to="/cart-sidebar">
            <ShoppingCartIcon className="w-[24px] h-[22px]" />
          </Link>
        </Button>
      </div>
    </header>
  );
};
