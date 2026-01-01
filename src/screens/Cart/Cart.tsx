import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

/**
 * /cart page
 * Amazon-style two-column cart page
 * Wired to CartContext (single source of truth)
 */

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export const Cart = (): JSX.Element => {
  const {
    items,
    updateQty,
    removeFromCart,
    totalCount,
    subtotal,
  } = useCart();

  return (
    <main className="bg-[#eaeded] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* LEFT: items */}
          <section className="bg-white border border-[#d5dbdb] rounded p-5">
            <div className="flex items-end justify-between">
              <h1 className="text-[22px] font-bold text-[#0F1111]">
                Shopping Cart
              </h1>
              <div className="text-[12px] text-[#565959]">Price</div>
            </div>

            <div className="border-t border-[#e7e7e7] mt-3" />

            {items.length === 0 ? (
              <div className="py-10">
                <div className="text-[#0F1111] text-[16px] font-semibold">
                  Your Cart is empty
                </div>
                <div className="mt-2 text-[13px] text-[#565959]">
                  Add items to your cart to see them here.
                </div>
                <div className="mt-4">
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center bg-[#ffd814] hover:bg-[#f7ca00] text-black text-[13px] font-semibold px-4 py-2 rounded"
                  >
                    Shop now
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-5">
                  {items.map((it) => (
                    <div key={it.id} className="flex gap-4">
                      <div className="w-[120px] h-[120px] bg-[#f7f8f8] rounded overflow-hidden shrink-0">
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[16px] font-semibold text-[#0F1111] leading-snug">
                              {it.name}
                            </div>
                            <div className="mt-1 text-[12px] text-[#007600]">
                              In Stock
                            </div>

                            <div className="mt-2 flex items-center gap-3 text-[12px]">
                              <div className="flex items-center gap-2">
                                <label className="text-[#565959]">Qty:</label>
                                <select
                                  className="h-[30px] px-2 text-[13px] border border-[#d5dbdb] rounded bg-white"
                                  value={it.quantity}
                                  onChange={(e) =>
                                    updateQty(it.id, Number(e.target.value))
                                  }
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                  ))}
                                </select>
                              </div>

                              <span className="text-[#d5dbdb]">|</span>

                              <button
                                className="text-[#007185] hover:underline"
                                onClick={() => removeFromCart(it.id)}
                              >
                                Delete
                              </button>

                              <span className="text-[#d5dbdb]">|</span>

                              <button className="text-[#007185] hover:underline">
                                Save for later
                              </button>
                            </div>
                          </div>

                          <div className="text-[16px] font-bold text-[#0F1111] whitespace-nowrap">
                            {formatUSD(it.price * it.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#e7e7e7] mt-5 pt-4 flex justify-end">
                  <div className="text-[18px] text-[#0F1111]">
                    Subtotal ({totalCount} item{totalCount === 1 ? "" : "s"}):{" "}
                    <span className="font-bold">{formatUSD(subtotal)}</span>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* RIGHT: summary */}
          <aside className="bg-white border border-[#d5dbdb] rounded p-5 h-fit">
            <div className="text-[12px] text-[#007600] mb-2">
              Your order qualifies for FREE Shipping.
            </div>

            <div className="text-[18px] text-[#0F1111] mb-4">
              Subtotal ({totalCount} item{totalCount === 1 ? "" : "s"}):{" "}
              <span className="font-bold">{formatUSD(subtotal)}</span>
            </div>

            <button
              className="w-full inline-flex items-center justify-center bg-[#ffd814] hover:bg-[#f7ca00] text-black text-[13px] font-semibold px-4 py-2 rounded"
              disabled={items.length === 0}
              onClick={async () => {
                try {
                  const res = await fetch("http://localhost:4242/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      cart: items.map((it) => ({
                        title: it.name,
                        price_cents: Math.round(it.price * 100),
                        quantity: it.quantity,
                      })),
                      successUrl: `${window.location.origin}/order-complete`,
                    }),
                  });

                  if (!res.ok) throw new Error("Checkout failed");
                  const data = await res.json();
                  window.location.href = data.checkoutUrl;
                } catch {
                  alert("Checkout failed. Please try again.");
                }
              }}
            >
              Proceed to checkout
            </button>

            <div className="mt-3 text-[12px] text-[#565959]">
              By placing your order, you agree to our conditions of use and privacy notice.
            </div>

            <div className="mt-4 border-t border-[#e7e7e7] pt-4">
              <Link to="/shop" className="text-[#007185] hover:underline text-[13px]">
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;

