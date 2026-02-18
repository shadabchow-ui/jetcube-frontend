import React, { useMemo } from "react";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";

// ✅ Rufus inline strip (chips + input)
import { AssistantInline } from "../../../../components/RufusAssistant";

/**
 * ProductDetailsSection
 * - category-neutral, deterministic render helpers
 * - strict separation of gallery media vs description/A+ media
 * - safe review rendering (no injection into SEO fields; this is UI only)
 *
 * NOTE: This file intentionally avoids importing additional components
 * to prevent case/path issues in Cloudflare Linux builds.
 */

/** Strip Amazon-style sizing suffixes so we can dedupe variants of the same image. */
function normalizeAmazonImageUrl(url: string): string {
  if (!url) return "";
  return String(url).replace(/\._[^.]+(?=\.[a-zA-Z0-9]+$)/, "");
}

/** Create a stable key for dedupe and allow/deny lists. */
function urlKey(url: string): string {
  if (!url) return "";
  const u = normalizeAmazonImageUrl(String(url)).trim();
  if (!u) return "";
  // Ignore query params when present (rare)
  const q = u.indexOf("?");
  return (q >= 0 ? u.slice(0, q) : u).trim();
}

/** Try to rank Amazon image variants (bigger is usually better). */
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

/** Dedupe images by normalized key, picking the "best" (largest) variant per key. */
function dedupeImages(images: any): string[] {
  const arr: string[] = Array.isArray(images) ? images.filter(Boolean).map(String) : [];
  if (!arr.length) return [];

  const groups = new Map<string, string[]>();
  for (const url of arr) {
    const key = urlKey(url);
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

/** Remove Amazon mentions and obvious boilerplate without inventing anything. */
function stripAmazonMentions(s: string): string {
  if (!s) return "";
  return String(s)
    .replace(/\bamazon customer\b/gi, "Verified buyer")
    .replace(/\bamazon\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function asNumber(v: any): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
}

/** Basic semver compare for "v1.2.0" style strings. */
function semverGte(version: string, target: string): boolean {
  const parse = (v: string) =>
    String(v || "v0.0.0")
      .replace(/^v/i, "")
      .split(".")
      .map((x) => Number(String(x).replace(/[^\d]/g, "")) || 0);

  const a = parse(version);
  const b = parse(target);

  for (let i = 0; i < 3; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return true;
}

/** Detect and remove review/spec contamination if legacy SEO fields are present. */
const CONTAMINATION_PATTERNS: RegExp[] = [
  /customer\s+(rating|review|feedback|find)/i,
  /\d+(\.\d+)?\/5/i,
  /\d+(\.\d+)?\s+out\s+of\s+\d+\s+stars?/i,
  /^key\s+details:/i,
  /based\s+on\s+\d+\s+reviews?/i,
  /\bcustomer\s+reviews\b/i,
  /\bbest\s+sellers\s+rank\b/i,
  /\bverified\s+purchase\b/i,
];

function isContaminatedText(s: string): boolean {
  const t = String(s || "").trim();
  if (!t) return false;
  return CONTAMINATION_PATTERNS.some((re) => re.test(t));
}

/** Review sanitizers */
function cleanReviewTitle(title: string): string {
  if (!title) return "";
  return String(title)
    .replace(/^\d+(\.\d+)?\s+out\s+of\s+\d+\s+stars?\s*/i, "")
    .trim();
}
function cleanReviewBody(body: string): string {
  if (!body) return "";
  return String(body).replace(/\s*Read more\s*$/i, "").trim();
}

/** Video sanitizer: dedupe triplets, reject malformed, prefer productVideoOptimized.mp4 */
type CleanVideo = { src: string; type: string };
function guessVideoMime(src: string): string {
  const s = (src || "").toLowerCase();
  if (s.includes(".m3u8")) return "application/x-mpegURL";
  if (s.includes(".webm")) return "video/webm";
  return "video/mp4";
}
function sanitizeVideos(raw: any): CleanVideo[] {
  const arr = Array.isArray(raw) ? raw : [];
  if (!arr.length) return [];

  const seen = new Set<string>();
  const results: Array<CleanVideo & { _id: string }> = [];

  const extractId = (url: string) => {
    const m = url.match(/\/([a-f0-9-]{36})\.mp4/i);
    return m ? m[1] : url;
  };

  const getCandidateUrls = (entry: any): string[] => {
    const out: string[] = [];
    const direct = entry?.src ? String(entry.src) : "";
    if (direct) out.push(direct);

    const sources = Array.isArray(entry?.sources) ? entry.sources : [];
    for (const s of sources) {
      const u = s?.src ? String(s.src) : "";
      if (u) out.push(u);
    }
    return out.filter(Boolean);
  };

  for (const entry of arr) {
    const candidates = getCandidateUrls(entry);

    for (let url of candidates) {
      // reject obvious malformed entries
      if (!url) continue;

      // Handle HTML-escaped JSON fragments that include videoSrc
      if (url.includes("&quot;") || url.includes("THUMBNAIL")) {
        const m = url.match(/videoSrc&quot;:&quot;([^&]+)/);
        if (m && m[1]) {
          url = m[1];
        } else {
          continue;
        }
      }

      // must look like playable media
      if (!url.match(/\.(mp4|webm|m3u8)($|\?)/i)) continue;

      const id = extractId(url);
      const type = guessVideoMime(url);

      if (seen.has(id)) {
        // Prefer optimized variant if we already saw this id
        if (url.includes("productVideoOptimized")) {
          const idx = results.findIndex((r) => r._id === id);
          if (idx >= 0) results[idx] = { src: url, type, _id: id };
        }
        continue;
      }

      seen.add(id);
      results.push({ src: url, type, _id: id });
    }
  }

  return results.map(({ src, type }) => ({ src, type }));
}

/** Star rating: UI only */
function Stars({ value }: { value: number }) {
  const rounded = Math.round((asNumber(value) || 0) * 2) / 2;
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
      <path d="M12 17.27l5.18 3.04-1.64-5.81L20 9.24l-5.9-.5L12 3.5 9.9 8.74 4 9.24l4.46 5.26-1.64 5.81L12 17.27z" />
    </svg>
  );

  const HalfStar = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#ffbb00]" fill="currentColor" aria-hidden="true">
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        fill="url(#half)"
        d="M12 17.27l5.18 3.04-1.64-5.81L20 9.24l-5.9-.5L12 3.5 9.9 8.74 4 9.24l4.46 5.26-1.64 5.81L12 17.27z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 17.27l5.18 3.04-1.64-5.81L20 9.24l-5.9-.5L12 3.5 9.9 8.74 4 9.24l4.46 5.26-1.64 5.81L12 17.27z"
      />
    </svg>
  );

  return (
    <div className="inline-flex items-center gap-1" aria-label={`Rating ${rounded} out of 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} filled />
      ))}
      {half ? <HalfStar /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} filled={false} />
      ))}
    </div>
  );
}

/**
 * Simple product card grid for related/also-viewed.
 * Keeps everything local so we DO NOT import a missing file.
 */
function CardGrid({ items }: { items: any[] }) {
  const safe = Array.isArray(items) ? items : [];
  const filtered = safe.filter((p) => {
    const id = p?.id || p?.slug || p?.handle;
    return Boolean(id);
  });

  if (!filtered.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {filtered.slice(0, 8).map((p, idx) => {
        const id = (p?.id || p?.slug || p?.handle || "").toString();
        const href = id ? `/p/${id}` : "#";
        const title = stripAmazonMentions((p?.title_seo || p?.title || p?.name || "").toString());
        const price = p?.price;
        const imgs = dedupeImages(p?.images || p?.gallery_images);
        const img = imgs[0];

        return (
          <a
            key={`${id || "item"}-${idx}`}
            href={href}
            className="border rounded-md p-2 sm:p-3 hover:shadow-sm transition bg-white"
          >
            <div className="w-full aspect-square bg-gray-50 border rounded-md flex items-center justify-center overflow-hidden">
              {img ? (
                <img
                  src={img}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="text-xs text-gray-400">No image</div>
              )}
            </div>

            <div className="mt-2 text-sm font-medium line-clamp-2">{title}</div>
            {price ? <div className="mt-1 text-sm font-semibold">${price}</div> : null}
          </a>
        );
      })}
    </div>
  );
}

type LongBlock = { type: "p"; text: string } | { type: "img"; src: string; alt?: string };

/**
 * Normalize description blocks:
 * - prefer clean SEO description when available (v1.2.0+)
 * - otherwise use long_description_blocks if present
 * - finally fall back to long_description / description / short_description
 *
 * Additionally:
 * - drop contaminated paragraphs (review/rating/spec dumps)
 * - keep images but only allow those from description_images/aplus_images allowlist,
 *   and explicitly exclude gallery images.
 */
function normalizeLongBlocks(product: any, seoClean: boolean): LongBlock[] {
  if (!product) return [];

  const out: LongBlock[] = [];

  // 1) Prefer clean SEO description if present
  const seoDescRaw = seoClean ? String(product?.description_seo || "").trim() : "";
  const seoDesc = seoDescRaw && !isContaminatedText(seoDescRaw) ? seoDescRaw : "";

  if (seoDesc) {
    // Keep deterministic paragraph splitting without inventing content
    const paras = seoDesc
      .split(/\n{2,}|\r\n{2,}/)
      .map((p) => stripAmazonMentions(p).trim())
      .filter(Boolean)
      .filter((p) => !isContaminatedText(p));
    for (const p of paras) out.push({ type: "p", text: p });
  } else {
    // 2) Use structured blocks if present, but filter contaminated p-blocks
    const blocksRaw = product?.long_description_blocks;

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
          const text = stripAmazonMentions(String((b as any).text || "").trim());
          if (!text) continue;
          if (isContaminatedText(text)) continue;
          paragraphs.push({ type: "p", text });
        }
      }

      // Keep a stable order: text first, then images.
      return [...paragraphs, ...images];
    }

    // 3) Fallback: build blocks from text fields
    const fallbackTextRaw = String(
      product?.long_description || product?.description || product?.short_description || ""
    ).trim();
    const fallbackText = stripAmazonMentions(fallbackTextRaw);

    const paras = fallbackText
      .split(/\n{2,}|\r\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !isContaminatedText(p));

    for (const p of paras) out.push({ type: "p", text: p });
  }

  // Add images at the end (if no blocks path already returned with imgs)
  const extraImgs = [
    ...(Array.isArray(product?.description_images) ? product.description_images : []),
    ...(Array.isArray(product?.aplus_images) ? product.aplus_images : []),
  ]
    .filter(Boolean)
    .map(String);

  for (const src of dedupeImages(extraImgs)) out.push({ type: "img", src });

  return out;
}

function sanitizeCustomersSay(s: string): string {
  const t = stripAmazonMentions(s || "");
  // Keep it short and safe; do not generate.
  if (t.length < 20) return "";
  if (t.length > 600) return t.slice(0, 600).trim();
  return t;
}

export const ProductDetailsSection = (): JSX.Element => {
  const product: any = useProductPdp();

  // Version-gate SEO fields
  const seoVersion = String(product?.seo_rewrite_version || "v0.0.0");
  const seoClean = semverGte(seoVersion, "v1.2.0");

  // Build a strict allow-list for description/A+ images ONLY
  const allowedDescriptionImageKeys = useMemo(() => {
    const merged = [
      ...(Array.isArray(product?.description_images) ? product.description_images : []),
      ...(Array.isArray(product?.aplus_images) ? product.aplus_images : []),
      // include long_description_blocks img sources when present (but still subject to gallery exclusion below)
      ...(Array.isArray(product?.long_description_blocks)
        ? product.long_description_blocks
            .filter((b: any) => String(b?.type || "").toLowerCase() === "img" && b?.src)
            .map((b: any) => b.src)
        : []),
    ].filter(Boolean);

    const keys = new Set<string>();
    for (const u of merged) {
      const k = urlKey(String(u));
      if (k) keys.add(k);
    }
    return keys;
  }, [product]);

  // Gallery image keys (to explicitly exclude even if someone injects them into blocks)
  const galleryImageKeys = useMemo(() => {
    const gal = [
      ...(Array.isArray(product?.gallery_images) ? product.gallery_images : []),
      ...(Array.isArray(product?.images) ? product.images : []),
      ...(Array.isArray(product?.color_images)
        ? Object.values(product.color_images).flatMap((v: any) => (Array.isArray(v) ? v : []))
        : []),
    ].filter(Boolean);

    const keys = new Set<string>();
    for (const u of gal) {
      const k = urlKey(String(u));
      if (k) keys.add(k);
    }
    return keys;
  }, [product]);

  const longBlocks = useMemo(() => normalizeLongBlocks(product, seoClean), [product, seoClean]);

  const videos = useMemo(() => sanitizeVideos(product?.videos), [product?.videos]);

  const reviewsObj = product?.reviews || product?.customer_reviews || product?.review_data || {};
  const reviews = useMemo(() => {
    const arr = Array.isArray(reviewsObj?.items)
      ? reviewsObj.items
      : Array.isArray(product?.customer_reviews)
        ? product.customer_reviews
        : [];
    return Array.isArray(arr) ? arr : [];
  }, [reviewsObj, product]);

  const customersSay = useMemo(() => {
    const v =
      reviewsObj?.customers_say ??
      reviewsObj?.customersSay ??
      reviewsObj?.customers_say_summary ??
      "";
    const s = typeof v === "string" ? sanitizeCustomersSay(v.trim()) : "";
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

  const related = Array.isArray(product?.related) ? product.related : [];
  const alsoViewed = Array.isArray(product?.customer_also_viewed) ? product.customer_also_viewed : [];

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-14">
      <div className="max-w-[900px]">
        <AssistantInline />
      </div>

      {/* Product description */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Product description</h2>

        <div className="space-y-3 text-gray-700 text-sm w-full max-w-none break-words">
          {longBlocks.map((b, i) => {
            if (b.type === "img") {
              const k = urlKey(b.src);

              // STRICT SEPARATION:
              // - allow ONLY A+ / description_images allowlist
              // - explicitly block gallery images (even if injected)
              const allowed =
                (!!k && allowedDescriptionImageKeys.has(k)) && (!k || !galleryImageKeys.has(k));

              if (!allowed) return null;

              return (
                <img
                  key={`img-${i}`}
                  src={b.src}
                  alt={b.alt || ""}
                  className="w-full max-w-full rounded-md border bg-gray-50"
                  loading="lazy"
                  decoding="async"
                />
              );
            }

            const txt = stripAmazonMentions(b.text || "");
            if (!txt) return null;
            if (isContaminatedText(txt)) return null;

            return <p key={`p-${i}`}>{txt}</p>;
          })}
        </div>
      </div>

      {/* Videos */}
      {videos.length ? (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[900px]">
            {videos.slice(0, 4).map((v, i) => (
              <video key={i} controls preload="metadata" className="w-full rounded-md border bg-black">
                <source src={v.src} type={v.type || guessVideoMime(v.src)} />
              </video>
            ))}
          </div>
        </div>
      ) : null}

      {/* Reviews */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Reviews</h2>

        {/* Customers say (ONLY if present in source HTML -> JSON) */}
        {customersSay ? (
          <div className="mb-4 max-w-[900px]">
            <div className="text-sm font-semibold text-[#0F1111]">Customers say</div>
            <div className="mt-1 text-sm text-gray-700">{customersSay}</div>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-sm">
          <Stars value={avgRating} />
          <span className="text-gray-700">{avgRating ? avgRating.toFixed(1) : "0.0"}</span>
          {/* IMPORTANT: Hide review count numbers here (avoid clutter, can be added elsewhere) */}
        </div>

        <div className="mt-5 space-y-6">
          {reviews.length ? (
            reviews.slice(0, 12).map((r: any, idx: number) => {
              const author = stripAmazonMentions(r?.author || "Verified buyer");
              const title = cleanReviewTitle(String(r?.title || "").trim());
              const date = stripAmazonMentions(String(r?.date || "").trim());
              const body = stripAmazonMentions(cleanReviewBody(String(r?.body || "").trim()));
              const rating = asNumber(r?.rating);

              return (
                <div key={idx} className="border-b border-gray-200 pb-6">
                  <div className="text-sm font-medium">{author || "Verified buyer"}</div>

                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={rating} />
                    {date ? <span className="text-xs text-gray-500">{date}</span> : null}
                  </div>

                  {title ? <div className="mt-2 text-sm font-semibold text-[#0F1111]">{title}</div> : null}

                  {body ? (
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">{body}</div>
                  ) : null}

                  {/* Review images ONLY inside their review */}
                  {Array.isArray(r?.images) && r.images.length ? (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {r.images
                        .filter(Boolean)
                        .slice(0, 10)
                        .map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt="Customer review"
                            className="aspect-square object-cover border rounded"
                            loading="lazy"
                            decoding="async"
                          />
                        ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-600">No reviews yet.</div>
          )}
        </div>
      </div>

      {related.length ? (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-6">Related products</h2>
          <CardGrid items={related} />
        </div>
      ) : null}

      {alsoViewed.length ? (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-6">Customers also viewed</h2>
          <CardGrid items={alsoViewed} />
        </div>
      ) : null}
    </section>
  );
};

export default ProductDetailsSection;
