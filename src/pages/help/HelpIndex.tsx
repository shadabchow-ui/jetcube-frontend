// src/pages/help/HelpIndex.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function HelpIndex(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <HelpSidebar />
          </aside>

          {/* Content */}
          <main className="min-w-0">
            <div className="mb-6">
              <div className="text-xs text-gray-500">
                <Link to="/" className="hover:underline">
                  Home
                </Link>{" "}
                <span className="mx-1">›</span>
                <span className="text-gray-700">Help</span>
              </div>

              <h1 className="text-2xl font-semibold mt-2">Help Center</h1>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                Find answers fast. Use the links below for shipping, returns, payments, and policies.
                If you need support, contact us with your order number for the fastest help.
              </p>
            </div>

            {/* Quick Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <HelpCard
                title="Shipping & Delivery"
                desc="Tracking, delivery estimates, address changes, and missing packages."
                to="/help/shipping"
              />
              <HelpCard
                title="Returns & Refunds"
                desc="Eligibility, return windows, return shipping, and refund timing."
                to="/help/returns"
              />
              <HelpCard
                title="Payments"
                desc="Authorizations, refunds, payment issues, and disputes."
                to="/help/payments"
              />
              <HelpCard
                title="Contact JETCUBE"
                desc="Message support for orders, account help, and urgent issues."
                to="/help/contact"
              />
            </div>

            {/* Policy Links */}
            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-3">Policies &amp; Legal</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                <li>
                  <Link to="/help/conditions-of-use" className="text-blue-600 hover:underline">
                    Conditions of Use
                  </Link>
                </li>
                <li>
                  <Link to="/help/privacy-notice" className="text-blue-600 hover:underline">
                    Privacy Notice
                  </Link>
                </li>
                <li>
                  <Link to="/help/accessibility" className="text-blue-600 hover:underline">
                    Accessibility
                  </Link>
                </li>
                <li>
                  <Link to="/help/ads-privacy" className="text-blue-600 hover:underline">
                    Your Ads Privacy Choices
                  </Link>
                </li>
              </ul>
            </div>

            {/* Safety + Data */}
            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-3">Safety &amp; Data</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                <li>
                  <Link to="/help/product-safety" className="text-blue-600 hover:underline">
                    Product Safety &amp; Recalls
                  </Link>
                </li>
                <li>
                  <Link to="/help/consumer-data" className="text-blue-600 hover:underline">
                    Consumer Data Requests
                  </Link>
                </li>
              </ul>
            </div>

            {/* AI Note */}
            <div className="mt-10 rounded border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                AI-powered shopping (what we’re building)
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                JETCUBE is an AI-driven retail platform. We’re building smarter search, product
                comparison, and assistant-style support to help you find the right item faster.
                You’ll always be able to contact support if you need human help.
              </p>
            </div>

            <div className="mt-10 text-xs text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function HelpCard({
  title,
  desc,
  to,
}: {
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded border border-gray-200 hover:border-gray-300 bg-white p-4"
    >
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-700 mt-1 leading-relaxed">{desc}</div>
    </Link>
  );
}
