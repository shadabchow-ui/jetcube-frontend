import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ASSISTANT_LEARN_MORE_LABEL,
  ASSISTANT_NAME,
  ASSISTANT_WELCOME_TEXT,
  ASSISTANT_WELCOME_TITLE,
  useAssistant
} from "./AssistantContext";
import "./assistantDrawer.css";

export function AssistantDrawer() {
  const {
    open,
    setOpen,
    messages,
    send,
    mode,
    productTitle,
    clearMessages,
    suggestedQuestions
  } = useAssistant();

  // 🔒 AMAZON-EXACT LOCK:
  // Ignore any inline mode completely — drawer only.
  if (mode === "inline") {
    return null;
  }

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  const titleLine = useMemo(() => {
    if (productTitle) return productTitle;
    return "Browse + ask questions";
  }, [productTitle]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Auto-scroll
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages.length, sending]);

  const onSend = async (q: string) => {
    const question = q.trim();
    if (!question || sending) return;

    setSending(true);
    setInput("");

    try {
      await send(question);
    } finally {
      setSending(false);
    }
  };

  const body = (
    <div
      className={`asstOverlay ${open ? "show" : ""}`}
      onMouseDown={() => setOpen(false)}
      aria-hidden={!open}
    >
      <aside
        className={`asstDrawerLeft ${open ? "open" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Shopping assistant"
      >
        {/* Top bar */}
        <div className="asstTop">
          <div>
            <div className="asstTitle">{ASSISTANT_NAME}</div>
            <div className="asstSub">
              {titleLine} • {mode === "mock" ? "Mock" : "Live"}
            </div>
          </div>

          <div className="asstTopActions">
            <button
              className="asstSmallBtn"
              type="button"
              onClick={() => clearMessages()}
              title="Clear chat"
            >
              Clear
            </button>
            <button
              className="asstClose"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Welcome */}
        <div className="asstWelcome">
          <div className="asstWelcomeTitle">{ASSISTANT_WELCOME_TITLE}</div>
          <div className="asstWelcomeText">{ASSISTANT_WELCOME_TEXT}</div>

          <button
            type="button"
            className="asstLearnMore"
            onClick={() => setShowLearnMore((v) => !v)}
          >
            {ASSISTANT_LEARN_MORE_LABEL}
          </button>

          {showLearnMore ? (
            <div className="asstLearnMoreBody">
              Scout is in test mode right now. When you’re ready, we’ll connect your backend to Gemini
              so answers use your real PDP data and policies.
            </div>
          ) : null}
        </div>

        {/* Suggested questions */}
        <div className="asstSuggestions">
          <div className="asstSuggestionsLabel">
            Here are some things I can help with:
          </div>
          <div className="asstSuggestionsRow">
            {(suggestedQuestions || []).map((q) => (
              <button
                key={q}
                className="asstChip"
                type="button"
                onClick={() => void onSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="asstBody" ref={listRef}>
          {messages.map((m) => (
            <div key={m.id} className={`asstMsg ${m.role}`}>
              <div className="asstBubble">{m.text}</div>
            </div>
          ))}

          {sending && (
            <div className="asstMsg assistant">
              <div className="asstBubble typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
        </div>

        <form
          className="asstInputRow"
          onSubmit={(e) => {
            e.preventDefault();
            void onSend(input);
          }}
        >
          <input
            className="asstInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${ASSISTANT_NAME} a question`}
            maxLength={240}
          />
          <button className="asstSend" type="submit" disabled={sending}>
            Send
          </button>
        </form>
      </aside>
    </div>
  );

  return createPortal(body, document.body);
}

export default AssistantDrawer;

