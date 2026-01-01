// src/pages/Sustainability.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function Sustainability(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="text-xs text-gray-500">
            <Link to="/" className="hover:underline">
              Home
            </Link>{" "}
            <span className="mx-1">›</span>
            <span className="text-gray-700">Sustainability</span>
          </div>

          <h1 className="text-2xl font-semibold mt-2">Sustainability</h1>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            JETCUBE is building a modern commerce platform with a practical approach to sustainability:
            reduce waste where we can, choose smarter logistics, and keep the customer experience clear.
            We’re not here to make big promises—we’re here to improve the system step by step.
          </p>
        </div>

        <Section title="Our approach">
          <p>
            Sustainability isn’t one program. It’s hundreds of small choices across packaging, shipping,
            product information, and returns. We focus on actions that reduce waste without lowering
            reliability.
          </p>
        </Section>

        <Section title="Smarter shipping and fewer failed deliveries">
          <p>
            Failed deliveries create waste: extra miles, extra packaging handling, and more customer
            frustration. We work to reduce that by improving address quality, tracking clarity, and
            delivery expectations.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-gray-700">
            <li>Clearer delivery estimates so customers can plan</li>
            <li>Support for resolving delivery issues quickly</li>
            <li>Reducing re-shipments when a problem can be solved with better tracking and routing</li>
          </ul>
          <p className="mt-3">
            For shipping details, see{" "}
            <Link to="/help/shipping" className="text-blue-600 hover:underline">
              Shipping &amp; Delivery
            </Link>
            .
          </p>
        </Section>

        <Section title="Better product information (less return waste)">
          <p>
            Returns can be necessary, but unnecessary returns create waste in shipping and packaging.
            One of the most effective ways to reduce return waste is to improve product detail quality:
            accurate sizing, clear specs, and fewer surprises.
          </p>
          <p className="mt-3">
            JETCUBE is an AI-driven platform, and we’re using that to improve product clarity:
            extracting specs, organizing key details, and making comparisons easier—so you can buy with
            more confidence.
          </p>
        </Section>

        <Section title="Packaging and handling">
          <p>
            Packaging matters. Over time, we aim to encourage packaging practices that protect products
            without unnecessary excess. This includes right-sizing, reducing duplicate packaging, and
            improving damage prevention so items don’t need replacement shipments.
          </p>
          <p className="mt-3">
            Damaged shipments create waste and cost. Improving packaging quality (not just “more
            packaging”) reduces breakage and reduces repeat shipping.
          </p>
        </Section>

        <Section title="Product safety and quality standards">
          <p>
            Safety is part of sustainability. Unsafe or low-quality products lead to returns, disposal,
            and replacement shipping. We take product safety seriously and respond to credible reports.
          </p>
          <p className="mt-3">
            See{" "}
            <Link to="/help/product-safety" className="text-blue-600 hover:underline">
              Product Safety &amp; Recalls
            </Link>{" "}
            for how to report a concern.
          </p>
        </Section>

        <Section title="AI-driven improvements">
          <p>
            AI can help reduce waste when it’s used correctly. Our goal is to use AI to reduce friction
            and prevent avoidable problems, such as:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-gray-700">
            <li>Helping customers choose the right variant (size, color, compatibility)</li>
            <li>Spotting inconsistent or missing product specs that cause confusion</li>
            <li>Reducing repeat shipments by resolving issues faster</li>
            <li>Improving search relevance so customers find what they need in fewer steps</li>
          </ul>
          <p className="mt-3">
            We treat these as ongoing improvements—not marketing slogans.
          </p>
        </Section>

        <Section title="What you can do">
          <p>
            Customers play a role too. Small actions can reduce waste without sacrificing convenience:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-gray-700">
            <li>Double-check sizing and product specs before ordering</li>
            <li>Use accurate delivery instructions (building access codes, unit numbers)</li>
            <li>Report product issues clearly so we can correct them</li>
          </ul>
        </Section>

        <Section title="Contact">
          <p>
            Have questions or feedback about sustainability on JETCUBE? Contact us here:{" "}
            <Link to="/help/contact" className="text-blue-600 hover:underline">
              Contact JETCUBE
            </Link>
            .
          </p>
        </Section>

        <div className="mt-10 text-xs text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

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
