import React from "react";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function Returns(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        <aside>
          <HelpSidebar active="returns" />
        </aside>

        <main className="text-sm text-gray-800 leading-relaxed">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Returns & Refunds</h1>
            <p className="text-gray-600">
              This page explains how returns and refunds work on JETCUBE, what is
              typically eligible for return, and what to do if an item arrives
              damaged or incorrect. Our goal is straightforward: clear rules,
              reasonable timelines, and a process that doesn’t waste your time.
            </p>
          </header>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Return window</h2>
            <p>
              Many items are eligible for return within a return window that
              starts on the delivery date. If an item has a different return
              window, it should be shown during checkout or on the product page.
              If you’re unsure, contact support with your order number and we’ll
              help confirm eligibility.
            </p>
            <p>
              Return windows exist to keep the process fair for both customers
              and the store, and to ensure products can be restocked safely. If
              you miss the return window, you can still contact support — in
              some cases we may be able to help depending on the situation.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Eligibility basics</h2>
            <p>
              To be eligible for a return, items generally need to be in their
              original condition, with original packaging when possible. Some
              categories may require the item to be unopened or unused.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">New and unused:</span> The item
                should not show signs of wear or damage caused after delivery.
              </li>
              <li>
                <span className="font-semibold">Complete:</span> Include
                accessories, parts, manuals, and anything that came in the box.
              </li>
              <li>
                <span className="font-semibold">Packaged safely:</span> Use
                protective packaging to prevent damage in transit.
              </li>
            </ul>
            <p>
              If an item arrives damaged, incorrect, or missing parts, that’s a
              different category than a standard “changed my mind” return. See
              the section below on issues at delivery.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Non-returnable items</h2>
            <p>
              Some items may not be eligible for return due to safety, hygiene,
              or regulatory reasons. The specific non-returnable categories can
              vary, but commonly include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Final sale or clearance items (when marked as final sale)</li>
              <li>Personal care items that have been opened or used</li>
              <li>Perishable goods</li>
              <li>Gift cards or digital credits (once delivered)</li>
              <li>Items marked non-returnable on the product page</li>
            </ul>
            <p>
              If a product is non-returnable, we aim to label that clearly.
              If you believe something was misrepresented or delivered in the
              wrong condition, contact support — we’ll look at the specific case.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Issues at delivery</h2>
            <p>
              If your item arrives damaged, defective, incorrect, or missing
              parts, the fastest path is to contact support as soon as possible.
              In many cases, we can offer a replacement, refund, or another
              resolution depending on availability and the type of issue.
            </p>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="font-semibold mb-2">Item arrived damaged</div>
                <p className="text-gray-700">
                  If the packaging or product is visibly damaged, keep the
                  packaging if you can, and contact support. Photos can help
                  speed up resolution.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="font-semibold mb-2">Wrong item received</div>
                <p className="text-gray-700">
                  If you received a different item than you ordered, contact
                  support with your order number and what you received. We’ll
                  help arrange the correct item or a refund.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="font-semibold mb-2">Missing parts or accessories</div>
                <p className="text-gray-700">
                  Sometimes items ship with multiple components. If something is
                  missing, contact support and we’ll help determine whether a
                  part can be sent or if a return/replacement is required.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="font-semibold mb-2">Defective or not working</div>
                <p className="text-gray-700">
                  If the item doesn’t function as expected, contact support.
                  We may ask for a short description of the issue to help route
                  the fastest resolution.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">How refunds work</h2>
            <p>
              Refunds are typically issued to the original payment method once
              the return is received and reviewed. Refund timing can vary based
              on your payment provider. Some refunds appear quickly; others may
              take additional time to post.
            </p>
            <p>
              In certain situations, refunds may be issued as store credit, such
              as when the original payment method is unavailable or for specific
              promotional purchases. If store credit applies, it should be made
              clear during the resolution process.
            </p>
            <p className="text-gray-700">
              If you return multiple items from one order, you may receive
              multiple refund transactions depending on how the order was shipped
              or processed.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Return shipping</h2>
            <p>
              Return shipping rules depend on the reason for return and the
              product category. If the return is due to damage, defect, or an
              incorrect item, we typically work with you to resolve the issue
              in a fair way. If the return is due to preference (for example,
              “changed my mind”), return shipping may apply.
            </p>
            <p>
              If a prepaid label is provided, follow the instructions carefully.
              If you ship with your own label, keep proof of shipment and
              tracking information until the return is fully resolved.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">AI-assisted support (what it means)</h2>
            <p>
              JETCUBE is building AI-driven shopping features such as assistant
              help and smarter search. In the returns process, automated systems
              may help route your request to the right path faster — for example,
              recognizing whether your issue is “damaged,” “wrong item,” or a
              standard return.
            </p>
            <p>
              These systems are designed to reduce wait time and make policies
              easier to navigate. If anything looks wrong or you need a human
              review, you can always contact support and request help.
            </p>
          </section>

          <section className="space-y-4 mb-2">
            <h2 className="text-lg font-semibold">Need help?</h2>
            <p>
              If you need help with a return, include your order number and a
              quick description of the issue. If it’s a delivery issue, sharing
              the tracking number and delivery date can help us resolve it
              faster.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <a href="/help/contact" className="text-blue-600 hover:underline">
                Contact JETCUBE
              </a>
              <a href="/help/shipping" className="text-blue-600 hover:underline">
                Shipping & Delivery
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
