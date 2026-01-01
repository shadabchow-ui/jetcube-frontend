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
    <header className="w-full h-[90px] bg-black">
      <div className="w-full max-w-[1286px] h-full mx-auto px-[54px] flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <div className="text-white font-extrabold text-[26px] tracking-wide">
            JETCUBE
          </div>
        </Link>

        {/* NAV */}
        <nav className="flex items-center gap-[60px]">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="text-white text-sm font-medium uppercase tracking-wide hover:opacity-70 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ICONS */}
        <div className="flex items-center gap-[28px] text-white">
          <Button variant="ghost" size="icon" className="p-0 text-white" asChild>
            <Link to="/account">
              <UserIcon className="w-5 h-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="p-0 text-white" asChild>
            <Link to="/search">
              <SearchIcon className="w-5 h-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="p-0 text-white" asChild>
            <Link to="/wishlist">
              <HeartIcon className="w-5 h-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="p-0 text-white" asChild>
            <Link to="/cart-sidebar">
              <ShoppingCartIcon className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default HeaderSection;



