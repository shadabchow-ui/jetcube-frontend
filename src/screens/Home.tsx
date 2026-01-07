import React from "react";
import HeroCarousel, { type HeroSlide } from "./HeroCarousel";
import HomeRow, { type ProductCardData } from "./HomeRow";
import { useIndexProducts } from "../data/useIndexProducts";

// Rufus Assistant
import {
  AssistantContextProvider,
  AssistantDrawer,
  useAssistant,
} from "@/components/RufusAssistant";

const shuffle = <T,>(arr: T[]): T[] =>
  [...arr].sort(() => Math.random() - 0.5);

/* ------------------------------------
 * Amazon-style SCOUT tab (LEFT FLOATING)
 * ---------------------------------- */
function ScoutTab() {
  const { setOpen } = useAssistant();

  return (
    <button
      type="button"
      aria-label="Open Scout"
      onClick={() => setOpen(true)}
      className="
        hidden md:flex
        fixed left-[15px] top-1/2 z-[9999]
        bg-black text-white
        border-2 border-white
        shadow-2xl
        px-5 py-4
        text-base font-extrabold
        tracking-widest
        rounded-r-xl
        hover:bg-[#111]
        focus:outline-none focus:ring-2 focus:ring-white
      "
      style={{
        transform: "translateY(-50%) rotate(-90deg)",
        transformOrigin: "left center",
        letterSpacing: "0.2em",
      }}
    >
      scout
    </button>
  );
}

const Home = (): JSX.Element => {
  /* ------------------------------------
   * Hero slides
   * ---------------------------------- */
  const heroSlides: HeroSlide[] = [
    {
      imageSrc: "/hero/Brown House Of Fashion Photo Collage Facebook Cover.jpg",
      alt: "Fashion collage hero banner",
      title: "New styles. Better prices.",
      subtitle: "Everyday wear, formal styles, and more.",
    },
    {
      imageSrc: "/hero/Brown New Style Fashion Facebook Cover.jpg",
      alt: "Trending fashion styles",
      title: "Trending looks right now",
      subtitle: "Fresh picks across categories.",
    },
    {
      imageSrc: "/hero/Grey Modern Furniture Promotion Banner.jpg",
      alt: "Modern home essentials",
      title: "Modern essentials for every space",
      subtitle: "Clean design. Everyday comfort.",
    },
    {
      imageSrc:
        "/hero/Simple Modern Photo Collage Autumn Fashion Sale Banner (1).jpg",
      alt: "Seasonal fashion",
      title: "Seasonal styles you’ll love",
      subtitle: "Updated looks for the season.",
    },
  ];

  const { items, loading, error } = useIndexProducts();

  if (loading) {
    return (
      <main className="max-w-[1500px] mx-auto px-3">
        <div className="py-12 text-center text-gray-500">Loading…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-[1500px] mx-auto px-3">
        <div className="py-12 text-center text-gray-500">
          {/* Fail soft — homepage should never break */}
          Loading products…
        </div>
      </main>
    );
  }

  /* ------------------------------------
   * Normalize products → cards
   * ---------------------------------- */
  const toCard = (p: any): ProductCardData => ({
    handle: p.handle,
    title: p.title,
    image:
      p.image ||
      p.image_url ||
      p.main_image ||
      p.images?.[0] ||
      p.gallery?.[0] ||
      null,
    price: p.price,
    wasPrice: p.was_price,
    rating: p.rating,
    ratingCount: p.rating_count,
    badge: p.badge,
  });

  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const shuffled = shuffle(safeItems);

  /* ------------------------------------
   * Homepage sections
   * ---------------------------------- */
  const trending = shuffled.slice(0, 16).map(toCard);

  const recommended = shuffled.slice(16, 32).map(toCard);

  const deals = safeItems
    .filter((p) => {
      const price = Number(p.price);
      const was = Number(p.was_price);
      return Number.isFinite(price) && Number.isFinite(was) && was > price;
    })
    .slice(0, 16)
    .map(toCard);

  return (
    <AssistantContextProvider context="home">
      {/* Drawer (opens when SCOUT is clicked) */}
      <AssistantDrawer />

      {/* Amazon-style floating SCOUT tab */}
      <ScoutTab />

      <main className="max-w-[1500px] mx-auto px-2 sm:px-3 lg:px-4 space-y-6">
        <HeroCarousel
          slides={heroSlides}
          heightClassName="h-[360px] sm:h-[440px] lg:h-[520px] xl:h-[560px]"
        />

        {trending.length > 0 && (
          <HomeRow
            title="Trending picks"
            items={trending}
            viewAllHref="/shop"
          />
        )}

        {recommended.length > 0 && (
          <HomeRow
            title="Recommended for you"
            items={recommended}
            viewAllHref="/shop"
          />
        )}

        {deals.length > 0 && (
          <HomeRow
            title="Top deals"
            items={deals}
            viewAllHref="/shop"
          />
        )}
      </main>
    </AssistantContextProvider>
  );
};

export default Home;



















