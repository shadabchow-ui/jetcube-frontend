// src/pages/Newsletter.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function Newsletter(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="text-xs text-gray-500">
            <Link to="/" className="hover:underline">
              Home
            </Link>{" "}
            <span className="mx-1">›</span>
            <span className="text-gray-700">Newsletter</span>
          </div>

          <h1 className="text-2xl font-semibold mt-2">JETCUBE Newsletter</h1>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            Get the best of JETCUBE—new features, shopping tips, and curated updates—without the spam.
            This is the easiest way to stay in the loop as we roll out AI-powered search, smarter
            comparisons, and new categories.
          </p>
        </div>

        <Section title="What you’ll get">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>
              Product discovery updates (new search improvements, better filters, smarter results)
            </li>
            <li>
              Shopping guides (how to choose the right option, what to watch for, common mistakes)
            </li>
            <li>
              New category launches and trending picks
            </li>
            <li>
              Site updates that improve trust: shipping clarity, returns flow, safety alerts, and policy updates
            </li>
          </ul>
        </Section>

        <Section title="How often we email">
          <p>
            We aim for a reasonable cadence—typically weekly or biweekly depending on what’s shipping.
            If there’s an important change (like a major policy update or critical safety notice), we may
            email outside the regular schedule.
          </p>
        </Section>

        <Section title="AI-driven, not creepy">
          <p>
            JETCUBE is an AI-driven ecommerce brand, but our goal is usefulness, not invasive tracking.
            We may use basic engagement signals (like whether an email was opened) to improve what we send,
            and we may personalize content in a simple way (like category interests), but we keep it focused
            on making the newsletter more relevant—nothing weird.
          </p>
          <p className="mt-3">
            For more details, see{" "}
            <Link to="/help/privacy-notice" className="text-blue-600 hover:underline">
              Privacy Notice
            </Link>{" "}
            and{" "}
            <Link to="/help/ads-privacy" className="text-blue-600 hover:underline">
              Your Ads Privacy Choices
            </Link>
            .
          </p>
        </Section>

        <Section title="Sign up">
          <p>
            If you don’t have a signup form wired yet, you can still publish this page now and connect
            your form later. When you add the form, keep it simple: email field + consent text + submit.
          </p>

          <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-semibold text-gray-900 mb-2">Recommended signup form copy</div>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>
                <span className="font-semibold text-gray-900">Email:</span> (input)
              </p>
              <p>
                By subscribing, you agree to receive emails from JETCUBE. You can unsubscribe anytime.
              </p>
              <p className="text-xs text-gray-500">
                Tip: link “Privacy Notice” here once your form is live.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Unsubscribe and preferences">
          <p>
            Every newsletter email will include an unsubscribe link. If you want to adjust preferences
            (like only getting certain categories), we’ll support that as we expand the preference center.
          </p>
          <p className="mt-3">
            If you need help with subscription issues, contact us here:{" "}
            <Link to="/help/contact" className="text-blue-600 hover:underline">
              Contact JETCUBE
            </Link>
            .
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
            <li>
              <Link to="/help" className="text-blue-600 hover:underline">
                Help Center
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
