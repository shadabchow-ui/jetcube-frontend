// src/pages/help/Contact.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function Contact(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <HelpSidebar active="contact" />
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
                <span className="text-gray-700">Contact JETCUBE</span>
              </div>

              <h1 className="text-2xl font-semibold mt-2">Contact JETCUBE</h1>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                Need help with an order, shipping, returns, payments, or a product question? Use the
                options below. The fastest resolution usually happens when you include the right
                details up front—order number, the item, and what went wrong.
              </p>
            </div>

            <Section title="1) Fastest way to get help">
              <p>
                The quickest option is to message support with your order number and a short description.
                If your issue involves shipping or delivery, include the tracking number and delivery date
                if you have them.
              </p>

              <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">What to include</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                  <li>Order number (or the email used at checkout)</li>
                  <li>Product name (or a link to the product page)</li>
                  <li>Issue type: shipping / returns / payment / product / account</li>
                  <li>What happened (2–4 sentences, clear timeline)</li>
                  <li>Photos (if damaged/defective/wrong item)</li>
                </ul>
              </div>
            </Section>

            <Section title="2) Common issues (quick links)">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Delivery late or tracking stuck →{" "}
                  <Link to="/help/shipping" className="text-blue-600 hover:underline">
                    Shipping &amp; Delivery
                  </Link>
                </li>
                <li>
                  Return, refund, replacement →{" "}
                  <Link to="/help/returns" className="text-blue-600 hover:underline">
                    Returns &amp; Refunds
                  </Link>
                </li>
                <li>
                  Charge looks wrong, refund timing →{" "}
                  <Link to="/help/payments" className="text-blue-600 hover:underline">
                    Payments
                  </Link>
                </li>
                <li>
                  Product hazard or recall concern →{" "}
                  <Link to="/help/product-safety" className="text-blue-600 hover:underline">
                    Product Safety &amp; Recalls
                  </Link>
                </li>
                <li>
                  Privacy / data request →{" "}
                  <Link to="/help/consumer-data" className="text-blue-600 hover:underline">
                    Consumer Data Requests
                  </Link>
                </li>
              </ul>
            </Section>

            <Section title="3) Response times">
              <p>
                We aim to respond as quickly as possible. Response time can vary based on volume,
                the complexity of your issue, and whether verification is required (for example,
                payment disputes or data requests).
              </p>
              <p className="mt-2">
                If we need more details, your case may pause until we receive them—so including the
                correct info up front saves time.
              </p>
            </Section>

            <Section title="4) AI-assisted support (what it means)">
              <p>
                JETCUBE uses automated tools (including AI-assisted routing) to help triage support
                requests—so shipping issues go to shipping, payment issues go to billing, and safety
                reports get priority review.
              </p>
              <p className="mt-2">
                Automation helps reduce wait time, but if you need a human review, tell us directly
                and we’ll make sure the right person looks at it.
              </p>
            </Section>

            <Section title="5) Safety and urgent concerns">
              <p>
                If your issue involves a potential hazard (smoke, overheating, sparks, choking risk,
                chemical exposure, or injury), stop using the product and contact us immediately with
                photos and order details.
              </p>
              <p className="mt-2">
                For product safety guidance, see{" "}
                <Link to="/help/product-safety" className="text-blue-600 hover:underline">
                  Product Safety &amp; Recalls
                </Link>
                .
              </p>
            </Section>

            <Section title="6) Privacy and data requests">
              <p>
                If you are requesting access, deletion, or correction of personal data, submit a
                Consumer Data Request and include the email used for your account.
              </p>
              <p className="mt-2">
                Learn more:{" "}
                <Link to="/help/consumer-data" className="text-blue-600 hover:underline">
                  Consumer Data Requests
                </Link>
                .
              </p>
            </Section>

            <Section title="7) Related pages">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <Link to="/help/shipping" className="text-blue-600 hover:underline">
                    Shipping &amp; Delivery
                  </Link>
                </li>
                <li>
                  <Link to="/help/returns" className="text-blue-600 hover:underline">
                    Returns &amp; Refunds
                  </Link>
                </li>
                <li>
                  <Link to="/help/payments" className="text-blue-600 hover:underline">
                    Payments
                  </Link>
                </li>
                <li>
                  <Link to="/help/privacy-notice" className="text-blue-600 hover:underline">
                    Privacy Notice
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
