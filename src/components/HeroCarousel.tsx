import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export type HeroSlide = {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
};

const AUTO_DELAY = 5500;

const HeroCarousel = ({ slides }: { slides: HeroSlide[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_DELAY);
    return () => clearInterval(t);
  }, [slides.length]);

  const prev = () =>
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () =>
    setIndex((i) => (i + 1) % slides.length);

  if (!slides.length) return null;

  const s = slides[index];

  return (
    <section className="relative overflow-hidden rounded-md">
      {/* background */}
      <div
        className="h-[280px] sm:h-[340px] bg-cover bg-center transition-all"
        style={{ backgroundImage: `url(${s.image})` }}
      >
        {/* gradient overlay (Amazon style) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        {/* content */}
        <div className="relative z-10 h-full flex items-center px-6 max-w-[1500px] mx-auto">
          <div className="max-w-xl text-white">
            <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
              {s.title}
            </h2>
            {s.subtitle && (
              <p className="mt-2 text-sm sm:text-base text-white/90">
                {s.subtitle}
              </p>
            )}
            {s.ctaHref && (
              <Link
                to={s.ctaHref}
                className="inline-block mt-4 bg-[#ffd814] text-black px-4 py-2 rounded text-sm font-medium hover:bg-[#f7ca00]"
              >
                {s.ctaText || "Shop now"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-16 bg-white/80 hover:bg-white text-black rounded shadow"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-16 bg-white/80 hover:bg-white text-black rounded shadow"
          >
            ›
          </button>
        </>
      )}

      {/* dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroCarousel;
