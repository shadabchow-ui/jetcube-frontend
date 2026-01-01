import React, { useMemo } from "react";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";

// ✅ Rufus inline strip (chips + input)
import { AssistantInline } from "../../../../components/RufusAssistant";

/**
 * Removes Amazon sizing suffixes so we can dedupe variants of the same image.
 */
function normalizeAmazonImageUrl(url: string): string {
  if (!url) return "";
  return url.replace(/\._[^.]+(?=\.[a-zA-Z0-9]+$)/, "");
}

function pickProductImage(p: any): string | null {
  const candidates: any[] = [
    p?.thumbnail,
    p?.image,
    p?.image_url,
    p?.imageUrl,
    p?.img,
    p?.primary_image,
    Array.isArray(p?.images) ? p.images[0] : null,
    Array.isArray(p?.gallery_images) ? p.gallery_images[0] : null,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();

    // sometimes image is an object like { src: "..."} or { url: "..."}
    if (c && typeof c === "object") {
      const s = c?.src || c?.url || c?.href;
      if (typeof s === "string" && s.trim()) return s.trim();
    }
  }
  return null;
}

function scoreAmazonVariant(url: string): number {
  if (!url) return 0;
  const m =
    url.match(/_(?:AC_)?S[XY]L?(\d{2,4})_/i) ||
    url.match(/_SL(\d{2,4})_/i) ||
    url.match(/_SX(\d{2,4})_/i) ||
    url.match(/_SY(\d{2,4})_/i);
  const n = m ? Number(m[1]) : 0;
  return Number.isFinite(n) ? n : 0;
}

function dedupeImages(images: any): string[] {
  const arr: string[] = Array.isArray(images) ? images.filter(Boolean) : [];
  if (!arr.length) return [];

  const groups = new Map<string, string[]>();
  for (const url of arr) {
    const key = normalizeAmazonImageUrl(String(url));
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(String(url));
  }

  const unique: string[] = [];
  for (const [, variants] of groups.entries()) {
    const best = [...variants].sort((a, b) => {
      const sb = scoreAmazonVariant(b) - scoreAmazonVariant(a);
      if (sb !== 0) return sb;
      return b.length - a.length;
    })[0];
    unique.push(best);
  }

  return unique;
}

function stripAmazonMentions(s: string): string {
  if (!s) return "";
  return s
    .replace(/\bamazon customer\b/gi, "Verified buyer")
    .replace(/\bamazon\b/gi, "")
    .replace(/\basin\b/gi, "")
    .replace(/\bprime\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeCustomersSay(s: string): string {
  // IMPORTANT: do not invent text; only remove disallowed phrases/noise.
  if (!s) return "";
  return String(s)
    .replace(/AI Generated.*$/gim, "")
    .replace(/Generated from.*$/gim, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function asNumber(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** ⭐ STAR COLOR CONTROL IS HERE (#ffbb00) */
function Stars({ value }: { value: number }) {
  const r = Math.max(0, Math.min(5, value || 0));
  const rounded = Math.round(r * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const Star = ({ filled }: { filled: boolean }) => (
    <svg
      viewBox="0 0 24 24"
      className={filled ? "h-4 w-4 text-[#ffbb00]" : "h-4 w-4 text-gray-300"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
    </svg>
  );

  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} filled />
      ))}
      {half ? <Star filled /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} filled={false} />
      ))}
    </span>
  );
}

/**
 * Local CardGrid so we DO NOT import a missing file.
 */
function CardGrid({ items }: { items: any[] }) {
  const safe = Array.isArray(items) ? items : [];
  const filtered = safe.filter((p) => {
    const id = p?.id || p?.slug || p?.handle;
    return Boolean(id);
  });


  if (!filtered.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {filtered.slice(0, 8).map((p, idx) => {
        const id = (p?.id || p?.slug || "").toString();
        const href = id ? `/p/${id}` : "#";
        const title = stripAmazonMentions((p?.title || p?.name || "").toString());
        const price = p?.price;
        const imgs = dedupeImages(p?.images || p?.gallery_images);
        const img = imgs[0];

        return (
          <a
            key={`${id || "item"}-${idx}`}
            href={href}
            className="border rounded-md p-3 hover:shadow-sm transition bg-white"
          >
            <div className="w-full aspect-square bg-gray-50 border rounded-md flex items-center justify-center overflow-hidden">
              {img ? (
                <img
                  src={img}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="text-xs text-gray-400">No image</div>
              )}
            </div>

            <div className="mt-2 text-sm font-medium line-clamp-2">{title}</div>
            {price ? (
              <div className="mt-1 text-sm font-semibold">${price}</div>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}

type LongBlock =
  | { type: "p"; text: string }
  | { type: "img"; src: string; alt?: string };

function splitParagraphs(text: string): string[] {
  const raw = String(text || "").replace(/\r/g, "").trim();
  if (!raw) return [];
  const parts = raw.includes("\n\n") ? raw.split("\n\n") : raw.split("\n");
  return parts.map((p) => p.trim()).filter(Boolean);
}

function urlKey(u: string): string {
  // normalize for comparisons (strip size suffix + query/hash)
  const s = String(u || "").trim();
  if (!s) return "";
  const noQuery = s.split("?")[0].split("#")[0];
  return normalizeAmazonImageUrl(noQuery);
}

function normalizeLongBlocks(product: any): LongBlock[] {
  const blocksRaw = product?.long_description_blocks;

  // ✅ If blocks exist, FORCE order: all text first, then images
  if (Array.isArray(blocksRaw) && blocksRaw.length) {
    const paragraphs: LongBlock[] = [];
    const images: LongBlock[] = [];

    for (const b of blocksRaw) {
      if (!b || typeof b !== "object") continue;
      const t = String((b as any).type || "").toLowerCase().trim();

      if (t === "img") {
        const src = String((b as any).src || "").trim();
        if (!src) continue;
        const alt = String((b as any).alt || "").trim();
        images.push({ type: "img", src, alt });
      } else {
        const text = String((b as any).text || "").trim();
        if (!text) continue;
        paragraphs.push({ type: "p", text });
      }
    }

    return [...paragraphs, ...images];
  }

  // Fallback: build blocks from paragraphs + description/A+ images
  const longDesc = stripAmazonMentions(
    (product?.long_description || product?.description || "").toString()
  );
  const paras = splitParagraphs(longDesc);

  const descImgs = [
    ...(Array.isArray(product?.description_images) ? product.description_images : []),
    ...(Array.isArray(product?.aplus_images) ? product.aplus_images : []),
  ].filter(Boolean);

  if (!descImgs.length) {
    return paras.map((p) => ({ type: "p", text: p } as LongBlock));
  }

  const imgList = dedupeImages(descImgs);
  const blocks: LongBlock[] = [];

  // ✅ ALL paragraphs first
  for (const p of paras) {
    blocks.push({ type: "p", text: p });
  }

  // ✅ ALL description / A+ images AFTER text
  for (const src of imgList) {
    blocks.push({ type: "img", src, alt: "" });
  }

  return blocks;
}


function guessVideoMime(src: string) {
  const s = String(src || "").toLowerCase();
  if (s.includes(".m3u8")) return "application/x-mpegURL";
  if (s.includes(".mp4")) return "video/mp4";
  if (s.includes(".webm")) return "video/webm";
  return "video/mp4";
}

function pickPlayableVideoSource(v: any): { src: string; type: string } | null {
  // Prefer MP4
  const direct = v?.src ? String(v.src) : "";
  const sources = Array.isArray(v?.sources) ? v.sources : [];

  const srcs: Array<{ src: string; type?: string }> = [];

  if (direct) srcs.push({ src: direct, type: v?.type ? String(v.type) : undefined });

  for (const s of sources) {
    if (!s) continue;
    const ss = String(s?.src || "").trim();
    if (!ss) continue;
    srcs.push({ src: ss, type: s?.type ? String(s.type) : undefined });
  }

  if (!srcs.length) return null;

  const mp4 = srcs.find((x) => x.type?.toLowerCase().includes("mp4") || x.src.toLowerCase().includes(".mp4"));
  if (mp4) return { src: mp4.src, type: mp4.type || "video/mp4" };

  const hls = srcs.find((x) => x.type?.toLowerCase().includes("mpegurl") || x.src.toLowerCase().includes(".m3u8"));
  if (hls) return { src: hls.src, type: hls.type || "application/x-mpegURL" };

  const first = srcs[0];
  return { src: first.src, type: first.type || guessVideoMime(first.src) };
}

export const ProductDetailsSection = (): JSX.Element => {
  const product: any = useProductPdp();

  // Build a strict allow-list for description/A+ images ONLY
  const allowedDescriptionImageKeys = useMemo(() => {
    const merged = [
      ...(Array.isArray(product?.description_images) ? product.description_images : []),
      ...(Array.isArray(product?.aplus_images) ? product.aplus_images : []),
    ].filter(Boolean);

    const keys = new Set<string>();
    for (const u of merged) {
      const k = urlKey(u);
      if (k) keys.add(k);
    }
    return keys;
  }, [product]);

  // Gallery image keys (to explicitly exclude even if someone injects them into blocks)
  const galleryImageKeys = useMemo(() => {
    const gal = [
      ...(Array.isArray(product?.gallery_images) ? product.gallery_images : []),
      ...(Array.isArray(product?.images) ? product.images : []),
    ].filter(Boolean);

    const keys = new Set<string>();
    for (const u of gal) {
      const k = urlKey(u);
      if (k) keys.add(k);
    }
    return keys;
  }, [product]);

  const reviewsObj: any = product?.reviews || {};
  const reviews: any[] = Array.isArray(reviewsObj?.items)
    ? reviewsObj.items
    : Array.isArray(product?.customer_reviews)
      ? product.customer_reviews
      : [];

  const customersSay = useMemo(() => {
    const v =
      reviewsObj?.customers_say ??
      reviewsObj?.customersSay ??
      reviewsObj?.customers_say_summary ??
      "";
    const s = typeof v === "string" ? sanitizeCustomersSay(v.trim()) : "";
    // IMPORTANT: do not generate or invent; only show if present
    return s;
  }, [reviewsObj]);

  const avgRating = useMemo(() => {
    const v =
      reviewsObj?.average_rating ??
      reviewsObj?.avg_rating ??
      product?.average_rating ??
      product?.rating ??
      0;
    return asNumber(v);
  }, [reviewsObj, product]);

  const longBlocks = useMemo(() => normalizeLongBlocks(product), [product]);

  const related = Array.isArray(product?.related) ? product.related : [];
  const alsoViewed = Array.isArray(product?.customer_also_viewed)
    ? product.customer_also_viewed
    : [];

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-16 space-y-14">
      <div className="max-w-[900px]">
        <AssistantInline />
      </div>

      {/* Product description */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Product description</h2>
        <div className="space-y-3 text-gray-700 text-sm w-full max-w-none">
          {longBlocks.map((b, i) => {
            if (b.type === "img") {
              const k = urlKey(b.src);

              // STRICT SEPARATION:
              // - allow ONLY A+ / description_images
              // - explicitly block gallery images (even if injected)
              const allowed =
                (!!k && allowedDescriptionImageKeys.has(k)) &&
                (!k || !galleryImageKeys.has(k));

              if (!allowed) return null;

              return (
                <img
                  key={`img-${i}`}
                  src={b.src}
                  alt={b.alt || ""}
                  className="w-full rounded-md border bg-gray-50"
                  loading="lazy"
                  decoding="async"
                />
              );
            }

            return <p key={`p-${i}`}>{b.text}</p>;
          })}
        </div>
      </div>

      {/* Videos */}
      {Array.isArray(product?.videos) && product.videos.length ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[900px]">
            {product.videos.map((v: any, i: number) => {
              const picked = pickPlayableVideoSource(v);
              if (!picked?.src) return null;

              return (
                <video
                  key={i}
                  controls
                  preload="metadata"
                  className="w-full rounded-md border bg-black"
                >
                  <source src={picked.src} type={picked.type} />
                </video>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Reviews */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>

        {/* Customers say (ONLY if present in source HTML -> JSON) */}
        {customersSay ? (
          <div className="mb-4 max-w-[900px]">
            <div className="text-sm font-semibold text-[#0F1111]">Customers say</div>
            <div className="mt-1 text-sm text-gray-700">{customersSay}</div>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-sm">
          <Stars value={avgRating} />
          <span className="text-gray-700">
            {avgRating ? avgRating.toFixed(1) : "0.0"}
          </span>
          {/* IMPORTANT: Hide review count numbers (do not render counts here) */}
        </div>

        <div className="mt-5 space-y-6">
          {reviews.length ? (
            reviews.slice(0, 12).map((r: any, idx: number) => (
              <div key={idx} className="border-b border-gray-200 pb-6">
                <div className="text-sm font-medium">
                  {stripAmazonMentions(r?.author || "Verified buyer")}
                </div>

                <Stars value={asNumber(r?.rating)} />

                {r?.body ? (
                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                    {stripAmazonMentions(r.body)}
                  </div>
                ) : null}

                {/* Review images ONLY inside their review */}
                {Array.isArray(r?.images) && r.images.length ? (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {r.images.map((img: string, i: number) => (
                      <img
                        key={i}
                        src={img}
                        alt="Customer review"
                        className="aspect-square object-cover border rounded"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-600">No reviews yet.</div>
          )}
        </div>
      </div>

      {related.length ? (
        <div>
          <h2 className="text-xl font-semibold mb-6">Related products</h2>
          <CardGrid items={related} />
        </div>
      ) : null}

      {alsoViewed.length ? (
        <div>
          <h2 className="text-xl font-semibold mb-6">Customers also viewed</h2>
          <CardGrid items={alsoViewed} />
        </div>
      ) : null}
    </section>
  );
};

export default ProductDetailsSection;
