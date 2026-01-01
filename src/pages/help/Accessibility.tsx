// /Applications/product/src/pages/help/Accessibility.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function Accessibility(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <HelpSidebar active="accessibility" />
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
                <span className="text-gray-700">Accessibility</span>
              </div>

              <h1 className="text-2xl font-semibold mt-2">Accessibility</h1>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                JETCUBE is committed to making our website and digital shopping experience accessible
                to as many people as possible. Accessibility is not a one-time checkbox—it's an
                ongoing practice that affects design, engineering, content, and customer support.
                This page explains what we aim for, what we’re actively improving, and how you can
                reach us if something isn’t working for you.
              </p>
            </div>

            <Section title="Our accessibility commitment">
              <p>
                We want JETCUBE to be usable for customers who rely on assistive technologies, who
                navigate by keyboard, who prefer reduced motion, who use high-contrast modes, and who
                experience differences in vision, hearing, cognition, or motor control. Our goal is
                simple: you should be able to browse categories, search, evaluate products, and
                complete checkout without unnecessary barriers.
              </p>
              <p className="mt-3">
                We also recognize that ecommerce moves fast. New categories, product pages, and
                AI-powered features can introduce accessibility regressions if we’re not careful. We
                treat accessibility as part of core quality—like performance, security, and stability.
              </p>
            </Section>

            <Section title="Standards and practices">
              <p>
                We aim to follow widely adopted accessibility guidance, including best practices that
                align with WCAG (Web Content Accessibility Guidelines). While we may not always be
                perfect on every page at every moment, we actively work to reduce barriers and fix
                issues as they’re identified.
              </p>
              <p className="mt-3">
                Our practical approach includes:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>
                  <span className="font-semibold text-gray-900">Semantic structure:</span> headings,
                  landmarks, and meaningful HTML so screen readers can navigate efficiently.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Keyboard navigation:</span> ensuring
                  interactive elements can be reached, used, and exited without a mouse.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Focus visibility:</span> clear focus
                  styles so you always know where you are on the page.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Text clarity:</span> readable font
                  sizes, spacing, and color contrast that supports comfortable scanning.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Accessible forms:</span> labels,
                  hints, and error messaging that are readable and assistive-tech friendly.
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Responsive layout:</span> content that
                  adapts cleanly across mobile, tablet, and desktop.
                </li>
              </ul>
            </Section>

            <Section title="Assistive technology compatibility">
              <p>
                JETCUBE is designed to work with modern browsers and common assistive technologies.
                Because assistive tech varies by platform, experience can differ across combinations
                of device, browser, and screen reader.
              </p>
              <p className="mt-3">
                If you run into an issue, please include:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>Device type (mobile / desktop) and operating system</li>
                <li>Browser (Chrome, Safari, Firefox, etc.)</li>
                <li>Assistive technology (screen reader name/version if applicable)</li>
                <li>The page URL and what you were trying to do</li>
              </ul>
              <p className="mt-3">
                This helps us reproduce the problem and fix it faster.
              </p>
            </Section>

            <Section title="Content and product information accessibility">
              <p>
                Ecommerce content can be messy: sellers use different naming patterns, images may
                lack helpful descriptions, and product attributes can be inconsistent. JETCUBE is
                improving this using structured data and AI-assisted extraction to create clearer,
                more consistent product pages.
              </p>
              <p className="mt-3">
                Our focus areas include:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>
                  Better organization of key product details (size, material, compatibility,
                  included items)
                </li>
                <li>
                  Cleaner “spec” sections so important info isn’t buried inside long paragraphs
                </li>
                <li>
                  Reducing duplication and clutter that makes screen-reader navigation harder
                </li>
              </ul>
              <p className="mt-3">
                We also aim to ensure important images have meaningful alt text where available, and
                that product galleries remain usable via keyboard and assistive technology.
              </p>
            </Section>

            <Section title="AI features and accessibility">
              <p>
                JETCUBE is an AI-driven retail brand, and we’re building AI-powered search and
                assistant-style help. Accessibility is a requirement for these experiences—not an
                afterthought.
              </p>
              <p className="mt-3">
                We aim to ensure AI-driven UI components:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>Expose clear labels and roles for screen readers</li>
                <li>Can be opened, used, and closed with keyboard-only navigation</li>
                <li>Do not trap focus</li>
                <li>Do not rely on color alone to communicate state</li>
                <li>Respect reduced-motion preferences for animations and transitions</li>
              </ul>
              <p className="mt-3">
                If an assistant panel, floating UI element, or search interaction is difficult to
                use, we want to know. Those are exactly the kinds of issues we prioritize.
              </p>
            </Section>

            <Section title="Known limitations and ongoing improvements">
              <p>
                As we expand the catalog and ship new features, some pages may have accessibility
                issues temporarily—especially in areas like large product grids, complex filters, or
                third-party embedded content. When we identify issues, we work to fix them in the
                next iteration.
              </p>
              <p className="mt-3">
                Examples of improvements we regularly audit:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li>Heading order consistency (H1/H2/H3 structure)</li>
                <li>Color contrast on buttons, links, and subtle UI</li>
                <li>Keyboard usability of menus, drawers, and modals</li>
                <li>Form field labels and error messaging</li>
                <li>Image alt text quality for key product visuals</li>
              </ul>
            </Section>

            <Section title="How to request help or report an accessibility issue">
              <p>
                If you have difficulty using any part of JETCUBE, please contact us. We’ll do two
                things: (1) help you complete what you’re trying to do, and (2) log the issue so we
                can fix it for everyone.
              </p>
              <p className="mt-3">
                Contact us here:{" "}
                <Link to="/help/contact" className="text-blue-600 hover:underline">
                  /help/contact
                </Link>
                .
              </p>
              <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Suggested message template
                </div>
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  <p>
                    <span className="font-semibold text-gray-900">Subject:</span> Accessibility Issue
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Page:</span> (paste URL)
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">What happened:</span> (brief steps)
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Device/Browser:</span> (example:
                    iPhone Safari / Windows Chrome)
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Assistive tech:</span> (if any)
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Alternative formats">
              <p>
                If you need information in an alternative format or need help completing an order due
                to accessibility barriers, contact support and we will work with you to find a
                reasonable solution. We can also provide guidance on where certain policy information
                is located within the Help Center.
              </p>
            </Section>

            <Section title="Related pages">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <Link to="/help" className="text-blue-600 hover:underline">
                    Help Center
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
                <li>
                  <Link to="/help/contact" className="text-blue-600 hover:underline">
                    Contact JETCUBE
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



