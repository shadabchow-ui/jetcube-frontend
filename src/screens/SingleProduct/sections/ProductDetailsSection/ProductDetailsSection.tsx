import React, { useMemo } from "react";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";
import { AssistantInline } from "../../../../components/RufusAssistant";

/** NOTE:
 * Safety rules preserved:
 * - Only allow-list description/A+ images (never leak gallery images into description)
 * - Keep URL sanitization / Amazon suffix stripping
 * - Keep video sanitization
 */

function stripAmazonSizeModifiers(url: string) {
  if (!url) return url;
  const out = url
    .replace(/\._AC_[A-Z0-9,]+_\./g, ".")
    .replace(/\._S[XY]\d+_\./g, ".")
    .replace(/\._S[XY]\d+_CR,0,0,\d+,\d+_\./g, ".")
    .replace(/\._UX\d+_\./g, ".")
    .replace(/\._UY\d+_\./g, ".")
    .replace(/\._UL\d+_\./g, ".")
    .replace(/\._SR\d+,\d+_\./g, ".")
    .replace(/\._SS\d+_\./g, ".");
  return out;
}

function safeUrl(u: any): string {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  // basic scheme allow-list
  if (/^https?:\/\//i.test(s)) return stripAmazonSizeModifiers(s);
  return "";
}

function urlKey(u: any): string {
  const s = safeUrl(u);
  if (!s) return "";
  // normalize for allow-list matching: strip query + hash, lowercase
  return s.split("#")[0].split("?")[0].toLowerCase();
}

function splitParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

type LongBlock = { type: "p"; text: string } | { type: "img"; src: string };

function normalizeLongBlocks(product: any): LongBlock[] {
  const blocks: LongBlock[] = [];
  const src =
    product?.description_long || product?.long_description || product?.description_blocks;

  // Some scrapes store blocks in an array, others as html-ish text. We only support:
  // - paragraphs of text
  // - images with safe URLs (further allow-listed later)
  if (Array.isArray(src)) {
    for (const b of src) {
      if (!b) continue;
      if (typeof b === "string") {
        const t = String(b).trim();
        if (t) blocks.push({ type: "p", text: t });
        continue;
      }
      if (typeof b === "object") {
        if ((b as any).type === "img" || (b as any).kind === "img") {
          const u = safeUrl((b as any).src || (b as any).url);
          if (u) blocks.push({ type: "img", src: u });
        } else if (
          (b as any).type === "p" ||
          (b as any).kind === "p" ||
          (b as any).text
        ) {
          const t = String((b as any).text || "").trim();
          if (t) blocks.push({ type: "p", text: t });
        }
      }
    }
    return blocks;
  }

  if (typeof src === "string") {
    const t = String(src).trim();
    if (!t) return blocks;

    // extract image URLs if present
    const imgUrls = Array.from(t.matchAll(/https?:\/\/[^\s"'<>]+/gi)).map((m) => safeUrl(m[0]));
    const paragraphs = splitParagraphs(
      t
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );

    for (const p of paragraphs) blocks.push({ type: "p", text: p });
    for (const u of imgUrls) if (u) blocks.push({ type: "img", src: u });

    return blocks;
  }

  return blocks;
}

function pickSafeDescriptionText(product: any): string {
  const candidates = [
    product?.description,
    product?.description_text,
    product?.long_description_text,
    product?.product_description,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const s = String(c).trim();
    if (s) return s;
  }
  return "";
}

function sanitizeVideos(rawVideos: any[]): { src: string; type: string }[] {
  if (!Array.isArray(rawVideos)) return [];
  const out: { src: string; type: string }[] = [];

  for (const v of rawVideos) {
    if (!v) continue;

    // supported input shapes:
    // - string URL
    // - { url/src, type/mime }
    const url = safeUrl(typeof v === "string" ? v : v.url || v.src);
    if (!url) continue;

    let type = "";
    const t = typeof v === "object" ? String(v.type || v.mime || "").toLowerCase() : "";
    if (t && (t.includes("video/") || t.includes("mp4") || t.includes("webm") || t.includes("ogg"))) {
      type = t.includes("video/")
        ? t
        : t.includes("webm")
        ? "video/webm"
        : t.includes("ogg")
        ? "video/ogg"
        : "video/mp4";
    } else {
      // infer by extension
      if (url.toLowerCase().endsWith(".webm")) type = "video/webm";
      else if (url.toLowerCase().endsWith(".ogv") || url.toLowerCase().endsWith(".ogg"))
        type = "video/ogg";
      else type = "video/mp4";
    }

    out.push({ src: url, type });
  }

  // de-dupe
  const seen = new Set<string>();
  return out.filter((x) => {
    const k = x.src.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

type SpecRow = { label: string; value: string };

function normalizeSpecRows(product: any): SpecRow[] {
  const out: SpecRow[] = [];
  const push = (label: any, value: any) => {
    const l = String(label || "").trim();
    const v = String(value ?? "").trim();
    if (!l || !v) return;
    out.push({ label: l, value: v });
  };

  const candidates = [
    product?.specs,
    product?.specifications,
    product?.product_details,
    product?.details,
    product?.tech_specs,
    product?.attributes,
  ];

  for (const c of candidates) {
    if (!c) continue;

    if (Array.isArray(c)) {
      for (const row of c) {
        if (!row || typeof row !== "object") continue;
        const l = (row as any).label ?? (row as any).name ?? (row as any).key;
        const v = (row as any).value ?? (row as any).val ?? (row as any).text;
        push(l, v);
      }
      if (out.length) break;
      continue;
    }

    if (typeof c === "object") {
      for (const [k, v] of Object.entries(c)) {
        if (v == null) continue;
        if (typeof v === "object") continue;
        push(k, v);
      }
      if (out.length) break;
    }
  }

  const seen = new Set<string>();
  return out.filter((r) => {
    const key = r.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeBullets(product: any): string[] {
  const candidates = [
    product?.about_this_item_bullets,
    product?.about_bullets,
    product?.bullets_seo,
    product?.bullets,
    product?.key_features,
    product?.features,
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      const out = c
        .map((x) => String(x || "").trim())
        .filter(Boolean);
      if (out.length) return out;
    }
    if (typeof c === "string") {
      const s = String(c || "").trim();
      if (!s) continue;
      const parts = s
        .split(/\n+|\r\n+|\s*•\s*|\s*\u2022\s*/g)
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts.length > 1) return parts;
    }
  }
  return [];
}

function normalizeRatingDistribution(product: any): { stars: number; count: number }[] {
  const dist =
    product?.reviews?.distribution ||
    product?.reviews?.rating_distribution ||
    product?.reviews?.histogram ||
    product?.rating_distribution ||
    null;

  if (!dist) return [];

  if (typeof dist === "object" && !Array.isArray(dist)) {
    const rows: { stars: number; count: number }[] = [];
    for (const [k, v] of Object.entries(dist)) {
      const stars = parseInt(String(k), 10);
      const count = Number(v);
      if (!Number.isFinite(stars) || !Number.isFinite(count)) continue;
      if (stars < 1 || stars > 5) continue;
      rows.push({ stars, count: Math.max(0, Math.floor(count)) });
    }
    rows.sort((a, b) => b.stars - a.stars);
    return rows;
  }

  if (Array.isArray(dist)) {
    const rows: { stars: number; count: number }[] = [];
    for (const r of dist) {
      if (!r || typeof r !== "object") continue;
      const stars = Number((r as any).stars ?? (r as any).rating ?? (r as any).key);
      const count = Number((r as any).count ?? (r as any).value ?? (r as any).n);
      if (!Number.isFinite(stars) || !Number.isFinite(count)) continue;
      if (stars < 1 || stars > 5) continue;
      rows.push({ stars: Math.floor(stars), count: Math.max(0, Math.floor(count)) });
    }
    rows.sort((a, b) => b.stars - a.stars);
    return rows;
  }

  return [];
}

function formatAvgRating(v: any): number | null {
  const n = typeof v === "number" ? v : parseFloat(String(v || ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(0, Math.min(5, n));
}

function normalizeReviewCount(v: any): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v || ""), 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function StarsInline({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  const stars = Array.from({ length: 5 }).map((_, i) => (i < full ? "★" : "☆"));
  return <span className="text-orange-600">{stars.join("")}</span>;
}

/* =========================
   Exported Amazon-style modules
   (Used by SingleProduct.tsx)
   ========================= */

export const AboutThisItemSection = (): JSX.Element | null => {
  const product: any = useProductPdp();
  const bullets = useMemo(() => normalizeBullets(product), [product]);
  if (!bullets.length) return null;

  return (
    <section id="about" className="scroll-mt-24 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-[900px]">
        <div className="mb-6">
          <AssistantInline product={product} />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">About this item</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export const ProductDetailsSectionInner = (): JSX.Element | null => {
  const product: any = useProductPdp();
  const rows = useMemo(() => normalizeSpecRows(product), [product]);
  if (!rows.length) return null;

  return (
    <section id="details" className="scroll-mt-24 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-[900px]">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Product details</h2>
        <div className="overflow-x-auto rounded-md border bg-white">
          <table className="min-w-[520px] w-full text-sm">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <th className="text-left align-top w-[220px] p-3 font-semibold text-gray-900 bg-gray-50">
                    {r.label}
                  </th>
                  <td className="p-3 text-gray-700">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export const FromTheBrandSection = (): JSX.Element | null => {
  const product: any = useProductPdp();

  // Strict allow-list for description/A+ images ONLY
  // (This prevents gallery/variant images from ever leaking into the description area.)
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

  const longBlocks = useMemo(() => normalizeLongBlocks(product), [product]);
  const descriptionText = useMemo(() => pickSafeDescriptionText(product), [product]);
  const descriptionParas = useMemo(() => splitParagraphs(descriptionText), [descriptionText]);

  const hasAny =
    descriptionParas.length > 0 ||
    longBlocks.some((b) => b.type === "img" && !!urlKey((b as any).src));

  if (!hasAny) return null;

  return (
    <section id="aplus" className="scroll-mt-24 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-[900px]">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">From the brand</h2>
        <div className="space-y-3 text-gray-700 text-sm w-full max-w-none break-words">
          {descriptionParas.map((p, i) => (
            <p key={`d-${i}`}>{p}</p>
          ))}

          {longBlocks.map((b, i) => {
            if (b.type !== "img") return null;

            const k = urlKey(b.src);

            // STRICT:
            // - render ONLY if the image is explicitly present in description_images/aplus_images
            // - this remains stable even if PDP gallery swaps images due to variant selection
            const allowed = !!k && allowedDescriptionImageKeys.has(k);
            if (!allowed) return null;

            return (
              <img
                key={`img-${i}`}
                src={b.src}
                alt={String(product?.title || "Product image")}
                className="w-full rounded-md border bg-gray-50"
                loading="lazy"
                decoding="async"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const VideosSection = (): JSX.Element | null => {
  const product: any = useProductPdp();
  const videos = useMemo(() => sanitizeVideos(product?.videos), [product?.videos]);
  if (!videos.length) return null;

  return (
    <section id="videos" className="scroll-mt-24 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-[900px]">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((v, i) => (
            <video key={i} controls preload="metadata" className="w-full rounded-md border bg-black">
              <source src={v.src} type={v.type} />
            </video>
          ))}
        </div>
      </div>
    </section>
  );
};

export const CustomerReviewsSection = (): JSX.Element => {
  const product: any = useProductPdp();

  const avg = useMemo(
    () =>
      formatAvgRating(
        product?.reviews?.average_rating ?? product?.reviews?.avg_rating ?? product?.reviews?.rating
      ),
    [product?.reviews?.average_rating, product?.reviews?.avg_rating, product?.reviews?.rating]
  );

  const count = useMemo(
    () =>
      normalizeReviewCount(
        product?.reviews?.review_count ?? product?.reviews?.count ?? product?.reviews?.total
      ),
    [product?.reviews?.review_count, product?.reviews?.count, product?.reviews?.total]
  );

  const dist = useMemo(() => normalizeRatingDistribution(product), [product]);
  const distTotal = useMemo(
    () => dist.reduce((a, b) => a + (Number.isFinite(b.count) ? b.count : 0), 0),
    [dist]
  );

  const items = Array.isArray(product?.reviews?.items) ? product.reviews.items : [];
  const customersSay = product?.reviews?.customers_say ? String(product.reviews.customers_say) : "";

  return (
    <section id="reviews" className="scroll-mt-24 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-[900px]">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Customer reviews</h2>

        {(avg != null || count != null) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              {avg != null ? (
                <>
                  <StarsInline value={avg} />
                  <span className="text-gray-900 font-medium">{avg.toFixed(1)} out of 5</span>
                </>
              ) : null}
              {count != null ? (
                <span className="text-gray-500">({count.toLocaleString()})</span>
              ) : null}
            </div>
          </div>
        )}

        {customersSay ? <p className="text-sm text-gray-700 mb-6">{customersSay}</p> : null}

        {/* Histogram (optional, hide gracefully if missing) */}
        {dist.length && distTotal > 0 ? (
          <div className="mb-8">
            <div className="space-y-2">
              {dist.map((r) => {
                const pct = Math.round((r.count / distTotal) * 100);
                return (
                  <div key={r.stars} className="flex items-center gap-3 text-sm">
                    <div className="w-[64px] text-gray-700">{r.stars} star</div>
                    <div className="flex-1 h-2 rounded bg-gray-200 overflow-hidden">
                      <div className="h-2 bg-orange-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-[56px] text-right text-gray-500">
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Review list (structured; do not rewrite) */}
        {items.length ? (
          <div className="space-y-4">
            {items.slice(0, 12).map((r: any, i: number) => {
              const rAvg = formatAvgRating(r?.rating ?? r?.stars);
              return (
                <div key={i} className="rounded-md border bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-gray-900">
                      {String(r?.author || "Customer")}
                    </div>
                    <div className="text-xs text-gray-500">{String(r?.date || "")}</div>
                  </div>

                  {(rAvg != null || r?.title) && (
                    <div className="text-sm flex items-center gap-2">
                      {rAvg != null ? <StarsInline value={rAvg} /> : null}
                      {r?.title ? (
                        <span className="font-semibold text-gray-900">{String(r.title)}</span>
                      ) : null}
                    </div>
                  )}

                  {r?.body ? (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {String(r.body)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No reviews available.</p>
        )}
      </div>
    </section>
  );
};

export const ProductDetailsSection = (): JSX.Element => {
  // Default composite renderer for legacy usage.
  // IMPORTANT: "Related products" and "Customers also viewed" are rendered once in SingleProduct.tsx.
  return (
    <section className="max-w-[1200px] mx-auto">
      <AboutThisItemSection />
      <ProductDetailsSectionInner />
      <FromTheBrandSection />
      <VideosSection />
      <CustomerReviewsSection />
    </section>
  );
};

export default ProductDetailsSection;
