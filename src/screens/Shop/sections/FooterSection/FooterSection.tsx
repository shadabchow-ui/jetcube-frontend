import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../../assets/logo.png";

type LinkItem = { label: string; to: string };
type LinkColumn = { title: string; links: LinkItem[] };

const topColumns: LinkColumn[] = [
  {
    title: "Get to Know Us",
    links: [
      { label: "Careers", to: "/careers" },
      { label: "Newsletter", to: "/newsletter" },
      { label: "About Jetcube", to: "/about" },
      { label: "Accessibility", to: "/help/accessibility" },
      { label: "Sustainability", to: "/sustainability" },
      { label: "Press Center", to: "/press" },
      { label: "Devices", to: "/help/devices" },
    ],
  },
  {
    title: "Shopping Confidence",
    links: [
      { label: "Shipping & Delivery", to: "/help/shipping" },
      { label: "Returns & Refunds", to: "/help/returns" },
      { label: "Payment Options", to: "/help/payments" },
      { label: "Product Safety & Recalls", to: "/help/product-safety" },
      { label: "Consumer Data Requests", to: "/help/consumer-data" },
      { label: "Your Ads Privacy Choices", to: "/help/ads-privacy" },
      { label: "Contact Jetcube", to: "/help/contact" },
      { label: "Help", to: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Conditions of Use", to: "/help/conditions-of-use" },
      { label: "Privacy Notice", to: "/help/privacy-notice" },
      { label: "Accessibility", to: "/help/accessibility" },
    ],
  },
  {
    title: "Discover & Experience",
    links: [
      { label: "Shop", to: "/shop" },
      { label: "Search", to: "/search" },
      { label: "Categories", to: "/shop" },
      { label: "Deals", to: "/shop" },
      { label: "New Arrivals", to: "/shop" },
      { label: "Trending", to: "/shop" },
    ],
  },
];

type DenseLink = { title: string; subtitle: string; to: string };

const denseLinks: DenseLink[] = [
  { title: "AI Search", subtitle: "Find the right fit faster", to: "/search" },
  { title: "Shopping Confidence", subtitle: "Policies & protections", to: "/help" },
  { title: "Shipping", subtitle: "Delivery speeds & options", to: "/help/shipping" },
  { title: "Returns", subtitle: "Easy returns & refunds", to: "/help/returns" },
  { title: "Payments", subtitle: "Ways to pay securely", to: "/help/payments" },
  { title: "Product Safety", subtitle: "Recalls & alerts", to: "/help/product-safety" },
  { title: "Consumer Data", subtitle: "Request or manage data", to: "/help/consumer-data" },
  { title: "Press", subtitle: "News & updates", to: "/press" },
];

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export const FooterSection = (): JSX.Element => {
  return (
    <footer className="w-full">
      {/* Back to top */}
      <button
        type="button"
        onClick={scrollToTop}
        className="w-full bg-[#0b0b0b] hover:bg-[#141414] transition-colors"
        aria-label="Back to top"
      >
        <div className="py-4 text-center text-[13px] text-white">
          Back to top
        </div>
      </button>

      {/* Main footer columns */}
      <section className="bg-[#111111] text-white">
        <div className="mx-auto max-w-[1000px] px-6 py-10">
          <div className="grid grid-cols-2 gap-x-10 gap-y-10 md:grid-cols-4">
            {topColumns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-[16px] font-bold leading-5 mb-3">
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-[13px] leading-4 text-[#d6d6d6] hover:text-white hover:underline"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-10 border-t border-white/10" />
        </div>

        {/* Locale / logo strip */}
        <div className="bg-[#0d0d0d]">
          <div className="mx-auto max-w-[1000px] px-6 py-6 flex flex-col items-center gap-4 md:flex-row md:justify-center">
            <Link to="/" className="flex items-center select-none">
              <img
                src={logo}
                alt="JETCUBE"
                className="h-[28px] w-auto opacity-90"
              />
            </Link>


            <div className="flex flex-wrap items-center justify-center gap-2 md:ml-10">
              <button
                type="button"
                className="h-9 px-3 rounded-sm border border-white/25 text-[13px] text-[#d6d6d6] hover:border-white/50 hover:text-white"
              >
                English
              </button>
              <button
                type="button"
                className="h-9 px-3 rounded-sm border border-white/25 text-[13px] text-[#d6d6d6] hover:border-white/50 hover:text-white"
              >
                United States
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dense link grid (bottom mega links) */}
      <section className="bg-[#000000] text-white">
        <div className="mx-auto max-w-[1000px] px-6 py-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {denseLinks.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <Link
                  to={col.to}
                  className="block text-[12px] font-semibold text-[#d6d6d6] hover:text-white hover:underline leading-4"
                >
                  {col.title}
                </Link>
                <div className="mt-1 text-[11px] text-[#9a9a9a] leading-4">
                  {col.subtitle}
                </div>
              </nav>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-[#d6d6d6] relative z-10">
            <Link
              to="/help/conditions-of-use"
              className="cursor-pointer hover:text-white hover:underline focus:outline-none focus:underline"
            >
              Conditions of Use
            </Link>

            <span className="opacity-40">|</span>

            <Link
              to="/help/privacy-notice"
              className="cursor-pointer hover:text-white hover:underline focus:outline-none focus:underline"
            >
              Privacy Notice
            </Link>

            <span className="opacity-40">|</span>

            <Link
              to="/help/ads-privacy"
              className="cursor-pointer hover:text-white hover:underline focus:outline-none focus:underline"
            >
              Your Ads Privacy Choices
            </Link>
          </div>


          <div className="mt-2 text-center text-[12px] text-[#d6d6d6]">
            © {new Date().getFullYear()} Jetcube. All rights reserved.
          </div>
        </div>
      </section>
    </footer>
  );
};


