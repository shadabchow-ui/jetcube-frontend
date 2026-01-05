import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

export default function WishlistPage() {
  const { items, remove, clear } = useWishlist();
  const { addToCart, openCart } = useCart();

  if (!items || items.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#0F1111]">Your wishlist</h1>
        <p className="mt-3 text-sm text-[#565959]">You haven’t saved anything yet.</p>

        <Link
          to="/shop"
          className="inline-flex items-center justify-center mt-5 border border-[#d5dbdb] rounded px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#0F1111]">Your wishlist</h1>

        <button
          type="button"
          className="text-sm border border-[#d5dbdb] rounded px-3 py-2 hover:bg-gray-50"
          onClick={clear}
        >
          Clear all
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((p: any) => {
          const id = String(p?.id || "").trim();
          const name = String(p?.name || "Product");
          const priceNum = Number(p?.price);
          const priceOk = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 49.99;
          const image = String(p?.image || "").trim();

          return (
            <div key={id || name} className="border border-[#d5dbdb] rounded-md p-3 bg-white">
              <Link to={id ? `/p/${id}` : "/shop"} className="block">
                <div className="w-full aspect-square bg-gray-50 border border-[#d5dbdb] rounded-md overflow-hidden flex items-center justify-center">
                  {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs text-gray-400">No image</div>
                  )}
                </div>

                <div className="mt-2 text-sm font-medium text-[#0F1111] line-clamp-2">
                  {name}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#0F1111]">
                  ${priceOk.toFixed(2)}
                </div>
              </Link>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="flex-1 bg-[#0061c9] hover:bg-[#0061c9] text-white font-semibold py-2 rounded-full border border-[#0061c9]"
                  onClick={() => {
                    if (!id) return;
                    addToCart(
                      {
                        id,
                        name,
                        price: priceOk,
                        image,
                      },
                      1
                    );
                    openCart();
                  }}
                >
                  Move to Basket
                </button>

                <button
                  type="button"
                  className="w-[40px] border border-[#d5dbdb] rounded-full flex items-center justify-center hover:bg-gray-50"
                  aria-label="Remove"
                  onClick={() => {
                    if (!id) return;
                    remove(id);
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


