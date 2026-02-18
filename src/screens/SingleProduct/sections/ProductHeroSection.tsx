import React, { useMemo } from "react";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";
import { CardGrid } from "../../../../components/CardGrid";
import { AssistantInline } from "../../../../components/RufusAssistant";

function semverGte(version: string, target: string) {
  const parse = (v: string) =>
    String(v || "")
      .replace(/^v/i, "")
      .split(".")
      .map((x) => parseInt(x, 10) || 0);

  const a = parse(version);
  const b = parse(target);

  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return true;
}

// Remove Amazon/marketplace references from long text.
// Keep conservative: do not “rewrite”, only strip obvious mentions.
function stripAmazonMentions(s: string) {
  return String(s || "")
    .replace(/\bamazon\b/gi, "")
    .replace(/\bprime\b/gi, "")
    .replace(/\bfulfilled by amazon\b/gi, "")
    .replace(/\b(a ?\+ ?)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function splitParagraphs(s: string) {
  const raw = String(s || "")
    .split(/\n{2,}|\r\n{2,}/g)
    .map((x) => x.trim())
    .filter(Boolean);

  // If content is a single huge paragraph, do a gentle split on sentence clusters
  if (raw.length === 1 && raw[0].length > 800) {
    const one = raw[0];
    const parts = one
      .split(/(?<=[.!?])\s+(?=[A-Z])/g)
      .map((x) => x.trim())
      .filter(Boolean);

    // Re-cluster into ~2–3 sentence chunks for readability
    const out: string[] = [];
    let buf: string[] = [];
    for (const p of parts) {
      buf.push(p);
      if (buf.length >= 3) {
        out.push(buf.join(" "));
        buf = [];
      }
    }
    if (buf.length) out.push(buf.join(" "));
    return out;
  }

  return raw;
}

// Normalize Amazon image URLs by stripping common resize suffixes
function normalizeAmazonImageUrl(u: string) {
  // Remove ._SL1500_ etc patterns
  return String(u || "").replace(/\._[A-Z0-9_,]+_\./g, ".");
}

// Create a stable key for deduping/comparisons (strip query/hash + normalize)
function urlKey(u: string) {
  const s = String(u || "").trim();
  if (!s) return "";
  const noQuery = s.split("?")[0].split("#")[0];
  return normalizeAmazonImageUrl(noQuery);
}

type LongBlock =
  | { type: "p"; text: string }
  | { type: "img"; src: string };

function pickSafeDescriptionText(product: any): string {
  if (!product) return "";

  const v = String(product?.seo_rewrite_version || "");
  const seoOk = v ? semverGte(v, "v1.2.0") : false;

  const candidate = seoOk
    ? product?.description_seo ||
      product?.short_description ||
      product?.long_description ||
      ""
    : product?.short_description ||
      product?.long_description ||
      product?.description_seo ||
      "";

  return stripAmazonMentions(String(candidate || "")).trim();
}

function normalizeLongBlocks(product: any): LongBlock[] {
  if (!product) return [];

  // SAFETY: treat any text blocks in long_description_blocks as untrusted.
  // We only render image blocks from A+/description sources to avoid review/spec leakage.
  const blocksRaw = product?.long_description_blocks;

  const images: LongBlock[] = [];
  const seen = new Set<string>();

  const pushImg = (src: any) => {
    const s = String(src || "").trim();
    if (!s) return;
    const k = urlKey(s);
    if (k && seen.has(k)) return;
    if (k) seen.add(k);
    images.push({ type: "img", src: s });
  };

  // Prefer explicit blocks if present (but only type=img)
  if (Array.isArray(blocksRaw) && blocksRaw.length) {
    for (const b of blocksRaw) {
      if (!b || typeof b !== "object") continue;
      const t = String((b as any).type || "").toLowerCase().trim();
      if (t !== "img") continue;
      pushImg((b as any).src);
    }
  }

  // Fallback: include aplus_images + description_images (deduped)
  if (!images.length) {
    const fallbackImgs = [
      ...(Array.isArray(product?.description_images) ? product.description_images : []),
      ...(Array.isArray(product?.aplus_images) ? product.aplus_images : []),
    ].filter(Boolean);

    for (const u of fallbackImgs) pushImg(u);
  }

  return images;
}

function guessVideoMime(src: string) {
  const s = String(src || "").toLowerCase();
  if (s.includes(".m3u8")) return "application/x-mpegURL";
  if (s.includes(".mp4")) return "video/mp4";
  if (s.includes(".webm")) return "video/webm";
  return "video/mp4";
}

/**
 * Extract unique, playable video URLs from product.videos[]
 * - Rejects malformed THUMBNAIL/&quot; entries
 * - Attempts to extract real `videoSrc` from malformed strings
 * - Dedupes by UUID (common Amazon pattern) or by URL
 * - Prefers productVideoOptimized.mp4 if seen
 */
function sanitizeVideos(rawVideos: any[]): { src: string; type: string }[] {
  if (!Array.isArray(rawVideos) || rawVideos.length === 0) return [];

  const seen = new Set<string>();
  const out: { src: string; type: string }[] = [];

  const extractVideoId = (url: string) => {
    const m = url.match(/\/([a-f0-9-]{36})\.mp4/i);
    return m ? m[1].toLowerCase() : url.toLowerCase();
  };

  const tryExtractFromMalformed = (s: string) => {
    const m = s.match(/videoSrc&quot;:&quot;([^&]+?\.(?:mp4|webm|m3u8))/i);
    if (m) return m[1];
    return "";
  };

  for (const entry of rawVideos) {
    const sources = Array.isArray(entry?.sources) ? entry.sources : [];
    const candidates: string[] = [];

    if (entry?.src) candidates.push(String(entry.src));
    for (const s of sources) {
      if (s?.src) candidates.push(String(s.src));
    }

    const expanded: string[] = [];
    for (const c of candidates) {
      const cc = String(c || "").trim();
      if (!cc) continue;

      if (cc.includes("&quot;") || cc.includes("THUMBNAIL")) {
        const extracted = tryExtractFromMalformed(cc);
        if (extracted) expanded.push(extracted);
        continue;
      }

      expanded.push(cc);
    }

    for (const url of expanded) {
      const u = String(url || "").trim();
      if (!u) continue;
      if (!u.match(/\.(mp4|webm|m3u8)($|\?)/i)) continue;

      const id = extractVideoId(u);

      if (seen.has(id)) {
        const isOptimized = u.includes("productVideoOptimized");
        if (isOptimized) {
          const idx = out.findIndex((x) => extractVideoId(x.src) === id);
          if (idx >= 0) out[idx] = { src: u, type: guessVideoMime(u) };
        }
        continue;
      }

      seen.add(id);
      out.push({ src: u, type: guessVideoMime(u) });
    }
  }

  return out;
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
  }, [product?.description_images, product?.aplus_images]);

  // Build a strict disallow list for gallery images (never render in description)
  const galleryImageKeys = useMemo(() => {
    const imgs = Array.isArray(product?.images) ? product.images : [];
    const keys = new Set<string>();
    for (const u of imgs) {
      const k = urlKey(u);
      if (k) keys.add(k);
    }
    return keys;
  }, [product?.images]);

  const longBlocks = useMemo(() => normalizeLongBlocks(product), [product]);
  const videos = useMemo(() => sanitizeVideos(product?.videos), [product?.videos]);
  const descriptionText = useMemo(() => pickSafeDescriptionText(product), [product]);
  const descriptionParas = useMemo(
    () => splitParagraphs(descriptionText),
    [descriptionText]
  );

  const related = Array.isArray(product?.related) ? product.related : [];
  const alsoViewed = Array.isArray(product?.customer_also_viewed)
    ? product.customer_also_viewed
    : [];

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-14">
      <div className="max-w-[900px]">
        <AssistantInline product={product} />
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Product description</h2>
        <div className="space-y-3 text-gray-700 text-sm w-full max-w-none break-words">
          {descriptionParas.map((p, i) => (
            <p key={`d-${i}`}>{p}</p>
          ))}

          {longBlocks.map((b, i) => {
            if (b.type !== "img") return null;

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
                alt={String(product?.title || "Product image")}
                className="w-full max-w-[900px] rounded-md border bg-gray-50"
                loading="lazy"
                decoding="async"
              />
            );
          })}
        </div>
      </div>

      {/* Videos */}
      {videos.length ? (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[900px]">
            {videos.map((v, i) => (
              <video
                key={i}
                controls
                preload="metadata"
                className="w-full rounded-md border bg-black"
              >
                <source src={v.src} type={v.type} />
              </video>
            ))}
          </div>
        </div>
      ) : null}

      {/* Reviews */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Reviews</h2>

        {product?.reviews?.customers_say ? (
          <p className="text-sm text-gray-700 mb-4">
            {String(product.reviews.customers_say)}
          </p>
        ) : null}

        {Array.isArray(product?.reviews?.items) && product.reviews.items.length ? (
          <div className="space-y-4 max-w-[900px]">
            {product.reviews.items.slice(0, 8).map((r: any, i: number) => (
              <div
                key={i}
                className="rounded-md border bg-white p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-gray-900">
                    {String(r?.author || "Customer")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {String(r?.date || "")}
                  </div>
                </div>

                {r?.title ? (
                  <div className="text-sm font-semibold text-gray-900">
                    {String(r.title)}
                  </div>
                ) : null}

                {r?.body ? (
                  <div className="text-sm text-gray-700">
                    {String(r.body).replace(/\s*Read more\s*$/i, "").trim()}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No reviews available.</p>
        )}
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
