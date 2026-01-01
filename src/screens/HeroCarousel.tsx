import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export type HeroSlide = {
  imageSrc: string; // use URL path like: /hero/Your Image.jpg
  alt: string;
  href?: string; // e.g. "/shop"
  title?: string;
  subtitle?: string;
  ctaText?: string;
};

type Props = {
  slides: HeroSlide[];
  intervalMs?: number;
  heightClassName?: string; // <- control height here
};

const HeroCarousel = ({
  slides,
  intervalMs = 6500,
  heightClassName = "h-[340px] sm:h-[420px] lg:h-[480px] xl:h-[520px]",
}: Props): JSX.Element => {
  const safeSlides = useMemo(() => slides ?? [], [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeSlides.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeSlides.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [safeSlides.length, intervalMs]);

  const go = (i: number) => {
    if (!safeSlides.length) return;
    const next = (i + safeSlides.length) % safeSlides.length;
    setIndex(next);
  };

  if (!safeSlides.length) return <></>;

  const slide = safeSlides[index];

  return (
    <section className={`relative w-full overflow-hidden rounded-md ${heightClassName}`}>
      {/* Background image */}
      <img
        src={slide.imageSrc}
        alt={slide.alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Dark gradient overlay like Amazon */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl text-white">
          {slide.title && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight">
              {slide.title}
            </h2>
          )}
          {slide.subtitle && (
            <p className="mt-2 text-sm sm:text-base text-white/90">
              {slide.subtitle}
            </p>
          )}

          {slide.href && (
            <div className="mt-4">
              <Link
                to={slide.href}
                className="inline-flex items-center justify-center px-4 py-2 rounded border border-white/25 bg-white/10 hover:bg-white/20 text-sm"
              >
                {slide.ctaText ?? "Shop now"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Prev/Next */}
      {safeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-14 rounded-md bg-black/35 hover:bg-black/50 border border-white/15 text-white"
            aria-label="Previous slide"
          >
            <span className="text-2xl">‹</span>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-14 rounded-md bg-black/35 hover:bg-black/50 border border-white/15 text-white"
            aria-label="Next slide"
          >
            <span className="text-2xl">›</span>
          </button>
        </>
      )}

      {/* Dots */}
      {safeSlides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {safeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2.5 w-2.5 rounded-full border border-white/30 ${i === index ? "bg-white" : "bg-white/30"
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroCarousel;


