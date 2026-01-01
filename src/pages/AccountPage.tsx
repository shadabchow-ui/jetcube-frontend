import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type MeResponse =
  | { user: { id: string; email: string; created_at?: string } }
  | { error: string };

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401) {
          if (!cancelled) setEmail(null);
          return;
        }

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          if (!cancelled) setEmail(null);
          return;
        }

        const data = (await res.json()) as MeResponse;

        if (!cancelled && "user" in data && data.user?.email) {
          setEmail(data.user.email);
        } else {
          setEmail(null);
        }
      } catch {
        if (!cancelled) setEmail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = [
    {
      title: "Your Orders",
      desc: "Track packages, view order details, and receipts.",
      href: "/orders",
    },
    {
      title: "Returns & refunds",
      desc: "Start a return and view refund status.",
      href: "/help/returns",
    },
    {
      title: "Payment methods",
      desc: "Learn about payment options and billing help.",
      href: "/help/payments",
    },
    {
      title: "Shipping & delivery",
      desc: "Delivery info, shipping help, and policies.",
      href: "/help/shipping",
    },
    {
      title: "Contact support",
      desc: "Get help with orders, refunds, and account questions.",
      href: "/help/contact",
    },
    {
      title: "Privacy & settings",
      desc: "Privacy notice, conditions, and preferences.",
      href: "/help/privacy-notice",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="border-b pb-4 mb-5">
        <h1 className="text-2xl font-semibold">Your Account</h1>

        <div className="mt-2 text-sm text-[#565959]">
          {loading ? (
            <span>Loading…</span>
          ) : email ? (
            <span>Signed in as <span className="font-medium text-black">{email}</span></span>
          ) : (
            <span>
              You’re not signed in.{" "}
              <Link to="/login" className="text-[#007185] hover:underline">
                Sign in
              </Link>{" "}
              or{" "}
              <Link to="/signup" className="text-[#007185] hover:underline">
                create an account
              </Link>
              .
            </span>
          )}
        </div>
      </div>

      {/* Amazon-style tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.title}
            to={t.href}
            className="border rounded-lg p-4 hover:bg-gray-50 block"
          >
            <div className="text-[15px] font-semibold">{t.title}</div>
            <div className="text-[13px] text-[#565959] mt-1">{t.desc}</div>
          </Link>
        ))}
      </div>

      {/* Bottom links (lightweight) */}
      <div className="mt-8 border-t pt-5 text-[13px] text-[#565959] flex flex-wrap gap-x-4 gap-y-2">
        <Link to="/help/conditions-of-use" className="hover:underline hover:text-black">
          Conditions of Use
        </Link>
        <Link to="/help/privacy-notice" className="hover:underline hover:text-black">
          Privacy Notice
        </Link>
        <Link to="/help/ads-privacy" className="hover:underline hover:text-black">
          Your Ads Privacy Choices
        </Link>
      </div>
    </div>
  );
}
