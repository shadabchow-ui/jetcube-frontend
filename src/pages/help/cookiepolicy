import React, { useMemo } from "react";

export default function CookiePolicy() {
  const effectiveDate = useMemo(() => {
    // Change this to a fixed date if you prefer (e.g. "January 10, 2026")
    const d = new Date();
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10">
      <div className="bg-white border border-[#d5dbdb] rounded-xl p-6 sm:p-8">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-[#0F1111]">
          Cookie Policy
        </h1>

        <div className="mt-2 text-[13px] text-[#565959]">
          <div>
            <span className="font-semibold text-[#0F1111]">Effective date:</span>{" "}
            {effectiveDate}
          </div>
          <div className="mt-1">
            <span className="font-semibold text-[#0F1111]">Website:</span>{" "}
            ventari.net
          </div>
          <div className="mt-1">
            <span className="font-semibold text-[#0F1111]">Company/Brand:</span>{" "}
            Ventari (“we,” “us,” “our”)
          </div>
        </div>

        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-[#0F1111]">
          <section>
            <h2 className="text-[18px] font-semibold">1) What are cookies?</h2>
            <p className="mt-2 text-[#111]">
              Cookies are small text files placed on your device (computer,
              phone, tablet) when you visit a website. Cookies help a site
              remember information about your visit—like your preferences,
              session state, or whether you’ve accepted analytics cookies.
            </p>
            <p className="mt-2 text-[#111]">
              Cookies can be{" "}
              <span className="font-semibold">first-party</span> (set by
              ventari.net) or <span className="font-semibold">third-party</span>{" "}
              (set by another service we use). Cookies can also be{" "}
              <span className="font-semibold">session</span> cookies (expire when
              you close your browser) or{" "}
              <span className="font-semibold">persistent</span> cookies (remain
              for a set period or until you delete them).
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">
              2) What are “similar technologies”?
            </h2>
            <p className="mt-2 text-[#111]">
              In addition to cookies, we may use technologies that serve a
              similar purpose, such as local storage/session storage (to
              remember settings), tags/scripts (to enable site features or
              measure performance), and browser/device identifiers (depending on
              your settings). In this policy, we refer to all of these as
              “cookies” for simplicity.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">3) Why we use cookies</h2>
            <p className="mt-2 text-[#111]">
              We use cookies for three main reasons:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-2 text-[#111]">
              <li>
                <span className="font-semibold">To make Ventari work</span>{" "}
                (security, stability, basic site operation, preventing abuse)
              </li>
              <li>
                <span className="font-semibold">To remember preferences</span>{" "}
                (for example, your cookie/consent choice)
              </li>
              <li>
                <span className="font-semibold">To measure and improve</span>{" "}
                Ventari (analytics and performance insights—only when permitted
                and, where required, only if you consent)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">
              4) Cookie categories we use
            </h2>

            <div className="mt-3 border border-[#e7e7e7] rounded-lg p-4">
              <h3 className="text-[16px] font-semibold">
                A) Strictly Necessary Cookies (Always On)
              </h3>
              <p className="mt-2 text-[#111]">
                These cookies are required for the website to function. They
                support security, reliability, and core features. Because they
                are essential, they generally can’t be turned off through a
                cookie banner.
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-2 text-[#111]">
                <li>Keep the site stable and secure</li>
                <li>Help prevent fraud or abusive activity</li>
                <li>Enable essential navigation and request handling</li>
              </ul>
            </div>

            <div className="mt-4 border border-[#e7e7e7] rounded-lg p-4">
              <h3 className="text-[16px] font-semibold">
                B) Analytics Cookies (Optional)
              </h3>
              <p className="mt-2 text-[#111]">
                Analytics cookies help us understand how people use Ventari—what
                pages are visited, what features are used, and what needs
                improvement. We use Google Analytics 4 (GA4). Where required by
                law, analytics cookies are used only if you choose “Accept.”
              </p>
              <p className="mt-2 text-[#111]">
                If you reject analytics cookies, Ventari will still work. You
                just won’t be included in analytics measurement that relies on
                cookies.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">
              5) Google Consent Mode (How consent works on Ventari)
            </h2>
            <p className="mt-2 text-[#111]">
              Ventari uses Google Consent Mode. By default, analytics consent is
              set to denied until you make a choice. If you accept, analytics
              measurement may use cookies (depending on your region and
              settings). If you reject, analytics storage remains denied.
            </p>
            <p className="mt-2 text-[#111]">
              Even when consent is denied, Google’s tag may still send limited
              “consent signals” (sometimes described as cookieless measurement)
              for aggregated reporting. This does not mean we can personally
              identify you. It means the analytics system may receive a minimal
              signal that consent was denied to help prevent inaccurate
              reporting.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">
              6) Cookies we may set (examples)
            </h2>
            <p className="mt-2 text-[#111]">
              Cookies can change over time as services update. The list below
              covers common examples you may see when GA4 is enabled.
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full border border-[#e7e7e7] text-[14px]">
                <thead>
                  <tr className="bg-[#f6f6f6]">
                    <th className="text-left p-3 border-b border-[#e7e7e7]">
                      Category
                    </th>
                    <th className="text-left p-3 border-b border-[#e7e7e7]">
                      Example cookie / storage
                    </th>
                    <th className="text-left p-3 border-b border-[#e7e7e7]">
                      Purpose
                    </th>
                    <th className="text-left p-3 border-b border-[#e7e7e7]">
                      Typical duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b border-[#e7e7e7]">
                      Necessary / Preference
                    </td>
                    <td className="p-3 border-b border-[#e7e7e7]">
                      Consent choice (cookie/local storage)
                    </td>
                    <td className="p-3 border-b border-[#e7e7e7]">
                      Remembers whether you accepted or rejected analytics
                    </td>
                    <td className="p-3 border-b border-[#e7e7e7]">
                      Varies (often months) unless cleared
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 border-b border-[#e7e7e7]">Analytics</td>
                    <td className="p-3 border-b border-[#e7e7e7]">_ga</td>
                    <td className="p-3 border-b border-[#e7e7e7]">
                      Distinguishes users for analytics
                    </td>
                    <td className="p-3 border-b border-[#e7e7e7]">
                      Up to 2 years
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3">Analytics</td>
                    <td className="p-3">_ga_&lt;container-id&gt;</td>
                    <td className="p-3">
                      Persists session state for Google Analytics 4
                    </td>
                    <td className="p-3">Up to 2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[#111]">
              Depending on configuration and updates, other Google Analytics
              cookies may appear. You can always inspect cookies in your browser
              settings.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">7) Your choices</h2>

            <h3 className="mt-3 text-[16px] font-semibold">
              A) Cookie banner choice
            </h3>
            <p className="mt-2 text-[#111]">
              When you first visit Ventari (or when required), you will see a
              cookie banner that allows you to Accept or Reject analytics
              cookies. You can change your choice at any time.
            </p>
            <p className="mt-2 text-[#111]">
              To change your cookie choice later, you can clear your site
              cookies/site data in your browser to reset the banner. If Ventari
              provides a “Manage cookies” link in the footer, you can use that
              to reopen cookie settings.
            </p>

            <h3 className="mt-4 text-[16px] font-semibold">B) Browser controls</h3>
            <p className="mt-2 text-[#111]">
              Most browsers let you view, delete, or block cookies. Instructions
              vary by browser. Look for cookie controls in your browser’s
              Privacy or Settings area.
            </p>

            <h3 className="mt-4 text-[16px] font-semibold">
              C) Google Analytics opt-out
            </h3>
            <p className="mt-2 text-[#111]">
              Google provides options to manage analytics and advertising
              preferences. You may also be able to use browser add-ons or
              settings to limit analytics tracking.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">8) Do Not Track signals</h2>
            <p className="mt-2 text-[#111]">
              Some browsers offer a “Do Not Track” (DNT) setting. There is no
              consistent industry standard for how DNT should be interpreted.
              For that reason, Ventari does not treat DNT as a substitute for
              cookie consent controls. You can use the cookie banner and your
              browser settings to manage cookies.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">
              9) International visitors (EEA/UK and other regions)
            </h2>
            <p className="mt-2 text-[#111]">
              Cookie rules vary by region. In many places (including the EEA/UK),
              analytics cookies require prior consent. Ventari aims to honor
              consent requirements by using a consent banner and Google Consent
              Mode.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">
              10) How long we keep analytics data
            </h2>
            <p className="mt-2 text-[#111]">
              Analytics cookie lifetimes are described above (where applicable).
              Separately, analytics event data stored in Google Analytics is
              retained according to our GA settings and Google’s platform
              controls. Retention typically ranges from 2 to 14 months depending
              on configuration.
            </p>
            <p className="mt-2 text-[#111]">
              We use analytics data to understand site performance and improve
              user experience, not to sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">11) Third parties we use</h2>
            <p className="mt-2 text-[#111]">
              When enabled, analytics may involve third parties processing data
              on our behalf.
            </p>

            <div className="mt-3 border border-[#e7e7e7] rounded-lg p-4">
              <div className="font-semibold">Google Analytics (Google LLC)</div>
              <div className="mt-1 text-[#111]">
                Purpose: traffic measurement and performance analytics.
              </div>
              <div className="mt-1 text-[#111]">
                Data may be processed on Google’s infrastructure, subject to
                Google’s policies and platform controls.
              </div>
            </div>

            <p className="mt-3 text-[#111]">
              We may also use infrastructure providers (hosting, security,
              content delivery) that set strictly necessary cookies to deliver
              the site reliably and securely.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">12) Children’s privacy</h2>
            <p className="mt-2 text-[#111]">
              Ventari is not intended for children under the age required by
              applicable law to consent to data processing. We do not knowingly
              collect personal information from children. If you believe a child
              has provided personal information to us, contact us and we will
              take appropriate steps.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">
              13) Updates to this Cookie Policy
            </h2>
            <p className="mt-2 text-[#111]">
              We may update this Cookie Policy from time to time to reflect
              changes in technology, legal requirements, or our practices. When
              we update it, we will revise the Effective date at the top.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold">14) Contact us</h2>
            <p className="mt-2 text-[#111]">
              If you have questions about this Cookie Policy or your privacy
              choices, contact us:
            </p>

            <div className="mt-3 space-y-1 text-[#111]">
              <div>
                <span className="font-semibold">Email:</span> [your support email]
              </div>
              <div>
                <span className="font-semibold">Address (optional):</span> [your
                business address]
              </div>
              <div>
                <span className="font-semibold">Subject line:</span> Cookie Policy
                / Privacy
              </div>
            </div>
          </section>

          <div className="pt-2 text-[13px] text-[#565959]">
            This Cookie Policy is provided for transparency about our cookie
            practices. For more information on how we handle personal data,
            please review our Privacy Notice.
          </div>
        </div>
      </div>
    </div>
  );
}
