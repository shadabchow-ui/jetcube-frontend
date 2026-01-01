// src/pages/Careers.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function Careers(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="text-xs text-gray-500">
            <Link to="/" className="hover:underline">
              Home
            </Link>{" "}
            <span className="mx-1">›</span>
            <span className="text-gray-700">Careers</span>
          </div>

          <h1 className="text-2xl font-semibold mt-2">Careers at JETCUBE</h1>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            JETCUBE is building an AI-driven retail platform designed for speed, clarity, and trust.
            If you want to work on modern ecommerce—search relevance, product data quality, and
            assistant-style UX—we’d love to hear from you.
          </p>
        </div>

        <Section title="Who we are">
          <p>
            We’re building a modern shopping experience where product discovery feels smart, product
            pages feel complete, and support actually helps. That means we care about details:
            performance, reliability, data quality, and clear policies.
          </p>
          <p className="mt-3">
            Our long-term direction is AI-native retail: better search, better comparisons, and tools
            that reduce decision fatigue for customers.
          </p>
        </Section>

        <Section title="How we work">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>
              <span className="font-semibold text-gray-900">Customer-first clarity:</span> we favor
              simple flows and clear language.
            </li>
            <li>
              <span className="font-semibold text-gray-900">High standards:</span> we ship improvements
              that don’t break what’s already working.
            </li>
            <li>
              <span className="font-semibold text-gray-900">Data quality matters:</span> clean product
              details are a feature, not a bonus.
            </li>
            <li>
              <span className="font-semibold text-gray-900">AI with guardrails:</span> useful automation,
              not hype.
            </li>
          </ul>
        </Section>

        <Section title="Teams we’re building">
          <p className="text-sm text-gray-700">
            Roles evolve as we grow, but these are the areas we care about:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-gray-700">
            <li>Frontend engineering (React, performance, UI systems)</li>
            <li>Backend engineering (APIs, indexing, reliability, scaling)</li>
            <li>Search & relevance (ranking, query understanding, evaluation)</li>
            <li>Data & analytics (catalog quality, pipelines, experimentation)</li>
            <li>Trust & safety (fraud prevention, policy tooling, safety workflows)</li>
            <li>Customer support operations (quality, tooling, escalation paths)</li>
          </ul>
        </Section>

        <Section title="What we look for">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>Clear communication and strong ownership</li>
            <li>Comfort working in fast-moving systems without breaking core flows</li>
            <li>Respect for customer trust, privacy, and safety</li>
            <li>Ability to simplify complex problems into shippable steps</li>
          </ul>
        </Section>

        <Section title="How to apply">
          <p>
            For now, the best way to reach us is through our support channel. In your message, include:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-gray-700">
            <li>The role area you’re interested in (e.g., Search, Frontend, Data)</li>
            <li>A short summary of relevant experience</li>
            <li>Links to a portfolio, GitHub, or work samples (if available)</li>
          </ul>
          <p className="mt-3">
            Apply here:{" "}
            <Link to="/help/contact" className="text-blue-600 hover:underline">
              Contact JETCUBE
            </Link>{" "}
            (include “Careers” in your message).
          </p>
        </Section>

        <Section title="Related links">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>
              <Link to="/about" className="text-blue-600 hover:underline">
                About JETCUBE
              </Link>
            </li>
            <li>
              <Link to="/press" className="text-blue-600 hover:underline">
                Press Center
              </Link>
            </li>
            <li>
              <Link to="/sustainability" className="text-blue-600 hover:underline">
                Sustainability
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
