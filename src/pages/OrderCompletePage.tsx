import React from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function OrderCompletePage() {
  const [params] = useSearchParams();

  // Square may append params depending on flow; safe to show/debug
  const orderId = params.get("orderId") || params.get("order_id") || "";

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10">
      <h1 className="text-2xl font-semibold text-[#0F1111]">Order complete</h1>
      <p className="mt-2 text-[#565959]">
        Thanks — your checkout finished successfully.
      </p>

      {orderId ? (
        <p className="mt-2 text-sm text-[#565959]">
          Order ID: <span className="text-[#0F1111]">{orderId}</span>
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded border border-gray-300 px-4 py-2 text-sm hover:border-gray-500"
        >
          Continue shopping
        </Link>
        <Link
          to="/orders"
          className="inline-flex items-center justify-center rounded bg-[#FFD814] px-4 py-2 text-sm font-semibold text-[#0F1111] hover:bg-[#F7CA00]"
        >
          View orders
        </Link>
      </div>
    </div>
  );
}
