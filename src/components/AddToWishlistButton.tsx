import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useWishlist } from "../context/WishlistContext";

export default function AddToWishlistButton({ product }: { product: any }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const active = isInWishlist(product.sku);

  const toggle = () => {
    active
      ? removeFromWishlist(product.sku)
      : addToWishlist({
          sku: product.sku,
          title: product.title,
          price: product.price,
          image: product.image,
          slug: product.slug,
        });
  };

  return (
    <button
      onClick={toggle}
      aria-label="Add to wishlist"
      className="flex items-center gap-2 text-sm font-semibold"
    >
      {active ? (
        <HeartSolid className="h-5 w-5 text-red-500" />
      ) : (
        <HeartIcon className="h-5 w-5" />
      )}
      {active ? "Saved" : "Wishlist"}
    </button>
  );
}
