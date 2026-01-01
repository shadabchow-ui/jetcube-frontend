// src/pages/Press.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function Press(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="text-xs text-gray-500">
            <Link to="/" className="hover:underline">
              Home
            </Link>{" "}
            <span className="mx-1">›</span>
            <span className="text-gray-700">Press</span>
          </div>

          <h1 className="text-2xl font-semibold mt-2">Press Center</h1>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            Welcome to the JETCUBE Press Center. This page provides a high-level overview of our
            platform, brand direction, and the best way to contact us for media inquiries.
          </p>
        </div>

        <Section title="About JETCUBE">
          <p>
            JETCUBE is an AI-driven ecommerce platform focused on faster discovery, clearer product
            decisions, and a smoother path from search to checkout. We’re building a modern shopping
            experience powered by smarter search, better product data, and assistant-style help.
          </p>
          <p className="mt-3">
            Our goal is to reduce the friction that makes online shopping feel slow—missing specs,
            confusing variants, inconsistent listings, and unclear policies.
          </p>
        </Section>

        <Section title="What makes us different">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>
              <span className="font-semibold text-gray-900">AI-powered discovery:</span> better matching
              between what you want and what’s available.
            </li>
            <li>
              <span className="font-semibold text-gray-900">Cleaner product pages:</span> organized details
              and fewer surprises.
            </li>
            <li>
              <span className="font-semibold text-gray-900">Assistant-style help:</span> support that can
              answer practical questions quickly.
            </li>
            <li>
              <span className="font-semibold text-gray-900">Trust-focused policies:</span> clear shipping,
              returns, and safety guidance.
            </li>
          </ul>
        </Section>

        <Section title="Media inquiries">
          <p>
            For press inquiries, please contact us through our support channel and include “Media Inquiry”
            in your message subject. If you’re requesting a quote, include your deadline and the topic.
          </p>
          <p className="mt-3">
            Contact page:{" "}
            <Link to="/help/contact" className="text-blue-600 hover:underline">
              Contact JETCUBE
            </Link>
            .
          </p>
        </Section>

        <Section title="Brand and product updates">
          <p>
            We’ll share key product and platform updates through our official channels. If you’re a
            journalist or creator covering ecommerce, AI, retail technology, or consumer shopping, we’re
            happy to provide platform context and direction.
          </p>
        </Section>

        <Section title="Helpful links">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>
              <Link to="/about" className="text-blue-600 hover:underline">
                About JETCUBE
              </Link>
            </li>
            <li>
              <Link to="/sustainability" className="text-blue-600 hover:underline">
                Sustainability
              </Link>
            </li>
            <li>
              <Link to="/help/privacy-notice" className="text-blue-600 hover:underline">
                Privacy Notice
              </Link>
            </li>
            <li>
              <Link to="/help/conditions-of-use" className="text-blue-600 hover:underline">
                Conditions of Use
              </Link>
            </li>
          </ul>
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
