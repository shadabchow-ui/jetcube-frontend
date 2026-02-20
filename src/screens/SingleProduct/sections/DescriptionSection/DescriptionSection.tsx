import React, { useMemo } from "react";
import { useProductPdp } from "../../../../pdp/ProductPdpContext";

function semverGte(version: string, target: string) {
  const parse = (v: string) =>
    String(v || "")
      .replace(/^v/i, "")
      .split(".")
      .map((x) => Number(x || 0));
  const a = parse(version);
  const b = parse(target);
  for (let i = 0; i < 3; i++) {
    const ai = a[i] || 0;
    const bi = b[i] || 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return true;
}
const SEO_CLEAN_VERSION = "v1.2.0";

function stripPrefix(s: string) {
  return String(s || "")
    .replace(/^product description\s*[:\-–—]?\s*/i, "")
    .trim();
}

function splitTextIntoParagraphs(text: string): string[] {
  const t = String(text || "").trim();
  if (!t) return [];

  const byBlank = t
    .split(/\n\s*\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;

  const sentences = t
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((x) => x.trim())
    .filter(Boolean);

  const out: string[] = [];
  let buf: string[] = [];
  for (const s of sentences) {
    buf.push(s);
    const words = buf.join(" ").split(/\s+/).filter(Boolean).length;
    if (words >= 45) {
      out.push(buf.join(" "));
      buf = [];
    }
  }
  if (buf.length) out.push(buf.join(" "));
  return out.length ? out : [t];
}

function stripAmazonSizeModifiers(url: string) {
  if (!url) return url;
  return url
    .replace(/\._AC_[A-Z0-9,]+_\./g, ".")
    .replace(/\._S[XY]\d+_\./g, ".")
    .replace(/\._SL\d+_\./g, ".");
}

function safeUrl(u: any): string {
  const s = String(u || "").trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) return "";
  return stripAmazonSizeModifiers(s);
}

function urlKey(u: any): string {
  const s = safeUrl(u);
  if (!s) return "";
  return s.split("#")[0].split("?")[0].toLowerCase();
}

function pickDescription(product: any) {
  const v = String(product?.seo_rewrite_version || "v0.0.0");
  const dSeo = stripPrefix(String(product?.description_seo || ""));
  const shortD = stripPrefix(String(product?.short_description || ""));
  const longD = stripPrefix(String(product?.long_description || ""));
  if (dSeo && semverGte(v, SEO_CLEAN_VERSION)) return dSeo;
  return shortD || longD || "";
}

/**
 * Deterministic: only render real A+ / description images.
 * Strict separation:
 * - DO NOT use gallery images
 * - Only allow-list images explicitly present in product.aplus_images or product.description_images
 * - Long description blocks may include img URLs, but we only keep them if they match the allow-list
 */
function pickTwoDetailImages(product: any): string[] {
  const aplus: string[] = Array.isArray(product?.aplus_images)
    ? product.aplus_images.map(safeUrl).filter(Boolean)
    : [];
  const descImgs: string[] = Array.isArray(product?.description_images)
    ? product.description_images.map(safeUrl).filter(Boolean)
    : [];

  const allowKeys = new Set<string>();
  for (const u of [...aplus, ...descImgs]) {
    const k = urlKey(u);
    if (k) allowKeys.add(k);
  }

  // Optionally include long_description_blocks images, but only if allow-listed
  const blocks = Array.isArray(product?.long_description_blocks)
    ? product.long_description_blocks
    : [];
  const imgsFromBlocks = blocks
    .filter((b: any) => b?.type === "img" && b?.src)
    .map((b: any) => safeUrl(b.src))
    .filter(Boolean)
    .filter((u: string) => {
      const k = urlKey(u);
      return !!k && allowKeys.has(k);
    });

  const merged = [...aplus, ...descImgs, ...imgsFromBlocks]
    .map((u) => stripAmazonSizeModifiers(u))
    .filter(Boolean);

  // Stable de-dupe in order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of merged) {
    const k = urlKey(u);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(u);
    if (out.length >= 2) break;
  }

  return out;
}

const DescriptionSection: React.FC = () => {
  const product: any = useProductPdp();

  const description = useMemo(() => pickDescription(product), [product]);
  const paragraphs = useMemo(() => splitTextIntoParagraphs(description), [description]);

  const detailImgs = useMemo(() => pickTwoDetailImages(product), [product]);
  const img1 = detailImgs[0] || "";
  const img2 = detailImgs[1] || "";

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1500px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold">Description</h2>

            <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
              {paragraphs.length ? (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p>No description available.</p>
              )}
            </div>
          </div>

          {/* Keep layout structure, but remove all placeholder imagery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {img1 ? (
              <img
                src={img1}
                alt="Product detail"
                className="w-full h-[260px] object-cover rounded-lg border"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="sm:col-span-2 text-sm text-gray-500 border rounded-lg p-4">
                No additional images.
              </div>
            )}

            {img2 ? (
              <img
                src={img2}
                alt="Product detail"
                className="w-full h-[260px] object-cover rounded-lg border"
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DescriptionSection;
