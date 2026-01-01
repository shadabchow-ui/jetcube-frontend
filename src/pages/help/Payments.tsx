// src/pages/help/Payments.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function Payments(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <HelpSidebar active="payments" />
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
                <span className="text-gray-700">Payments</span>
              </div>

              <h1 className="text-2xl font-semibold mt-2">Payments</h1>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                This page explains how payments work on JETCUBE, what payment methods may be supported,
                how authorizations and refunds are processed, and what to do if you see an unexpected
                charge. We keep it simple and transparent so you can shop with confidence.
              </p>
            </div>

            <Section title="1) Accepted payment methods">
              <p>
                Accepted payment methods are shown at checkout and may vary by region, product type,
                and seller logistics. Commonly supported methods include major credit and debit cards.
              </p>
              <p className="mt-2">
                If a payment option isn’t available for your order, it usually means the method is not
                supported for that specific purchase or destination.
              </p>
            </Section>

            <Section title="2) Payment authorization vs. final charge">
              <p>
                When you place an order, your payment provider may place an authorization hold to
                confirm funds are available. This is not always the final charge.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>
                  <span className="font-semibold text-gray-900">Authorization:</span> a temporary hold
                  that may appear as “pending.”
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Capture (final charge):</span> the
                  completed charge after the order is confirmed/processed.
                </li>
              </ul>
              <p className="mt-3">
                Some banks show authorizations immediately and release them later if the order changes
                or is canceled.
              </p>
            </Section>

            <Section title="3) Split shipments and multiple charges">
              <p>
                If an order ships in multiple packages, you may see multiple charges or partial captures
                depending on how the payment provider processes transactions. This can also happen if
                items come from different fulfillment sources.
              </p>
              <p className="mt-2">
                Your order confirmation should reflect the complete order total even if the payment
                posts in separate parts.
              </p>
            </Section>

            <Section title="4) Promotional credits and discounts">
              <p>
                If you use a promo code, discount, or store credit, it will be applied at checkout
                before you place your order. Discounts may have eligibility rules (minimum cart value,
                item restrictions, limited-time windows).
              </p>
              <p className="mt-2">
                If a discount doesn’t apply, double-check eligibility terms and item restrictions, or
                contact support with the code you used.
              </p>
            </Section>

            <Section title="5) Taxes">
              <p>
                Sales tax (or similar taxes) may be calculated at checkout based on your shipping
                address and applicable regulations. Tax amounts can vary by location and product type.
              </p>
            </Section>

            <Section title="6) Refunds">
              <p>
                Refunds are generally issued back to your original payment method. Timing depends on
                your bank/payment provider. Some refunds post quickly; others can take several business
                days to appear.
              </p>
              <p className="mt-2">
                For return-specific guidance, see{" "}
                <Link to="/help/returns" className="text-blue-600 hover:underline">
                  Returns &amp; Refunds
                </Link>
                .
              </p>
            </Section>

            <Section title="7) Chargebacks and disputes">
              <p>
                If you believe a charge is incorrect, we recommend contacting JETCUBE support first so
                we can resolve it quickly. Chargebacks (bank disputes) can take longer and may pause
                order-related actions while your bank investigates.
              </p>
              <p className="mt-3">
                If you do file a dispute with your bank, keep any order confirmations, tracking numbers,
                and support messages for reference.
              </p>
            </Section>

            <Section title="8) Unexpected charges or payment errors">
              <p>
                If you see an unexpected charge, first check whether it is a pending authorization or a
                final capture. Also check for split shipments. If it still looks wrong, contact us with:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>Your order number (if available)</li>
                <li>The amount and date of the charge</li>
                <li>The last 4 digits of the payment method (do not send full card numbers)</li>
              </ul>
              <p className="mt-3">
                Contact:{" "}
                <Link to="/help/contact" className="text-blue-600 hover:underline">
                  /help/contact
                </Link>
                .
              </p>
            </Section>

            <Section title="9) AI-driven fraud protection (what it means)">
              <p>
                JETCUBE uses automated systems (including AI-assisted signals) to help detect unusual
                activity and reduce fraud. This can include flagging suspicious checkout patterns,
                unusual address/device combinations, or high-risk transaction signals.
              </p>
              <p className="mt-2">
                In some cases, you may be asked to re-verify your payment method or confirm identity.
                These checks are intended to protect customers and the platform.
              </p>
            </Section>

            <Section title="10) Related pages">
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
                  <Link to="/help/privacy-notice" className="text-blue-600 hover:underline">
                    Privacy Notice
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
