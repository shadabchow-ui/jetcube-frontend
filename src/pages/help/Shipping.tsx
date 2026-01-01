import React from "react";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function Shipping(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        <aside>
          <HelpSidebar active="shipping" />
        </aside>

        <main className="text-sm text-gray-800 leading-relaxed">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Shipping & Delivery</h1>
            <p className="text-gray-600">
              This page explains how shipping works on JETCUBE, how delivery
              estimates are calculated, and what to do if something goes wrong.
              Our goal is simple: clear expectations and fast resolution when
              reality doesn’t match the plan.
            </p>
          </header>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Order processing</h2>
            <p>
              After you place an order, it enters processing. Processing can
              include payment verification, order confirmation, and preparation
              for shipment. Some items ship quickly, while others may take
              additional time due to packaging, inventory checks, or carrier
              scheduling.
            </p>
            <p>
              If your order contains multiple items, they may ship separately.
              When that happens, you may receive multiple tracking numbers and
              deliveries on different days. This is common when items come from
              different fulfillment locations.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Shipping options and costs</h2>
            <p>
              Shipping options and costs (when applicable) are shown at checkout.
              The available options can vary by item, destination, weight, and
              carrier availability. Some orders may qualify for promotional
              shipping offers, which will be clearly displayed before you place
              the order.
            </p>
            <p>
              If you see more than one shipping option, the difference usually
              reflects speed and carrier service level. If you do not see
              multiple options, it typically means only one service level is
              available for that item and destination.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Delivery estimates</h2>
            <p>
              Delivery estimates are predictions based on several factors, such
              as item availability, handling time, distance, and carrier
              performance. While we work to make estimates accurate, delivery
              times can be affected by real-world events like weather, traffic,
              peak-season volume, or carrier delays.
            </p>

            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
              <div className="font-semibold">How estimates are generated</div>
              <p className="text-gray-700">
                JETCUBE may use automated systems (including AI-assisted
                estimation models) to predict delivery windows. These systems
                use patterns such as carrier transit history, destination
                distance, and fulfillment timing. They are designed to improve
                accuracy over time — but they are still estimates, not a
                guarantee.
              </p>
              <p className="text-gray-700">
                If your order has a delivery window, we recommend using that
                window as your planning guide rather than assuming a specific
                time of day.
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Tracking your package</h2>
            <p>
              Once your order ships, you’ll typically receive tracking details.
              Tracking updates may take time to appear after the label is
              created. It’s normal for tracking to show limited movement early
              on, especially during initial carrier intake or after-hours
              scanning.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Label created:</span> The carrier
                label exists, but the package may not have been scanned yet.
              </li>
              <li>
                <span className="font-semibold">In transit:</span> The package is
                moving through the carrier network.
              </li>
              <li>
                <span className="font-semibold">Out for delivery:</span> The
                package is on a local vehicle for delivery.
              </li>
              <li>
                <span className="font-semibold">Delivered:</span> The carrier has
                marked the package as delivered.
              </li>
            </ul>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Common delivery issues</h2>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="font-semibold mb-2">Delivery is late</div>
                <p className="text-gray-700">
                  If your package is late, start by checking tracking for the
                  most recent scan. If there hasn’t been an update for a while,
                  it may be delayed in transit or waiting for carrier movement.
                </p>
                <p className="text-gray-700 mt-2">
                  If the delivery window has passed, contact JETCUBE support so
                  we can help confirm status and next steps.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="font-semibold mb-2">Marked delivered, not received</div>
                <p className="text-gray-700">
                  Sometimes carriers mark a package as delivered slightly early
                  or deliver to a nearby location (front desk, mailroom, or
                  neighbor). Check the delivery area and ask anyone in your
                  household who may have brought it inside.
                </p>
                <p className="text-gray-700 mt-2">
                  If it still can’t be found, contact support and we’ll help you
                  investigate.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="font-semibold mb-2">Wrong address or incomplete address</div>
                <p className="text-gray-700">
                  If an address is incorrect, delivery may fail or be returned
                  to sender. If you notice an error right after checkout,
                  contact support immediately. In some cases, we can update
                  carrier instructions; in others, changes may not be possible
                  after shipment.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="font-semibold mb-2">Package damaged</div>
                <p className="text-gray-700">
                  If an item arrives damaged, keep the packaging (if possible)
                  and contact support. We’ll help you with the best resolution
                  based on item type and availability.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">International shipping</h2>
            <p>
              If international shipping is available for an item, it will be
              shown at checkout. International deliveries may involve customs
              processing, local carrier handoffs, and additional time. Duties or
              taxes (if applicable) are typically governed by the destination
              country and may not be included unless explicitly stated at
              checkout.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Address safety tips</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use a complete address (unit numbers, building codes, etc.).</li>
              <li>Double-check spelling for street names and cities.</li>
              <li>
                If you live in a building, add delivery instructions when
                possible (front desk, call box, gate code).
              </li>
              <li>
                If packages are frequently stolen in your area, consider a
                secure delivery location when available.
              </li>
            </ul>
          </section>

          <section className="space-y-4 mb-2">
            <h2 className="text-lg font-semibold">Need help?</h2>
            <p>
              If you need assistance with shipping, tracking, or a delivery
              issue, contact JETCUBE support with your order number and a short
              description of the problem. The more specific you are, the faster
              we can help.
            </p>
            <p className="text-gray-700">
              For return-related questions, please review our Returns & Refunds
              policy page.
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
