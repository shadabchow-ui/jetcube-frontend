import React from "react";
import { HelpSidebar } from "../../components/help/HelpSidebar";

export default function Devices(): JSX.Element {
    return (
        <div className="w-full bg-white">
            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
                    {/* Sidebar */}
                    <aside className="hidden lg:block">
                        <HelpSidebar active="devices" />
                    </aside>

                    {/* Content */}
                    <section>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Devices, apps, and supported browsers
                        </h1>
                        <p className="mt-3 text-gray-700 leading-relaxed">
                            JETCUBE is designed to work smoothly across modern phones, tablets,
                            and computers. This page explains what we support today, how to get
                            the best experience, and what to do if something looks broken.
                            We’re building an AI-driven retail experience, so keeping your device
                            up to date helps features like search, recommendations, and chat work
                            reliably.
                        </p>

                        <Section title="Supported browsers">
                            <p>
                                For the best experience, use a current version of:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                                <li>Chrome (desktop and Android)</li>
                                <li>Safari (iPhone/iPad and Mac)</li>
                                <li>Edge (Windows)</li>
                                <li>Firefox (desktop)</li>
                            </ul>
                            <p className="mt-3">
                                If pages don’t load, images don’t show, or the cart acts weird,
                                the fastest fix is usually: refresh the page, then hard refresh,
                                then clear site data for JETCUBE, then restart the browser.
                            </p>
                        </Section>

                        <Section title="Mobile experience">
                            <p>
                                JETCUBE is mobile-first. If you’re on iPhone or Android:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                                <li>Keep your OS updated to the latest stable version.</li>
                                <li>
                                    If you use “Low Data Mode” or battery saver, some images may load
                                    more slowly.
                                </li>
                                <li>
                                    If you’re using an in-app browser (Instagram/TikTok), try opening
                                    the same link in Safari/Chrome for better stability.
                                </li>
                            </ul>
                        </Section>

                        <Section title="Desktop experience">
                            <p>
                                Desktop gives you the fastest browsing, bigger comparison views,
                                and the most reliable checkout flow. If your site feels slow,
                                check whether you have:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                                <li>Many tabs open (memory pressure)</li>
                                <li>Heavy ad blockers interfering with scripts</li>
                                <li>Strict privacy extensions blocking local storage</li>
                            </ul>
                            <p className="mt-3">
                                If you suspect an extension is breaking things, try an Incognito
                                window with extensions disabled.
                            </p>
                        </Section>

                        <Section title="AI features and what they need">
                            <p>
                                Our AI features (smart search, product Q&amp;A chat, personalized
                                discovery) work best when your browser supports modern web
                                capabilities. In practical terms:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                                <li>JavaScript must be enabled (required for the storefront).</li>
                                <li>
                                    Cookies/local storage must be allowed (for cart, preferences,
                                    and session continuity).
                                </li>
                                <li>
                                    Some features may rely on network calls to fetch results; overly
                                    strict firewalls can block them.
                                </li>
                            </ul>
                            <p className="mt-3">
                                If you prefer maximum privacy, you can still browse without
                                personalization, but certain “remembered” experiences may reset
                                each visit.
                            </p>
                        </Section>

                        <Section title="Troubleshooting checklist">
                            <ol className="list-decimal pl-5 mt-2 space-y-2 text-gray-700">
                                <li>
                                    <span className="font-semibold text-gray-900">Refresh</span>{" "}
                                    the page and try again.
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-900">Hard refresh</span>{" "}
                                    (Cmd+Shift+R on Mac, Ctrl+F5 on Windows).
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-900">Clear site data</span>{" "}
                                    for JETCUBE (cookies + cache), then reload.
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-900">Disable extensions</span>{" "}
                                    (ad blockers/privacy tools) temporarily.
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-900">Try another browser</span>{" "}
                                    to isolate whether it’s a device/browser issue.
                                </li>
                                <li>
                                    If checkout fails, verify your network is stable and try again
                                    on desktop.
                                </li>
                            </ol>
                        </Section>

                        <Section title="Need help?">
                            <p className="text-gray-700">
                                If you’re still stuck, contact support and include: your device
                                model, browser name/version, the page URL, and what you clicked
                                right before the issue happened. That lets us reproduce it fast.
                            </p>
                            <p className="mt-3">
                                Go to{" "}
                                <a
                                    className="text-blue-600 hover:underline"
                                    href="/help/contact"
                                >
                                    Contact JETCUBE
                                </a>
                                .
                            </p>
                        </Section>
                    </section>
                </div>
            </main>
        </div>
    );
}

/* ----------------------------------
   Reusable Section Component
----------------------------------- */
function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed space-y-3">{children}</div>
        </section>
    );
}
