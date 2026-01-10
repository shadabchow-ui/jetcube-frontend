import { useEffect, useState } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type ConsentChoice = "granted" | "denied";

const KEY = "consent_choice_v1";

function setConsent(choice: ConsentChoice) {
  // Update Google Consent Mode
  window.gtag?.("consent", "update", {
    ad_storage: choice,
    analytics_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });

  // Optional: if you blocked page_view earlier, you can fire it after consent is granted
  // if (choice === "granted") window.gtag?.("event", "page_view");
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as ConsentChoice | null;

    if (saved) {
      // Apply previously saved choice
      setConsent(saved);
      setVisible(false);
    } else {
      // No choice yet -> show banner
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        padding: 16,
        borderRadius: 12,
        background: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        zIndex: 9999,
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Cookies & analytics</div>
          <div style={{ fontSize: 14, lineHeight: 1.4 }}>
            We use cookies/analytics to understand traffic and improve the site. You can accept or reject.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              localStorage.setItem(KEY, "denied");
              setConsent("denied");
              setVisible(false);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ccc",
              background: "white",
              cursor: "pointer",
            }}
          >
            Reject
          </button>

          <button
            onClick={() => {
              localStorage.setItem(KEY, "granted");
              setConsent("granted");
              setVisible(false);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              cursor: "pointer",
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
