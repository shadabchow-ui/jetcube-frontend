import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { XIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useCart } from "../../context/CartContext";

export const CartSidebar = (): JSX.Element => {
  const {
    items,
    subtotal,
    totalCount,
    updateQty,
    removeFromCart,
    closeCart,
  } = useCart();

  const navigate = useNavigate();

  const handleClose = () => {
    closeCart();
    if (window.location.pathname === "/cart-sidebar") {
      navigate(-1);
    }
  };

  const formatUSD = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);


  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b">
          <div className="text-[18px] font-bold text-[#0F1111]">
            Shopping Cart
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
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
                  onClick={handleClose}
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[12px] text-[#565959] mb-3">
                {totalCount} item{totalCount === 1 ? "" : "s"}
              </div>

              <div className="space-y-4">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="border border-[#e7e7e7] rounded p-3"
                  >
                    <div className="flex gap-3">
                      <div className="w-[88px] h-[88px] bg-[#f7f8f8] rounded overflow-hidden shrink-0">
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-[#0F1111] leading-snug">
                          {it.name}
                        </div>

                        <div className="mt-1 text-[12px] text-[#007600]">
                          In Stock
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-[14px] font-bold text-[#0F1111]">
                            {formatUSD(it.price)}
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-[12px] text-[#565959]">
                              Qty:
                            </label>
                            <select
                              className="h-[30px] px-2 text-[13px] border border-[#d5dbdb] rounded bg-white"
                              value={it.quantity}
                              onChange={(e) =>
                                updateQty(it.id, Number(e.target.value))
                              }
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-3 text-[12px]">
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
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[14px] text-[#0F1111] font-semibold">
              Subtotal
            </div>
            <div className="text-[16px] text-[#0F1111] font-bold">
              {formatUSD(subtotal)}
            </div>
          </div>

          <button
            className="w-full inline-flex items-center justify-center bg-[#ffd814] hover:bg-[#f7ca00] text-black text-[13px] font-semibold px-4 py-2 rounded"
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

                if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
                const data = await res.json();
                if (!data?.checkoutUrl) throw new Error("Missing checkoutUrl");

                handleClose();
                window.location.href = data.checkoutUrl;
              } catch (err) {
                console.error(err);
                alert("Checkout failed. Please try again.");
              }
            }}
          >
            Proceed to checkout
          </button>

          <div className="mt-3 flex items-center justify-between text-[12px]">
            <Link to="/cart" className="text-[#007185] hover:underline">
              View cart
            </Link>
            <Link
              to="/shop"
              className="text-[#007185] hover:underline"
              onClick={handleClose}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CartSidebar;



