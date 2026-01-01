// /Applications/product/src/pages/help/PrivacyNotice.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function PrivacyNotice(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <HelpSidebar active="privacy-notice" />
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
                <span className="text-gray-700">Privacy Notice</span>
              </div>

              <h1 className="text-2xl font-semibold mt-2">Privacy Notice</h1>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                This Privacy Notice explains how JETCUBE collects, uses, and shares information when
                you use our website, apps, and services (collectively, the “Services”). It also
                explains your privacy choices and how to contact us with questions or requests.
              </p>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                This page is written to be clear and practical. It is not legal advice. Your rights
                may vary depending on where you live.
              </p>
            </div>

            <Section title="1) Information we collect">
              <p>
                We collect information to provide and improve the Services, process orders, prevent
                fraud, and personalize your shopping experience. The information we collect depends
                on how you use JETCUBE.
              </p>

              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">A) Information you provide</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                  <li>Account details (name, email, password)</li>
                  <li>Shipping and billing information</li>
                  <li>Order details and communications with support</li>
                  <li>Reviews, ratings, and product questions (if you submit them)</li>
                </ul>
              </div>

              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">B) Information collected automatically</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                  <li>Device and browser information (type, version, settings)</li>
                  <li>IP address and general location (approximate)</li>
                  <li>Pages you view, searches you run, clicks and interactions</li>
                  <li>Cookies and similar technologies (where enabled)</li>
                </ul>
              </div>

              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">C) Information from service providers</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                  <li>Payment processing confirmation (not full card numbers)</li>
                  <li>Shipping and delivery status updates from carriers</li>
                  <li>Fraud prevention signals and risk checks (where applicable)</li>
                </ul>
              </div>
            </Section>

            <Section title="2) How we use information">
              <p>
                We use information to operate the Services and to make shopping faster, safer, and
                clearer. Examples include:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>Processing orders, payments, shipping, returns, and refunds</li>
                <li>Providing customer support and resolving disputes</li>
                <li>Detecting and preventing fraud and abuse</li>
                <li>Improving site performance, reliability, and feature quality</li>
                <li>Personalizing shopping results (where enabled)</li>
              </ul>
            </Section>

            <Section title="3) AI-driven features (important)">
              <p>
                JETCUBE is building an AI-driven retail experience, which may include AI-assisted
                search, product matching, product summaries, and assistant-style help. These systems
                rely on signals such as your search query, category browsing, and product attributes
                to improve relevance.
              </p>
              <p className="mt-3">
                We use AI to make the experience more useful—not to invade your privacy. When we use
                automated systems, we aim to keep data use proportional to the purpose: better search,
                clearer comparisons, safer transactions, and faster support.
              </p>
              <p className="mt-3">
                AI outputs can be imperfect. Always verify important information (sizing, compatibility,
                safety warnings) before purchasing.
              </p>
            </Section>

            <Section title="4) How we share information">
              <p>
                We do not sell your personal information in the ordinary sense. We may share
                information in these situations:
              </p>

              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Service providers</div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  We share information with vendors that help run the Services (payment processing,
                  shipping, customer support tooling, analytics, security). They are permitted to use
                  the information only to perform services for us.
                </p>
              </div>

              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Legal and safety</div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  We may share information if required by law, to respond to lawful requests, or to
                  protect the rights, safety, and security of customers, the public, and JETCUBE.
                </p>
              </div>

              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Business operations</div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  If JETCUBE is involved in a merger, acquisition, or asset sale, information may be
                  transferred as part of that transaction, subject to appropriate protections.
                </p>
              </div>
            </Section>

            <Section title="5) Cookies and similar technologies">
              <p>
                We use cookies and similar technologies to enable core site functions (like
                authentication and cart), remember preferences, measure performance, and (where
                enabled) personalize content.
              </p>
              <p className="mt-3">
                Most browsers let you control cookies through settings. If you block cookies, some
                features may not function properly.
              </p>
              <p className="mt-3">
                For ad-related privacy choices, see{" "}
                <Link to="/help/ads-privacy" className="text-blue-600 hover:underline">
                  Your Ads Privacy Choices
                </Link>
                .
              </p>
            </Section>

            <Section title="6) Data retention">
              <p>
                We keep information for as long as needed to provide the Services, comply with legal
                obligations, resolve disputes, and enforce agreements. Retention periods vary
                depending on the type of information and the purpose.
              </p>
              <p className="mt-3">
                For example, we may retain transaction records for accounting and compliance, and we
                may retain security logs to prevent fraud and abuse.
              </p>
            </Section>

            <Section title="7) Your privacy choices and rights">
              <p>
                Depending on your location, you may have privacy rights such as accessing,
                correcting, or deleting your personal information. You can also make certain choices
                about marketing communications and ad personalization.
              </p>

              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Consumer Data Requests</div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  To request access, deletion, or correction of certain personal information, visit{" "}
                  <Link to="/help/consumer-data" className="text-blue-600 hover:underline">
                    Consumer Data Requests
                  </Link>
                  .
                </p>
              </div>

              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Marketing preferences</div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  You can unsubscribe from marketing emails using the link in the email. Some
                  transactional emails (order confirmations, shipping updates) will still be sent
                  because they are required to complete your purchases.
                </p>
              </div>
            </Section>

            <Section title="8) Security">
              <p>
                We use reasonable administrative, technical, and physical safeguards designed to
                protect information. No system is perfectly secure, but we work continuously to
                improve defenses and detect suspicious activity.
              </p>
              <p className="mt-3">
                You also play a role: use a strong password, do not reuse passwords across services,
                and notify us if you suspect unauthorized access.
              </p>
            </Section>

            <Section title="9) Children’s privacy">
              <p>
                JETCUBE is not intended for use by children. We do not knowingly collect personal
                information from children. If you believe a child has provided personal information,
                contact us so we can take appropriate steps.
              </p>
            </Section>

            <Section title="10) Changes to this Privacy Notice">
              <p>
                We may update this Privacy Notice from time to time. Changes take effect when posted.
                Your continued use of the Services after changes are posted means you accept the
                updated notice.
              </p>
            </Section>

            <Section title="11) Contact">
              <p>
                Questions about privacy? Contact us here:{" "}
                <Link to="/help/contact" className="text-blue-600 hover:underline">
                  /help/contact
                </Link>
                .
              </p>
            </Section>

            <Section title="Related pages">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <Link to="/help/ads-privacy" className="text-blue-600 hover:underline">
                    Your Ads Privacy Choices
                  </Link>
                </li>
                <li>
                  <Link to="/help/consumer-data" className="text-blue-600 hover:underline">
                    Consumer Data Requests
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

