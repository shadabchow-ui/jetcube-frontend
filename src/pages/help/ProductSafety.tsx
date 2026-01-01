import React from "react";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function ProductSafety(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        <aside>
          <HelpSidebar active="product-safety" />
        </aside>

        <main className="text-sm text-gray-800 leading-relaxed">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">
              Product Safety & Alerts
            </h1>
            <p className="text-gray-600">
              Your safety matters. This page explains how JETCUBE handles product
              safety information, how we communicate recalls and alerts, and what
              you should do if you believe an item you purchased is unsafe.
            </p>
          </header>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">What is a product safety alert?</h2>
            <p>
              A product safety alert is a notice about a product that may pose a
              risk of injury, hazard, or noncompliance with safety standards.
              Alerts can range from minor warnings (for example, updated usage
              instructions) to serious recalls where a product should no longer
              be used.
            </p>
            <p>
              Safety information can come from manufacturers, regulatory agencies,
              carriers, or customer reports. When we receive credible safety
              information, we evaluate it and take action appropriate to the risk.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">How JETCUBE responds</h2>
            <p>
              When a safety issue is identified, JETCUBE may take one or more of
              the following steps depending on severity and available evidence:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Add warnings or updated instructions to the product listing
              </li>
              <li>
                Temporarily pause sales while we review documentation
              </li>
              <li>
                Remove the product from the store if risk is confirmed or
                unresolved
              </li>
              <li>
                Notify customers who purchased the affected item when we have
                reliable contact/order information
              </li>
              <li>
                Provide next-step guidance (return, refund, replacement, or
                manufacturer remedy) when applicable
              </li>
            </ul>
            <p>
              Our goal is fast containment and clear communication. Even when the
              facts are still being confirmed, we prioritize preventing harm.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Recalls</h2>
            <p>
              A recall is typically issued by a manufacturer or regulator when a
              product has been determined to pose a safety risk. If a product on
              JETCUBE is recalled, the remedy can vary:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Refund:</span> You may receive a
                full or partial refund depending on recall terms and product type.
              </li>
              <li>
                <span className="font-semibold">Replacement:</span> A corrected
                product or component may be offered.
              </li>
              <li>
                <span className="font-semibold">Repair:</span> Some recalls provide
                a repair kit or service.
              </li>
              <li>
                <span className="font-semibold">Stop-use notice:</span> You may be
                advised to stop using the product immediately.
              </li>
            </ul>
            <p>
              If you believe an item you purchased may be recalled, stop using it
              until you confirm the correct guidance.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">What you should do</h2>
            <p>
              If you believe a product you bought on JETCUBE is unsafe, take the
              following steps:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <span className="font-semibold">Stop using the product</span> if
                continued use could cause harm.
              </li>
              <li>
                <span className="font-semibold">Document the issue</span> with a
                brief description and photos if possible (damage, labeling, etc.).
              </li>
              <li>
                <span className="font-semibold">Contact JETCUBE support</span> with
                your order number and what happened.
              </li>
              <li>
                <span className="font-semibold">Follow guidance</span> on disposal,
                returns, or manufacturer remedies if provided.
              </li>
            </ol>
            <p>
              If there is an immediate danger, take appropriate safety steps
              first. JETCUBE support can help you with the shopping and order side
              of the issue, including refunds or return instructions when applicable.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">How we communicate alerts</h2>
            <p>
              When we need to communicate a safety alert, we may do so through the
              Help Center, on the product page, or by contacting customers who
              purchased the affected item. Depending on the nature of the alert,
              we may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>What the issue is and why it matters</li>
              <li>Which products or batches are affected (when known)</li>
              <li>Stop-use guidance (when required)</li>
              <li>What remedy is available (refund, replacement, repair)</li>
              <li>How to reach support for next steps</li>
            </ul>
            <p>
              We focus on clear language and practical steps. If you receive an
              alert and aren’t sure whether it applies to you, contact support and
              include your order number so we can check.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">AI-assisted detection (what it means)</h2>
            <p>
              JETCUBE is building AI-driven shopping features across search,
              product research, and customer support. For product safety, automated
              systems may help detect risk signals earlier — for example:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Identifying unusual patterns in defect reports or complaints</li>
              <li>Flagging listings with inconsistent specs, warnings, or labels</li>
              <li>Highlighting items with missing safety information where expected</li>
              <li>Helping route safety-related tickets to faster review</li>
            </ul>
            <p>
              AI tools help surface signals, but safety actions require review.
              If you ever believe an item is unsafe, the best step is still to
              contact support so a human can verify the situation and provide
              guidance.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">What JETCUBE does not do</h2>
            <p>
              JETCUBE works to provide safe products and accurate information, but
              there are important limits:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                We do not provide medical advice or diagnosis. For health questions,
                consult a qualified professional.
              </li>
              <li>
                We do not guarantee that every safety issue can be detected before
                purchase, especially if information is missing or inaccurate at the
                source.
              </li>
              <li>
                We do not replace manufacturer instructions, warnings, or labeling.
              </li>
            </ul>
          </section>

          <section className="space-y-4 mb-2">
            <h2 className="text-lg font-semibold">Need help?</h2>
            <p>
              If you have a safety concern, contact JETCUBE with your order number,
              the product name, and a brief description of the issue. If you have
              photos, they can help speed up review.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <a href="/help/contact" className="text-blue-600 hover:underline">
                Contact JETCUBE
              </a>
              <a href="/help/returns" className="text-blue-600 hover:underline">
                Returns & Refunds
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
