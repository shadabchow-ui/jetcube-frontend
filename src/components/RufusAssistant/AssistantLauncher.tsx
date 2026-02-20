import React from "react";
import { createPortal } from "react-dom";

import { AssistantDrawer } from "./AssistantDrawer";
import { AssistantInline } from "./AssistantInline";

/**
 * AssistantLauncher
 *
 * Renders assistant UI in a portal so it does NOT sit inside layouts/footers.
 * NOTE: This component assumes an AssistantContextProvider exists ABOVE it
 * (we mount that once in App.tsx).
 */
const AssistantLauncher: React.FC = () => {
  // Avoid SSR / build-time DOM access
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AssistantDrawer />
      <AssistantInline />
    </>,
    document.body
  );
};

export default AssistantLauncher;





