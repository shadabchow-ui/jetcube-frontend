import React from "react";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function ConsumerData(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        <aside>
          <HelpSidebar active="consumer-data" />
        </aside>

        <main className="text-sm text-gray-800 leading-relaxed">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">
              Consumer Data Requests
            </h1>
            <p className="text-gray-600">
              This page explains how you can request access to, correction of,
              or deletion of certain personal information associated with your
              JETCUBE account, where applicable. We aim to make this process
              clear and respectful of your choices.
            </p>
          </header>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">What is a consumer data request?</h2>
            <p>
              A consumer data request is a request you make to understand, manage,
              or change personal information that may be associated with you. Depending
              on where you live and the nature of your request, you may be able to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to certain personal information</li>
              <li>Request correction of inaccurate personal information</li>
              <li>Request deletion of certain personal information</li>
              <li>Request information about how data is used or shared</li>
            </ul>
            <p>
              Some information may be required to operate the service (for example,
              account security and order fulfillment). In those cases, we may be unable
              to delete certain data immediately, but we will explain what applies.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">What information may be included</h2>
            <p>
              The information associated with your account can vary based on how you use
              JETCUBE. Examples may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email, password hash, preferences)</li>
              <li>Shipping and billing addresses</li>
              <li>Order history and transaction records</li>
              <li>Support messages or help requests you submitted</li>
              <li>Device and usage signals used for security and site performance</li>
            </ul>
            <p>
              Some records (like transaction and invoice records) may need to be retained
              for legal, accounting, fraud prevention, or dispute resolution purposes.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">How to submit a request</h2>
            <p>
              To submit a consumer data request, contact JETCUBE support and include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your account email (the one used to sign in)</li>
              <li>The type of request: access, correction, or deletion</li>
              <li>What you want changed (if requesting correction or deletion)</li>
              <li>Any relevant context (for example, the order number)</li>
            </ul>

            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
              <div className="font-semibold">Request types</div>
              <p className="text-gray-700">
                <span className="font-semibold">Access request:</span> You are asking for
                a copy or summary of personal information associated with your account.
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Correction request:</span> You are asking
                us to fix inaccurate information (for example, an address or name).
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Deletion request:</span> You are asking
                us to delete certain personal information, where allowed. Some information
                may need to be retained for legal or security reasons.
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Identity verification</h2>
            <p>
              To protect your account, we may need to verify your identity before
              completing certain requests. Verification helps prevent unauthorized access
              or deletion. The verification steps depend on the request and the sensitivity
              of the data involved.
            </p>
            <p>
              We aim to use reasonable verification methods. In some cases, verification
              may include confirming access to the account email or confirming order details.
              If we cannot verify identity, we may be unable to fulfill the request.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">What happens after you submit</h2>
            <p>
              After your request is received, we will review it and respond with next steps.
              Some requests can be completed quickly, while others require additional review.
              If we need more details from you, we will ask for them.
            </p>
            <p>
              When a request is completed, we will confirm what was done. If a request cannot
              be completed in full, we will explain why — for example, if records must be
              retained for legal compliance or fraud prevention.
            </p>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">AI-driven features and your data</h2>
            <p>
              JETCUBE is building AI-driven shopping features such as smarter search,
              assistant-style help, product research tools, and analytics that improve the
              store experience. These features may use signals from your interactions on
              the site to improve relevance and reduce friction.
            </p>
            <p>
              We aim to use data responsibly and provide meaningful choices. If you limit
              interest-based advertising, you may still benefit from AI-driven search and
              product matching within the store experience. For more details, review our
              Privacy Notice and Ads Privacy Choices page.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <a href="/help/privacy-notice" className="text-blue-600 hover:underline">
                Privacy Notice
              </a>
              <a href="/help/ads-privacy" className="text-blue-600 hover:underline">
                Your Ads Privacy Choices
              </a>
            </div>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="text-lg font-semibold">Limits and exceptions</h2>
            <p>
              Consumer data rights can depend on your location and applicable law, and
              there may be exceptions. Examples of why a request may be limited include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Security and fraud prevention</li>
              <li>Legal or accounting record retention</li>
              <li>Dispute resolution and chargeback handling</li>
              <li>Technical constraints related to backups and system integrity</li>
            </ul>
            <p>
              If an exception applies, we will explain it in practical terms and tell you
              what we can do instead (for example, restricting use, correcting, or de-linking
              certain information where possible).
            </p>
          </section>

          <section className="space-y-4 mb-2">
            <h2 className="text-lg font-semibold">Submit a request</h2>
            <p>
              To submit a consumer data request, contact JETCUBE support and include your
              account email and the request type (access, correction, or deletion). If your
              request relates to an order, include the order number.
            </p>

            <div className="flex flex-wrap gap-4 mt-3">
              <a href="/help/contact" className="text-blue-600 hover:underline">
                Contact JETCUBE
              </a>
              <a href="/help/privacy-notice" className="text-blue-600 hover:underline">
                Privacy Notice
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
