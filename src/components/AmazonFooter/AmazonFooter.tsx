import React from "react";

type LinkItem = { label: string; href: string };
type LinkColumn = { title: string; links: LinkItem[] };

const topColumns: LinkColumn[] = [
  {
    title: "Get to Know Us",
    links: [
      { label: "Careers", href: "#" },
      { label: "Newsletter", href: "#" },
      { label: "About Jetcube", href: "#" },
      { label: "Accessibility", href: "#" },
      { label: "Sustainability", href: "#" },
      { label: "Press Center", href: "#" },
      { label: "Investor Relations", href: "#" },
      { label: "Devices", href: "#" },
    ],
  },
  {
    title: "Make Money with Us",
    links: [
      { label: "Sell on Jetcube", href: "#" },
      { label: "Sell apps on Jetcube", href: "#" },
      { label: "Supply to Jetcube", href: "#" },
      { label: "Protect & Build Your Brand", href: "#" },
      { label: "Become an Affiliate", href: "#" },
      { label: "Become a Partner", href: "#" },
      { label: "Advertise Your Products", href: "#" },
      { label: "See More Ways to Earn", href: "#" },
    ],
  },
  {
    title: "Jetcube Payment Products",
    links: [
      { label: "Jetcube Visa", href: "#" },
      { label: "Store Card", href: "#" },
      { label: "Secured Card", href: "#" },
      { label: "Business Card", href: "#" },
      { label: "Shop with Points", href: "#" },
      { label: "Credit Marketplace", href: "#" },
      { label: "Reload Your Balance", href: "#" },
      { label: "Gift Cards", href: "#" },
    ],
  },
  {
    title: "Let Us Help You",
    links: [
      { label: "Your Account", href: "#" },
      { label: "Your Orders", href: "#" },
      { label: "Shipping Rates & Policies", href: "#" },
      { label: "Returns & Replacements", href: "#" },
      { label: "Manage Your Content & Devices", href: "#" },
      { label: "Recalls and Product Safety Alerts", href: "#" },
      { label: "Help", href: "#" },
    ],
  },
];

const denseLinks: LinkColumn[] = [
  {
    title: "Jetcube Music",
    links: [{ label: "Stream millions of songs", href: "#" }],
  },
  {
    title: "Jetcube Ads",
    links: [{ label: "Reach customers wherever they spend time", href: "#" }],
  },
  {
    title: "Deals",
    links: [{ label: "Shop best deals daily", href: "#" }],
  },
  {
    title: "Prime",
    links: [{ label: "Fast delivery & exclusive perks", href: "#" }],
  },
  {
    title: "Business",
    links: [{ label: "Everything for your business", href: "#" }],
  },
  {
    title: "Fresh",
    links: [{ label: "Groceries delivered", href: "#" }],
  },
  {
    title: "Fashion",
    links: [{ label: "Find trending styles", href: "#" }],
  },
  {
    title: "Video",
    links: [{ label: "Watch movies & shows", href: "#" }],
  },
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
        className="w-full bg-[#37475a] hover:bg-[#485769] transition-colors"
        aria-label="Back to top"
      >
        <div className="py-4 text-center text-[13px] text-white">
          Back to top
        </div>
      </button>

      {/* Main footer columns */}
      <section className="bg-[#232f3e] text-white">
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
                      <a
                        href={l.href}
                        className="text-[13px] leading-4 text-[#ddd] hover:underline"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-10 border-t border-white/15" />
        </div>

        {/* Locale / logo strip */}
        <div className="bg-[#232f3e]">
          <div className="mx-auto max-w-[1000px] px-6 py-6 flex flex-col items-center gap-4 md:flex-row md:justify-center">
            {/* Logo (swap for your real logo if you have one) */}
            <a href="/" className="select-none">
              <span className="text-[22px] font-bold tracking-tight">
                jetcube
              </span>
            </a>

            <div className="flex flex-wrap items-center justify-center gap-2 md:ml-10">
              <button
                type="button"
                className="h-9 px-3 rounded-sm border border-white/30 text-[13px] text-[#ddd] hover:border-white/60"
              >
                English
              </button>
              <button
                type="button"
                className="h-9 px-3 rounded-sm border border-white/30 text-[13px] text-[#ddd] hover:border-white/60"
              >
                United States
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dense link grid (Amazon-style bottom mega links) */}
      <section className="bg-[#131a22] text-white">
        <div className="mx-auto max-w-[1000px] px-6 py-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {denseLinks.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <a
                  href={col.links[0]?.href || "#"}
                  className="block text-[12px] font-semibold text-[#ddd] hover:underline leading-4"
                >
                  {col.title}
                </a>
                <div className="mt-1 text-[11px] text-[#999] leading-4">
                  {col.links[0]?.label}
                </div>
              </nav>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-[#ddd]">
            <a href="#" className="hover:underline">
              Conditions of Use
            </a>
            <a href="#" className="hover:underline">
              Privacy Notice
            </a>
            <a href="#" className="hover:underline">
              Your Ads Privacy Choices
            </a>
          </div>

          <div className="mt-2 text-center text-[12px] text-[#ddd]">
            © {new Date().getFullYear()} Jetcube. All rights reserved.
          </div>
        </div>
      </section>
    </footer>
  );
};
