import React from "react";

import { AssistantContextProvider } from "./AssistantContext";
import { AssistantDrawer } from "./AssistantDrawer";
import { AssistantInline } from "./AssistantInline";

export type AssistantContextType = "home" | "category" | "product";

type Props = {
  context: AssistantContextType;
};

const AssistantLauncher: React.FC<Props> = ({ context }) => {
  return (
    <AssistantContextProvider context={context}>
      <AssistantDrawer />
      <AssistantInline />
    </AssistantContextProvider>
  );
};

export default AssistantLauncher;





