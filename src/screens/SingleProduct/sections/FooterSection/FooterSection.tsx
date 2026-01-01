import React from "react";

export const FooterSection = (): JSX.Element => {
  return (
    <footer className="w-full mt-16">
      {/* Back to top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors"
      >
        <div className="py-4 text-center text-[13px] text-white">
          Back to top
        </div>
      </button>

      {/* Main footer */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-[1100px] px-6 py-12">
          <div className="grid grid-cols-2 gap-x-10 gap-y-10 md:grid-cols-4">
            <div>
              <h3 className="text-[15px] font-semibold mb-3">
                Get to Know Us
              </h3>
              <ul className="space-y-2 text-[13px] text-[#ccc]">
                <li>About Jetcube</li>
                <li>Careers</li>
                <li>Sustainability</li>
                <li>Press</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold mb-3">
                Make Money With Us
              </h3>
              <ul className="space-y-2 text-[13px] text-[#ccc]">
                <li>Sell on Jetcube</li>
                <li>Affiliate Program</li>
                <li>Advertise Products</li>
                <li>Brand Partnerships</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold mb-3">
                Payments
              </h3>
              <ul className="space-y-2 text-[13px] text-[#ccc]">
                <li>Jetcube Pay</li>
                <li>Gift Cards</li>
                <li>Promotions</li>
                <li>Secure Checkout</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold mb-3">
                Let Us Help You
              </h3>
              <ul className="space-y-2 text-[13px] text-[#ccc]">
                <li>Your Orders</li>
                <li>Shipping & Returns</li>
                <li>Account Settings</li>
                <li>Customer Support</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 flex flex-col items-center gap-4">
            <div className="text-[22px] font-bold tracking-tight">
              jetcube
            </div>

            <div className="flex gap-2 text-[13px] text-[#ccc]">
              <span className="border border-white/30 px-3 py-1">
                English
              </span>
              <span className="border border-white/30 px-3 py-1">
                United States
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom legal */}
      <section className="bg-[#0a0a0a] text-[#aaa]">
        <div className="mx-auto max-w-[1100px] px-6 py-6 text-center text-[12px] space-y-2">
          <div className="flex justify-center gap-4">
            <span className="hover:underline cursor-pointer">
              Conditions of Use
            </span>
            <span className="hover:underline cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:underline cursor-pointer">
              Your Ads Privacy Choices
            </span>
          </div>
          <div>
            © {new Date().getFullYear()} Jetcube. All rights reserved.
          </div>
        </div>
      </section>
    </footer>
  );
};

export default FooterSection;



