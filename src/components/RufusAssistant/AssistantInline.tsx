import React, { useMemo, useState } from "react";
import {
  ASSISTANT_NAME,
  buildSuggestedQuestions,
  ProductCtx,
  useAssistant
} from "./AssistantContext";
import "./assistantInline.css";

export function AssistantInline({
  productId,
  productTitle,
  productSku,
  productCategory,
  productTags
}: {
  productId: string;
  productTitle?: string;
  productSku?: string;
  productCategory?: string;
  productTags?: string[];
}) {
  const { setOpen, setProductContext, send } = useAssistant();
  const [val, setVal] = useState("");

  const ctxForChips: ProductCtx = useMemo(
    () => ({ productId, productTitle, productSku, productCategory, productTags }),
    [productId, productTitle, productSku, productCategory, productTags]
  );

  const chips = useMemo(() => buildSuggestedQuestions(ctxForChips), [ctxForChips]);

  const openWithContext = () => {
    setProductContext(ctxForChips);
    setOpen(true);
  };

  const openAndAsk = async (q: string) => {
    openWithContext();
    await send(q);
  };

  return (
    <div className="asstInline">
      <div className="asstInlineHead">
        <span className="asstInlineLabel">Ask {ASSISTANT_NAME}</span>
        <span className="asstInlineHint">Get quick answers about this item</span>
      </div>

      <div className="asstInlineChips">
        {chips.map((c) => (
          <button
            key={c}
            className="asstChip"
            type="button"
            onClick={() => void openAndAsk(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <form
        className="asstInlineInputRow"
        onSubmit={(e) => {
          e.preventDefault();
          const q = val.trim();
          if (!q) return;
          void openAndAsk(q);
          setVal("");
        }}
      >
        <input
          className="asstInlineInput"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={`Ask ${ASSISTANT_NAME} a question`}
          maxLength={240}
          onFocus={openWithContext}
        />
        <button className="asstInlineBtn" type="submit">
          Ask
        </button>
      </form>
    </div>
  );
}
export default AssistantInline;
