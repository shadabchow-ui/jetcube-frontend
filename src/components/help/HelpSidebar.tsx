import React from "react";
import { Link } from "react-router-dom";

type HelpSidebarProps = {
  active?: string;
};

export function HelpSidebar({ active }: HelpSidebarProps): JSX.Element {
  return (
    <nav aria-label="Help topics" className="help-sidebar text-sm">
      <ul className="space-y-4">
        {/* ALL HELP TOPICS */}
        <li>
          <Link to="/help" className="text-blue-600 hover:underline">
            All Help Topics
          </Link>
        </li>

        {/* SHOPPING CONFIDENCE */}
        <li>
          <div className="font-semibold text-gray-800 mb-2">
            Shopping confidence
          </div>
          <ul className="space-y-2 ml-2">
            <SidebarLink
              to="/help/shipping"
              label="Shipping & Delivery"
              active={active === "shipping"}
            />
            <SidebarLink
              to="/help/returns"
              label="Returns & Refunds"
              active={active === "returns"}
            />
            <SidebarLink
              to="/help/payments"
              label="Payment options"
              active={active === "payments"}
            />
          </ul>
        </li>

        {/* POLICIES & PRIVACY */}
        <li>
          <div className="font-semibold text-gray-800 mb-2">
            Policies & privacy
          </div>
          <ul className="space-y-2 ml-2">
            <SidebarLink
              to="/help/conditions-of-use"
              label="Conditions of use"
              active={active === "conditions-of-use"}
            />
            <SidebarLink
              to="/help/privacy-notice"
              label="Privacy notice"
              active={active === "privacy-notice"}
            />
            <SidebarLink
              to="/help/ads-privacy"
              label="Your ads privacy choices"
              active={active === "ads-privacy"}
            />
            <SidebarLink
              to="/help/consumer-data"
              label="Consumer data requests"
              active={active === "consumer-data"}
            />
            <SidebarLink
              to="/help/product-safety"
              label="Product safety & recalls"
              active={active === "product-safety"}
            />
            <SidebarLink
              to="/help/accessibility"
              label="Accessibility"
              active={active === "accessibility"}
            />
          </ul>
        </li>

        {/* SUPPORT */}
        <li>
          <div className="font-semibold text-gray-800 mb-2">Support</div>
          <ul className="space-y-2 ml-2">
            <SidebarLink
              to="/help/contact"
              label="Contact JETCUBE"
              active={active === "contact"}
            />
          </ul>
        </li>
      </ul>
    </nav>
  );
}

/* ----------------------------------
   Internal Link Component
----------------------------------- */
function SidebarLink({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active?: boolean;
}) {
  if (active) {
    return (
      <li>
        <span aria-current="page" className="font-semibold text-gray-900">
          {label}
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link to={to} className="text-blue-600 hover:underline">
        {label}
      </Link>
    </li>
  );
}

