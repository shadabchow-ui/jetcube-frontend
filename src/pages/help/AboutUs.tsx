// src/pages/AboutUs.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function AboutUs(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="text-xs text-gray-500">
            <Link to="/" className="hover:underline">
              Home
            </Link>{" "}
            <span className="mx-1">›</span>
            <span className="text-gray-700">About JETCUBE</span>
          </div>

          <h1 className="text-2xl font-semibold mt-2">About JETCUBE</h1>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            JETCUBE is an AI-driven commerce company built for modern shopping: faster discovery,
            clearer decisions, and fewer dead ends. We’re building a store where search feels smart,
            product pages feel complete, and help is actually helpful.
          </p>
        </div>

        <Section title="What we do">
          <p>
            JETCUBE brings together a broad catalog with tools that make it easier to find what you
            want—and understand what you’re buying. Instead of making you click through ten tabs and
            guess, we focus on clarity: the right details, upfront policies, and a smoother path from
            search to checkout.
          </p>
          <p className="mt-3">
            Our long-term direction is AI-native retail: AI-powered search, AI-assisted comparisons,
            and an assistant that can answer practical questions like “Will this fit?” “What’s the
            difference between these two?” and “What should I buy if my priority is durability?”
          </p>
        </Section>

        <Section title="Why we exist">
          <p>
            Shopping online is often slow and messy: listings are inconsistent, important specs are
            buried, and returns policies aren’t clear until something goes wrong. We built JETCUBE to
            reduce that friction.
          </p>
          <p className="mt-3">
            Our goal is to make the experience feel confident: you should know what you’re getting,
            when it arrives, and what your options are if it doesn’t work out.
          </p>
        </Section>

        <Section title="AI-driven, but human-centered">
          <p>
            We use AI to improve relevance and speed—not to make decisions for you. The job of our AI
            systems is to help you find better matches, summarize what matters, and surface details
            that usually get missed.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-gray-700">
            <li>
              <span className="font-semibold text-gray-900">Smarter search:</span> better results with
              fewer keywords.
            </li>
            <li>
              <span className="font-semibold text-gray-900">Clear comparisons:</span> side-by-side
              highlights that focus on real differences.
            </li>
            <li>
              <span className="font-semibold text-gray-900">Faster help:</span> support routing that
              gets you to the right answer faster.
            </li>
          </ul>
          <p className="mt-3">
            If you ever need a human review—especially for safety, payments, or order issues—you can
            contact support directly.
          </p>
        </Section>

        <Section title="Trust and safety">
          <p>
            A legit store is built on trust. We take product safety seriously, we value clear
            policies, and we’re building systems that reduce fraud and improve reliability.
          </p>
          <p className="mt-3">
            If you have a product safety concern, see{" "}
            <Link to="/help/product-safety" className="text-blue-600 hover:underline">
              Product Safety &amp; Recalls
            </Link>
            . For shipping and returns, see{" "}
            <Link to="/help/shipping" className="text-blue-600 hover:underline">
              Shipping &amp; Delivery
            </Link>{" "}
            and{" "}
            <Link to="/help/returns" className="text-blue-600 hover:underline">
              Returns &amp; Refunds
            </Link>
            .
          </p>
        </Section>

        <Section title="Where we’re going">
          <p>
            Over time, JETCUBE will keep expanding AI-powered shopping features:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-gray-700">
            <li>More accurate product attribute extraction (so PDPs are complete and consistent)</li>
            <li>Better sizing and fit guidance across categories</li>
            <li>Higher-quality recommendations based on what matters to you (price, durability, value)</li>
            <li>More transparent delivery estimates and fewer tracking surprises</li>
          </ul>
          <p className="mt-3">
            We’re building a platform that feels modern: fast, clear, and reliable.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Need help or have questions about JETCUBE? Visit{" "}
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
