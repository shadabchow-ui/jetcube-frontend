// src/pages/help/AdsPrivacy.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function AdsPrivacy(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <HelpSidebar active="ads-privacy" />
          </aside>

          {/* Content */}
          <main className="min-w-0">
            <div className="mb-6">
              <div className="text-xs text-gray-500">
                <Link to="/" className="hover:underline">
                  Home
                </Link>{" "}
                <span className="mx-1">›</span>
                <Link to="/help" className="hover:underline">
                  Help
                </Link>{" "}
                <span className="mx-1">›</span>
                <span className="text-gray-700">Your Ads Privacy Choices</span>
              </div>

              <h1 className="text-2xl font-semibold mt-2">Your Ads Privacy Choices</h1>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                This page explains how interest-based advertising may work on JETCUBE and the choices
                you have to control advertising personalization. You can limit ad personalization
                while still using AI-powered shopping features like smarter search and product matching.
              </p>
            </div>

            <Section title="1) What are interest-based ads?">
              <p>
                Interest-based ads (sometimes called “personalized ads”) are ads selected using signals
                that suggest what you may be interested in. For example, if you browse home storage or
                skincare categories, you might see more ads related to those topics.
              </p>
              <p className="mt-2">
                This is different from ads that use your name. Interest-based ads typically rely on
                cookies, device/browser identifiers, and on-site activity signals.
              </p>
            </Section>

            <Section title="2) What signals may be used">
              <p>JETCUBE may use signals like:</p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>Pages and categories you view</li>
                <li>Search terms you enter</li>
                <li>Items you add to cart or save</li>
                <li>General device/browser information</li>
                <li>Approximate location (country/region)</li>
              </ul>
              <p className="mt-3">
                We use these signals to improve shopping relevance (search and discovery) and, if
                enabled, advertising relevance.
              </p>
            </Section>

            <Section title="3) Your choices">
              <div className="rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Choice A: Limit interest-based ads
                </div>
                <p className="text-sm text-gray-700">
                  If you limit interest-based ads, you may still see ads, but they may be less relevant.
                  This does not reduce the number of ads—only how they are selected.
                </p>
              </div>

              <div className="rounded border border-gray-200 bg-gray-50 p-4 mt-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Choice B: Browser controls
                </div>
                <p className="text-sm text-gray-700">
                  Most browsers let you block or delete cookies (including third-party cookies). Blocking
                  cookies may affect certain site features (like staying signed in).
                </p>
              </div>

              <div className="rounded border border-gray-200 bg-gray-50 p-4 mt-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Choice C: Device ad settings
                </div>
                <p className="text-sm text-gray-700">
                  Mobile devices often provide system-level options to limit ad tracking or reset your
                  advertising identifier. Check your device privacy settings for “Personalized Ads” or
                  similar controls.
                </p>
              </div>
            </Section>

            <Section title="4) AI shopping features vs ads">
              <p>
                JETCUBE is building AI-driven shopping features (search relevance, product matching, and
                assistant help). These features focus on product and query context—helping you find items
                faster and compare options more clearly.
              </p>
              <p className="mt-2">
                If you limit interest-based advertising, you can still benefit from AI-powered search and
                discovery on the site. Ad personalization and shopping relevance are related concepts, but
                they are not the same control.
              </p>
            </Section>

            <Section title="5) What this does not do">
              <ul className="list-disc pl-5 space-y-2">
                <li>It does not eliminate ads entirely.</li>
                <li>It does not stop data use required for security and fraud prevention.</li>
                <li>It does not prevent you from seeing deals or featured items.</li>
              </ul>
            </Section>

            <Section title="6) Related pages">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <Link to="/help/privacy-notice" className="text-blue-600 hover:underline">
                    Privacy Notice
                  </Link>
                </li>
                <li>
                  <Link to="/help/consumer-data" className="text-blue-600 hover:underline">
                    Consumer Data Requests
                  </Link>
                </li>
                <li>
                  <Link to="/help/contact" className="text-blue-600 hover:underline">
                    Contact JETCUBE
                  </Link>
                </li>
              </ul>
            </Section>

            <div className="mt-10 text-xs text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Reusable Section Component
------------------------------ */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
