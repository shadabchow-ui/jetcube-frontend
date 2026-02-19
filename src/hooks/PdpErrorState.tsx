// src/hooks/PdpErrorState.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function PdpErrorState({
  title = "We couldn't load this product",
  message,
  onRetry,
}: {
  title?: string;
  message?: string | null;
  onRetry?: (() => void) | null;
}) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-20">
      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <div className="text-lg font-semibold text-white">{title}</div>
        {message ? (
          <div className="mt-2 text-sm text-white/70">{message}</div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {onRetry ? (
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white"
              onClick={onRetry}
            >
              Try again
            </button>
          ) : null}

          <Link
            to="/shop"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
