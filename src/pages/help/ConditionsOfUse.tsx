// /Applications/product/src/pages/help/ConditionsOfUse.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function ConditionsOfUse(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <HelpSidebar active="conditions-of-use" />
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
                <span className="text-gray-700">Conditions of Use</span>
              </div>

              <h1 className="text-2xl font-semibold mt-2">Conditions of Use</h1>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                These Conditions of Use (“Terms”) govern your access to and use of the JETCUBE
                website, apps, and services (collectively, the “Services”). By using the Services,
                you agree to these Terms. If you do not agree, do not use the Services.
              </p>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                Note: This page is written to be clear and practical. It is not legal advice. If you
                need legal guidance, consult a qualified attorney.
              </p>
            </div>

            <Section title="1) Who we are and what these Terms cover">
              <p>
                JETCUBE is an ecommerce platform that helps customers discover and purchase products.
                Some features of the Services may be AI-assisted (for example, search relevance,
                product summaries, and shopping assistance). These Terms apply to all visitors and
                users, including customers, account holders, and anyone who interacts with our
                content, tools, or support.
              </p>
              <p className="mt-3">
                Additional terms may apply to certain features (promotions, beta tools, or special
                categories). If so, we’ll present them to you at the time you use those features.
              </p>
            </Section>

            <Section title="2) Eligibility and account responsibilities">
              <p>
                You must be able to form a legally binding contract to use the Services. If you
                create an account, you are responsible for maintaining the confidentiality of your
                login credentials and for all activity that occurs under your account.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>Provide accurate account information and keep it up to date.</li>
                <li>Use a strong password and do not share your credentials.</li>
                <li>
                  Notify us promptly if you believe your account has been compromised.
                </li>
              </ul>
            </Section>

            <Section title="3) Orders, pricing, and availability">
              <p>
                Product listings may change over time. Prices, promotions, availability, product
                descriptions, and shipping estimates can be updated without notice. We aim for
                accuracy, but errors can occur.
              </p>
              <p className="mt-3">
                When you place an order, you are making an offer to purchase. We may accept, reject,
                or cancel an order in whole or in part, including for reasons such as suspected
                fraud, pricing errors, inventory issues, or address verification problems.
              </p>
              <p className="mt-3">
                If we cancel an order after you’ve been charged, we will issue a refund consistent
                with our policies.
              </p>
            </Section>

            <Section title="4) Payments and authorizations">
              <p>
                By providing a payment method, you represent you are authorized to use it. Your
                payment provider may place an authorization hold when you submit an order. Final
                charges and refund timing can vary by bank or payment provider.
              </p>
              <p className="mt-3">
                For details, see{" "}
                <Link to="/help/payments" className="text-blue-600 hover:underline">
                  Payments
                </Link>{" "}
                and{" "}
                <Link to="/help/returns" className="text-blue-600 hover:underline">
                  Returns &amp; Refunds
                </Link>
                .
              </p>
            </Section>

            <Section title="5) Shipping, delivery, and risk of loss">
              <p>
                Shipping options, carriers, and delivery estimates depend on location, inventory,
                and logistics. Delivery dates are estimates and not guarantees. Risk of loss and
                title may pass to you upon delivery (or as otherwise required by law).
              </p>
              <p className="mt-3">
                If a package is delayed, missing, or shows suspicious tracking, contact support so
                we can investigate. See{" "}
                <Link to="/help/shipping" className="text-blue-600 hover:underline">
                  Shipping &amp; Delivery
                </Link>
                .
              </p>
            </Section>

            <Section title="6) Returns, refunds, and replacements">
              <p>
                Return eligibility depends on product category, condition, and the return window
                shown for the item. Some products may have special restrictions (for example, for
                safety or hygiene reasons). Refunds are typically issued back to your original
                payment method.
              </p>
              <p className="mt-3">
                Details:{" "}
                <Link to="/help/returns" className="text-blue-600 hover:underline">
                  Returns &amp; Refunds
                </Link>
                .
              </p>
            </Section>

            <Section title="7) Product safety and reporting concerns">
              <p>
                If you believe a product is unsafe, stop using it and contact us promptly. You can
                report hazards, defects, or recall-related concerns through our support channels.
              </p>
              <p className="mt-3">
                Details:{" "}
                <Link to="/help/product-safety" className="text-blue-600 hover:underline">
                  Product Safety &amp; Recalls
                </Link>
                .
              </p>
            </Section>

            <Section title="8) Your content: reviews, ratings, questions, and uploads">
              <p>
                You may be able to submit content such as ratings, reviews, questions, comments, or
                other materials (“User Content”). You are responsible for your User Content and must
                ensure it is accurate, lawful, and does not violate the rights of others.
              </p>
              <p className="mt-3">
                By submitting User Content, you grant JETCUBE a non-exclusive, worldwide,
                royalty-free license to use, reproduce, adapt, publish, translate, and display that
                content in connection with the Services (for example, showing reviews on product
                pages or in search results).
              </p>
              <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  User Content you must not submit
                </div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                  <li>Content that is illegal, threatening, harassing, or hateful</li>
                  <li>Personal data about others (addresses, phone numbers, payment details)</li>
                  <li>Impersonation or deceptive reviews</li>
                  <li>Malware, harmful code, or attempts to exploit the Services</li>
                </ul>
              </div>
            </Section>

            <Section title="9) AI-assisted features and outputs">
              <p>
                Some parts of JETCUBE may use AI-assisted systems to improve shopping speed and
                clarity (for example, search relevance, product attribute extraction, summaries, and
                assistant responses). AI outputs can be imperfect, incomplete, or outdated.
              </p>
              <p className="mt-3">
                You should verify important details before making a purchase, especially for
                compatibility, sizing, safety warnings, and care instructions. If you believe an AI
                summary is wrong or misleading, let us know so we can improve it.
              </p>
            </Section>

            <Section title="10) Acceptable use and prohibited behavior">
              <p>
                You agree not to misuse the Services. Prohibited behavior includes (but is not
                limited to):
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>Attempting to bypass security, rate limits, or access controls</li>
                <li>Scraping or harvesting data at scale without permission</li>
                <li>Uploading malicious code or attempting to disrupt the Services</li>
                <li>Using the Services for fraud, abuse, or unlawful activity</li>
                <li>Interfering with other users’ access or experience</li>
              </ul>
              <p className="mt-3">
                We may suspend or terminate access if we believe you are violating these Terms or
                creating risk for customers, partners, or the platform.
              </p>
            </Section>

            <Section title="11) Intellectual property">
              <p>
                The Services, including site design, text, graphics, logos, interfaces, and
                software, are owned by JETCUBE or its licensors and are protected by intellectual
                property laws. You may not copy, modify, distribute, sell, or lease any part of the
                Services unless you have our written permission.
              </p>
            </Section>

            <Section title="12) Disclaimers">
              <p>
                The Services are provided on an “as is” and “as available” basis. To the maximum
                extent permitted by law, JETCUBE disclaims warranties of any kind, including implied
                warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
              <p className="mt-3">
                Product information may come from manufacturers, sellers, or automated extraction and
                may not always be complete. Always follow product labels, instructions, and safety
                warnings.
              </p>
            </Section>

            <Section title="13) Limitation of liability">
              <p>
                To the maximum extent permitted by law, JETCUBE will not be liable for indirect,
                incidental, special, consequential, or punitive damages, or for any loss of profits,
                revenue, data, or goodwill arising out of or related to your use of the Services.
              </p>
              <p className="mt-3">
                In any case, JETCUBE’s total liability for any claim will not exceed the amount you
                paid to JETCUBE for the relevant order or transaction giving rise to the claim, or a
                reasonable amount as required by law.
              </p>
            </Section>

            <Section title="14) Indemnification">
              <p>
                You agree to indemnify and hold harmless JETCUBE and its affiliates, officers,
                employees, and agents from claims, liabilities, damages, and expenses (including
                reasonable attorneys’ fees) arising out of your misuse of the Services, your User
                Content, or your violation of these Terms.
              </p>
            </Section>

            <Section title="15) Changes to these Terms">
              <p>
                We may update these Terms from time to time. Changes take effect when posted, unless
                we state otherwise. Your continued use of the Services after changes are posted
                means you accept the updated Terms.
              </p>
            </Section>

            <Section title="16) Contact">
              <p>
                Questions about these Terms? Contact us here:{" "}
                <Link to="/help/contact" className="text-blue-600 hover:underline">
                  /help/contact
                </Link>
                .
              </p>
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

