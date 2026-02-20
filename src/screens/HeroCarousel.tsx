import React, { useEffect, useMemo, useRef, useState } from "react";

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
  // NOTE: This component is used as a PDP gallery. Parent controls which images
  // are passed in (main images by default; variant images only when variant selected).
  // We do not introduce new props or new API calls.
  const safeSlides = useMemo(() => {
    const input = slides ?? [];
    const seen = new Set<string>();
    const out: HeroSlide[] = [];
    for (const s of input) {
      const src = (s?.imageSrc ?? "").trim();
      if (!src) continue;
      if (seen.has(src)) continue;
      seen.add(src);
      out.push(s);
    }
    return out;
  }, [slides]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const modalBackdropRef = useRef<HTMLDivElement | null>(null);

  // Keep indexes valid on slides updates (e.g., switching variants).
  useEffect(() => {
    if (!safeSlides.length) {
      setActiveIndex(0);
      setIsModalOpen(false);
      setModalIndex(0);
      return;
    }
    setActiveIndex((i) => Math.min(Math.max(i, 0), safeSlides.length - 1));
    setModalIndex((i) => Math.min(Math.max(i, 0), safeSlides.length - 1));
  }, [safeSlides.length]);

  // Intentionally disable autoplay for Amazon-style PDP gallery UX.
  // Keep intervalMs in signature (no prop changes) but do not use it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unusedIntervalMs = intervalMs;

  const clampIndex = (i: number) => {
    if (!safeSlides.length) return 0;
    if (i < 0) return safeSlides.length - 1;
    if (i >= safeSlides.length) return 0;
    return i;
  };

  const go = (i: number) => {
    if (!safeSlides.length) return;
    setActiveIndex(clampIndex(i));
  };

  const openModal = (i?: number) => {
    if (!safeSlides.length) return;
    const idx = typeof i === "number" ? clampIndex(i) : activeIndex;
    setModalIndex(idx);
    setIsModalOpen(true);
    // Focus the backdrop for keyboard handling.
    window.setTimeout(() => modalBackdropRef.current?.focus(), 0);
  };

  const closeModal = () => setIsModalOpen(false);

  const modalGo = (i: number) => {
    if (!safeSlides.length) return;
    setModalIndex(clampIndex(i));
  };

  const activeSlide = safeSlides[activeIndex];
  const modalSlide = safeSlides[modalIndex];

  if (!safeSlides.length) return <></>;

  return (
    <section className="w-full">
      {/* Gallery (Desktop: vertical thumbs; Mobile: horizontal thumbs) */}
      <div className={`w-full ${heightClassName} flex flex-col sm:flex-row gap-3`}>
        {/* Thumbnails (desktop left rail) */}
        {safeSlides.length > 1 && (
          <div className="hidden sm:flex sm:flex-col sm:w-[76px] sm:shrink-0">
            <div className="h-full overflow-auto pr-1">
              <div className="flex flex-col gap-2">
                {safeSlides.map((s, i) => {
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={`${s.imageSrc}-${i}`}
                      type="button"
                      onClick={() => go(i)}
                      className={`relative w-[68px] h-[68px] rounded border overflow-hidden bg-white ${
                        isActive ? "border-orange-500 ring-2 ring-orange-500/40" : "border-black/10 hover:border-black/25"
                      }`}
                      aria-label={`View image ${i + 1}`}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <img
                        src={s.imageSrc}
                        alt={s.alt}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main image */}
        <div className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => openModal(activeIndex)}
            className="group relative w-full h-full overflow-hidden rounded-md border border-black/10 bg-white"
            aria-label="Open image viewer"
          >
            <img
              src={activeSlide.imageSrc}
              alt={activeSlide.alt}
              className="absolute inset-0 w-full h-full object-contain"
              loading="eager"
            />
            {/* Subtle hover affordance */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-transparent via-transparent to-black/5" />
          </button>

          {/* Prev/Next (desktop overlays) */}
          {safeSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(activeIndex - 1)}
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-14 rounded-md bg-white/85 hover:bg-white border border-black/10 text-black items-center justify-center"
                aria-label="Previous image"
              >
                <span className="text-2xl leading-none">‹</span>
              </button>
              <button
                type="button"
                onClick={() => go(activeIndex + 1)}
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-14 rounded-md bg-white/85 hover:bg-white border border-black/10 text-black items-center justify-center"
                aria-label="Next image"
              >
                <span className="text-2xl leading-none">›</span>
              </button>
            </>
          )}
        </div>

        {/* Thumbnails (mobile horizontal rail) */}
        {safeSlides.length > 1 && (
          <div className="sm:hidden">
            <div className="flex gap-2 overflow-auto pb-1">
              {safeSlides.map((s, i) => {
                const isActive = i === activeIndex;
                return (
                  <button
                    key={`${s.imageSrc}-${i}`}
                    type="button"
                    onClick={() => go(i)}
                    className={`relative w-[64px] h-[64px] shrink-0 rounded border overflow-hidden bg-white ${
                      isActive ? "border-orange-500 ring-2 ring-orange-500/40" : "border-black/10"
                    }`}
                    aria-label={`View image ${i + 1}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <img
                      src={s.imageSrc}
                      alt={s.alt}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal viewer */}
      {isModalOpen && (
        <div
          ref={modalBackdropRef}
          tabIndex={-1}
          className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              closeModal();
              return;
            }
            if (!safeSlides.length) return;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              modalGo(modalIndex - 1);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              modalGo(modalIndex + 1);
            }
          }}
          onMouseDown={(e) => {
            // Close on backdrop click only.
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full max-w-5xl">
            <div className="relative w-full max-h-[85vh] rounded-md bg-white overflow-hidden border border-white/10">
              <img
                src={modalSlide?.imageSrc}
                alt={modalSlide?.alt}
                className="w-full h-[85vh] object-contain"
                loading="eager"
              />

              {/* Close */}
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-2 top-2 z-10 rounded-md bg-black/60 hover:bg-black/75 text-white w-9 h-9 flex items-center justify-center"
                aria-label="Close viewer"
              >
                <span className="text-xl leading-none">×</span>
              </button>

              {/* Prev/Next */}
              {safeSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => modalGo(modalIndex - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-16 rounded-md bg-black/50 hover:bg-black/65 text-white flex items-center justify-center"
                    aria-label="Previous image"
                  >
                    <span className="text-3xl leading-none">‹</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => modalGo(modalIndex + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-16 rounded-md bg-black/50 hover:bg-black/65 text-white flex items-center justify-center"
                    aria-label="Next image"
                  >
                    <span className="text-3xl leading-none">›</span>
                  </button>
                </>
              )}
            </div>

            {/* Modal thumbnail rail */}
            {safeSlides.length > 1 && (
              <div className="mt-3">
                <div className="flex gap-2 overflow-auto pb-1">
                  {safeSlides.map((s, i) => {
                    const isActive = i === modalIndex;
                    return (
                      <button
                        key={`modal-${s.imageSrc}-${i}`}
                        type="button"
                        onClick={() => modalGo(i)}
                        className={`relative w-[64px] h-[64px] shrink-0 rounded border overflow-hidden bg-white ${
                          isActive
                            ? "border-orange-500 ring-2 ring-orange-500/40"
                            : "border-white/20 hover:border-white/40"
                        }`}
                        aria-label={`View image ${i + 1}`}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <img
                          src={s.imageSrc}
                          alt={s.alt}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroCarousel;
