import { useEffect, useMemo, useState } from "react";
import { Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductPdp } from "../../../pdp/ProductPdpContext";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";

const EMBER = "[font-family:'Amazon_Ember',Arial,sans-serif]";

function stripAmazonSizeModifiers(url: string) {
  if (!url) return url;
  return url
    .replace(/\._AC_[A-Z0-9,]+_\./g, ".")
    .replace(/\._S[XY]\d+_\./g, ".")
    .replace(/\._S[XY]\d+_CR,0,0,\d+,\d+_\./g, ".")
    .replace(/\._UX\d+_\./g, ".")
    .replace(/\._UY\d+_\./g, ".")
    .replace(/\._UL\d+_\./g, ".")
    .replace(/\._SR\d+,\d+_\./g, ".")
    .replace(/\._SS\d+,\d+_\./g, ".")
    .replace(/\._SL\d+_\./g, ".");
}

function uniqKeepOrder(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (!v) continue;
    const key = v.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function selectBestImageVariant(urls: string[]) {
  const cleaned = urls.map((u) => stripAmazonSizeModifiers(u)).filter(Boolean);
  return uniqKeepOrder(cleaned);
}

function splitParas(text: string) {
  const t = String(text || "").trim();
  if (!t) return [];
  const byBlank = t
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;

  const parts = t
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: string[] = [];
  let buf: string[] = [];
  for (const p of parts) {
    buf.push(p);
    const wordCount = buf.join(" ").split(/\s+/).filter(Boolean).length;
    if (wordCount >= 40) {
      out.push(buf.join(" "));
      buf = [];
    }
  }
  if (buf.length) out.push(buf.join(" "));
  return out.length ? out : [t];
}

function averageRating(items: any[]) {
  if (!items?.length) return 0;
  const vals = items
    .map((r) => Number(r?.rating || r?.stars || 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!vals.length) return 0;
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum / vals.length;
}

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const items = [
    ...Array(full).fill("full"),
    ...Array(half).fill("half"),
    ...Array(empty).fill("empty"),
  ];

  return (
    <div className="flex items-center gap-0.5 text-[#FFA41C]">
      {items.map((t, i) => (
        <Star
          key={i}
          className="w-4 h-4"
          fill={t === "empty" ? "none" : "currentColor"}
          stroke="currentColor"
        />
      ))}
    </div>
  );
}

function optionToText(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "object") {
    const cand =
      (v as any).label ??
      (v as any).value ??
      (v as any).name ??
      (v as any).text ??
      (v as any).title ??
      "";
    return String(cand || "").trim();
  }
  return String(v).trim();
}

// Tokens that indicate a "size/pack/volume" value rather than a true color name.
// Used to reclassify mis-labeled color lists (e.g. "16 Ounce (Pack of 1)").
const SIZE_LIKE_TOKENS = [
  "oz", "ounce", "fl oz", "fl_oz", "pack", "count", "ml",
  "liter", "litre", "gallon", "quart", "pint", "qt", "pt",
  "piece", "unit", "set", "roll",
];

function looksLikeSizeList(items: string[]): boolean {
  const nonEmpty = items.filter(Boolean);
  if (!nonEmpty.length) return false;
  const matches = nonEmpty.filter((s) => {
    const lower = s.toLowerCase();
    return SIZE_LIKE_TOKENS.some((t) => lower.includes(t));
  });
  return matches.length / nonEmpty.length > 0.5;
}

// ── Clothing size guard ───────────────────────────────────────────────────────
// Scrapers sometimes populate variations.sizes with default clothing sizes for
// every product regardless of category. We detect and suppress those here in
// the UI as a last line of defence (context layer does the same, but data may
// arrive via legacy paths that bypass that cleanup).
const CLOTHING_SIZE_TOKENS = new Set([
  "xs", "s", "m", "l", "xl", "xxl", "xxxl", "2xl", "3xl", "4xl",
  "small", "medium", "large", "x-large", "xx-large", "one size",
  "one size fits all", "os",
]);

function isClothingSizeToken(s: string): boolean {
  return CLOTHING_SIZE_TOKENS.has(s.trim().toLowerCase());
}

/** Returns true when every entry in the list is a standard clothing size label. */
function isMostlyClothingSizes(list: string[]): boolean {
  const nonEmpty = list.filter(Boolean);
  if (!nonEmpty.length) return false;
  return nonEmpty.every((s) => isClothingSizeToken(s));
}

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

function pickSafeTitle(product: any) {
  const v = String((product as any)?.seo_rewrite_version || "v0.0.0");
  const titleSeo = String((product as any)?.title_seo || "").trim();
  const title = String((product as any)?.title || "").trim();
  if (titleSeo && semverGte(v, SEO_CLEAN_VERSION)) return titleSeo;
  return titleSeo || title || "Product";
}

function pickSafeDescription(product: any) {
  const v = String((product as any)?.seo_rewrite_version || "v0.0.0");
  const dSeo = String((product as any)?.description_seo || "").trim();
  const about = String((product as any)?.about_this_item || "").trim();
  const shortD = String((product as any)?.short_description || "").trim();
  if (dSeo && semverGte(v, SEO_CLEAN_VERSION)) return dSeo;
  return about || shortD || "";
}

function BoughtBadge({ text }: { text: string }) {
  return <div className={`${EMBER} text-[12px] leading-[16px] text-[#CC0C39]`}>{text}</div>;
}

function detectBoughtLine(product: any) {
  const n = Number((product as any)?.social_proof?.bought_past_month || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1000) return `${Math.floor(n / 100) / 10}K+ bought in the past month`;
  if (n >= 100) return `${n}+ bought in the past month`;
  if (n >= 50) return `${n}+ bought in the past month`;
  return "";
}

function isLikelyUrl(s: string) {
  const t = String(s || "").trim();
  if (!t) return false;
  return /^https?:\/\//i.test(t);
}

function isLikelyColor(s: string) {
  const t = String(s || "").trim();
  if (!t) return false;
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t);
}

/**
 * Extract a label string from a variant value entry that may be either:
 *   - a plain string:  "16 Ounce (Pack of 1)"
 *   - an object:       { value: "16 Ounce (Pack of 1)", swatchImage: "..." }
 * Both shapes are valid in the enrichment data.
 */
function variantEntryToLabel(item: any): string {
  if (item == null) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item === "number") return String(item);
  if (typeof item === "object") {
    const v =
      (item as any).value ??
      (item as any).label ??
      (item as any).name ??
      (item as any).text ??
      "";
    return String(v || "").trim();
  }
  return "";
}

/**
 * buildV35Colors — accepts both string[] and { value, swatchImage }[] formats.
 * Returns deduplicated string labels.
 */
function buildV35Colors(product: any): string[] {
  const vals = (product as any)?.pdp_enrichment_v1?.variants?.values?.color_name;
  if (!Array.isArray(vals)) return [];
  const out = vals.map(variantEntryToLabel).filter(Boolean);
  return uniqKeepOrder(out);
}

/**
 * buildV35Sizes — accepts both string[] and { value }[] formats.
 * Returns deduplicated string labels.
 */
function buildV35Sizes(product: any): string[] {
  const vals = (product as any)?.pdp_enrichment_v1?.variants?.values?.size_name;
  if (!Array.isArray(vals)) return [];
  const out = vals.map(variantEntryToLabel).filter(Boolean);
  return uniqKeepOrder(out);
}

/**
 * buildV35ColorSwatchMap — only maps swatch images when items are objects.
 * If the array contains plain strings there are no swatches to extract.
 */
function buildV35ColorSwatchMap(product: any): Record<string, string> {
  const out: Record<string, string> = {};
  const vals = (product as any)?.pdp_enrichment_v1?.variants?.values?.color_name;
  if (!Array.isArray(vals)) return out;
  for (const it of vals) {
    // Only process object entries — plain strings have no swatch data
    if (!it || typeof it !== "object") continue;
    const name = String((it as any).value ?? "").trim();
    const sw = String((it as any).swatchImage ?? "").trim();
    if (name && sw) out[name] = sw;
  }
  return out;
}

function extractOptions(product: any) {
  const variations = (product as any)?.variations;
  const colors: string[] = [];
  const sizes: string[] = [];

  if (variations && typeof variations === "object") {
    if (Array.isArray(variations.colors)) {
      for (const c of variations.colors) {
        const t = optionToText(c);
        if (t) colors.push(t);
      }
    }
    if (Array.isArray(variations.sizes)) {
      for (const s of variations.sizes) {
        const t = optionToText(s);
        if (t) sizes.push(t);
      }
    }
    if (Array.isArray(variations.size_options)) {
      for (const s of variations.size_options) {
        const t = optionToText(s);
        if (t) sizes.push(t);
      }
    }
    if (Array.isArray(variations.color_options)) {
      for (const c of variations.color_options) {
        const t = optionToText(c);
        if (t) colors.push(t);
      }
    }
  }

  const colorOptions = (product as any)?.color_options;
  if (Array.isArray(colorOptions))
    colorOptions.forEach((c: any) => {
      const t = optionToText(c);
      if (t) colors.push(t);
    });

  const sizeOptions = (product as any)?.size_options;
  if (Array.isArray(sizeOptions))
    sizeOptions.forEach((s: any) => {
      const t = optionToText(s);
      if (t) sizes.push(t);
    });

  return {
    colors: uniqKeepOrder(colors.map((x) => x.trim()).filter(Boolean)),
    sizes: uniqKeepOrder(sizes.map((x) => x.trim()).filter(Boolean)),
  };
}

function parsePriceParts(displayPrice: string) {
  const s = String(displayPrice || "").trim();
  if (!s) return null;
  const num = Number(s.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  const fixed = num.toFixed(2);
  const [dollars, cents] = fixed.split(".");
  return { dollars, cents };
}

function PriceAmazon({ displayPrice }: { displayPrice: string }) {
  const parts = parsePriceParts(displayPrice);
  if (!parts) {
    return (
      <div className={`${EMBER} text-[28px] leading-[32px] text-[#0F1111]`}>
        {displayPrice}
      </div>
    );
  }

  return (
    <span
      className={`${EMBER} inline-flex items-start a-price a-text-price a-size-medium text-[#0F1111]`}
      aria-label={displayPrice}
    >
      <span className="text-[13px] relative top-[-0.5em] a-price-symbol">$</span>
      <span className="text-[28px] leading-[32px] font-medium a-price-whole">
        {parts.dollars}
        <span className="a-price-decimal">.</span>
      </span>
      <span className="text-[13px] relative top-[-0.5em] a-price-fraction">{parts.cents}</span>
    </span>
  );
}

export const ProductHeroSection = (): JSX.Element => {
  const product = useProductPdp();
  const { addToCart, openCart } = useCart();
  const { addToWishlist } = useWishlist();
  const navigate = useNavigate();

  const rawImages = useMemo(() => {
    const enrichGallery = (product as any)?.pdp_enrichment_v1?.media?.gallery;
    if (Array.isArray(enrichGallery) && enrichGallery.length) {
      return enrichGallery.map(String).filter(Boolean);
    }
    const imgs = (product as any)?.images;
    if (Array.isArray(imgs)) return imgs.map(String).filter(Boolean);
    const single = (product as any)?.image;
    return single ? [String(single)] : [];
  }, [product]);

  const baseImages = useMemo(() => selectBestImageVariant(rawImages), [rawImages]);

  // v35 enrichment values — now handle both string[] and {value}[] formats
  const v35Colors = useMemo(() => buildV35Colors(product), [product]);
  const v35Sizes = useMemo(() => buildV35Sizes(product), [product]);

  const { colors: legacyColors, sizes: legacySizes } = useMemo(
    () => extractOptions(product),
    [product]
  );

  // ── Final color/size resolution ──────────────────────────────────────────
  // Precedence: v35 enrichment > legacy scraped values.
  // Extra guard: if legacy sizes are all clothing tokens AND v35 has real values,
  // drop the legacy sizes so the real pack/volume options win.
  const colors = useMemo(() => {
    // Prefer enrichment; fall back to legacy
    const base = v35Colors.length ? v35Colors : legacyColors;
    let resolved = uniqKeepOrder(base.map((x) => String(x || "").trim()).filter(Boolean));

    // Reclassify pack/volume mis-labeled as colors → move to sizes bucket
    // (handled below in sizes; just clear here so color selector is suppressed)
    if (resolved.length > 0 && looksLikeSizeList(resolved)) {
      resolved = [];
    }

    return resolved;
  }, [v35Colors.join("|"), legacyColors.join("|")]);

  const sizes = useMemo(() => {
    let base: string[];

    if (v35Sizes.length) {
      // Enrichment has real size data — always prefer it
      base = v35Sizes;
    } else {
      // No enrichment sizes. Check legacy, but suppress default clothing sizes
      // when the product clearly has non-apparel enrichment variation data.
      // If legacy sizes are ALL clothing tokens and v35Colors has real values
      // (pack/volume), those colors were reclassified; use them as sizes.
      const reclassifiedFromColors =
        v35Colors.length > 0 && looksLikeSizeList(v35Colors) ? v35Colors : [];

      if (reclassifiedFromColors.length) {
        base = reclassifiedFromColors;
      } else if (isMostlyClothingSizes(legacySizes) && v35Colors.length > 0) {
        // v35 color data exists and legacy sizes look like clothing defaults → drop legacy
        base = [];
      } else {
        base = legacySizes;
      }
    }

    return uniqKeepOrder(base.map((x) => String(x || "").trim()).filter(Boolean));
  }, [v35Sizes.join("|"), v35Colors.join("|"), legacySizes.join("|")]);

  const colorImagesMap =
    (product as any)?.pdp_enrichment_v1?.media?.byVariant || (product as any)?.color_images;

  const colorImageKey = (product as any)?.color_image_key;

  const v35Swatches = useMemo(() => buildV35ColorSwatchMap(product), [product]);
  const legacySwatches = (product as any)?.color_swatches;

  // Swatches only meaningful when we have true colors
  const swatchesActive = colors.length > 0;

  const colorSwatches = useMemo(() => {
    if (!swatchesActive) return {};
    const out: Record<string, string> = {};
    if (v35Swatches && typeof v35Swatches === "object") {
      for (const [k, v] of Object.entries(v35Swatches)) {
        const kk = String(k || "").trim();
        const vv = String(v || "").trim();
        if (kk && vv) out[kk] = vv;
      }
    }
    if (legacySwatches && typeof legacySwatches === "object") {
      for (const [k, v] of Object.entries(legacySwatches)) {
        const kk = String(k || "").trim();
        const vv = String(v || "").trim();
        if (kk && vv && !out[kk]) out[kk] = vv;
      }
    }
    return out;
  }, [JSON.stringify(v35Swatches || {}), JSON.stringify(legacySwatches || {}), swatchesActive]);

  const swatchKeys = useMemo(() => {
    const keys = Object.keys(colorSwatches || {}).map((x) => String(x || "").trim());
    return uniqKeepOrder(keys.filter(Boolean));
  }, [JSON.stringify(colorSwatches || {})]);

  // Rendering guards: never show a selector for an empty list
  const hasColors = colors.length > 0 || swatchKeys.length > 0;
  const hasSizes = sizes.length > 0;

  const hasMultipleColors = useMemo(() => {
    if (colors.length > 1) return true;
    if (swatchKeys.length > 1) return true;
    return false;
  }, [colors.length, swatchKeys.length]);

  const hasSizeChart = useMemo(() => {
    return Boolean(
      (product as any)?.pdp_enrichment_v1?.variants?.size_chart ||
        (product as any)?.size_chart ||
        (product as any)?.variations?.size_chart
    );
  }, [product]);

  const sizeChart = useMemo(() => {
    return (
      (product as any)?.pdp_enrichment_v1?.variants?.size_chart ||
      (product as any)?.size_chart ||
      (product as any)?.variations?.size_chart ||
      null
    );
  }, [product]);

  const sizeChartHtml = useMemo(() => {
    const html = String((sizeChart as any)?.html || "").trim();
    return html || "";
  }, [sizeChart]);

  const sizeChartImg = useMemo(() => {
    const img = String((sizeChart as any)?.img || (sizeChart as any)?.image || "").trim();
    return img || "";
  }, [sizeChart]);

  const parsedSizeChart = useMemo(() => {
    if (!sizeChartHtml) return null;
    const tableMatch = sizeChartHtml.match(/<table[\s\S]*?<\/table>/i);
    const table = tableMatch ? tableMatch[0] : "";
    if (!table) return null;

    const headerMatches = Array.from(table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)).map(
      (m) => m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    );

    const rowMatches = Array.from(table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map(
      (m) => m[1]
    );

    const rows: string[][] = [];
    for (const r of rowMatches) {
      const cellMatches = Array.from(r.matchAll(/<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/gi)).map(
        (m) => m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      );
      if (cellMatches.length) rows.push(cellMatches);
    }

    const headers = headerMatches.length ? headerMatches : (rows[0] || []);
    const bodyRows = rows.length > 1 ? rows.slice(1) : [];
    if (!headers.length) return null;
    return { headers, rows: bodyRows };
  }, [sizeChartHtml]);

  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [colorUserSelected, setColorUserSelected] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [qty, setQty] = useState(1);

  const displayTitle = useMemo(() => pickSafeTitle(product), [product]);
  const description = useMemo(() => pickSafeDescription(product), [product]);
  const aboutParas = useMemo(() => splitParas(description), [description]);

  const boughtInPastMonth = useMemo(() => detectBoughtLine(product), [product]);

  const reviewItems = useMemo(() => (product as any)?.reviews?.items || [], [product]);
  const avg = useMemo(() => {
    const v = Number((product as any)?.reviews?.average_rating || 0);
    if (Number.isFinite(v) && v > 0) return v;
    return averageRating(reviewItems);
  }, [product, reviewItems]);

  const reviewCount = useMemo(() => {
    const n = Number(
      (product as any)?.reviews?.review_count || (product as any)?.reviews?.count || 0
    );
    if (Number.isFinite(n) && n > 0) return n;
    return Array.isArray(reviewItems) ? reviewItems.length : 0;
  }, [product, reviewItems]);

  const displayedImages = useMemo(() => {
    return (baseImages || []).slice(0, 12);
  }, [baseImages.join("|")]);

  useEffect(() => {
    if (!activeImage && displayedImages.length) setActiveImage(displayedImages[0]);
  }, [displayedImages.join("|")]);

  useEffect(() => {
    if (!selectedColor && (colors[0] || swatchKeys[0]))
      setSelectedColor(colors[0] || swatchKeys[0]);
  }, [colors.join("|"), swatchKeys.join("|")]);

  const displayedColor = useMemo(() => String(selectedColor || "").trim(), [selectedColor]);

  const displayedSize = useMemo(() => {
    if (selectedSize) return selectedSize;
    if (sizes.length) return sizes[0];
    return "";
  }, [selectedSize, sizes.join("|")]);

  const displayedColorImages = useMemo(() => {
    if (!displayedColor || !colorImagesMap) return [];
    const v = (colorImagesMap as any)?.[displayedColor];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    return [];
  }, [displayedColor, JSON.stringify(colorImagesMap || {})]);

  const displayedColorImageKey = useMemo(() => {
    if (!displayedColor || !colorImageKey) return "";
    const v = (colorImageKey as any)?.[displayedColor];
    return v ? String(v) : "";
  }, [displayedColor, JSON.stringify(colorImageKey || {})]);

  const displayedImagesWithVariant = useMemo(() => {
    const variantImgs = selectBestImageVariant(displayedColorImages || []);
    if (variantImgs.length) return variantImgs;
    return baseImages || [];
  }, [displayedColorImages.join("|"), baseImages.join("|")]);

  const displayPrice = useMemo(() => {
    const p = (product as any)?.price;
    if (typeof p === "number" && Number.isFinite(p) && p > 0) return `$${p.toFixed(2)}`;
    const s = String(p || "").trim();
    if (s && s !== "0" && s !== "0.00") return s.startsWith("$") ? s : `$${s}`;
    const p2 = (product as any)?.price_amount || (product as any)?.price_value;
    const s2 = String(p2 || "").trim();
    if (s2) return s2.startsWith("$") ? s2 : `$${s2}`;
    return "$0.00";
  }, [product]);

  const handleAddToCart = () => {
    const item = {
      id: String(
        (product as any)?.id || (product as any)?.slug || (product as any)?.handle || ""
      ).trim(),
      title: displayTitle,
      image: activeImage,
      price: displayPrice,
      quantity: qty,
      color: displayedColor,
      size: displayedSize,
    };
    addToCart(item);
    openCart();
  };

  const buyNow = async () => {
    try {
      const p = (product as any)?.price;
      const priceNum =
        typeof p === "number" ? p : Number(String(p || "").replace(/[^0-9.]/g, "")) || 0;

      const priceCents =
        Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum * 100) : 0;

      const apiBase = String((product as any)?.api_base || "")
        .trim()
        .replace(/\/+$/, "");

      const res = await fetch(`${apiBase}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            id: String(
              (product as any)?.id || (product as any)?.slug || (product as any)?.handle || ""
            ),
            title: displayTitle,
            image: activeImage,
            price_cents: priceCents,
            currency: "usd",
            quantity: qty,
            color: displayedColor,
            size: displayedSize,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Checkout API error:", res.status, data);
        alert(data?.error || "Checkout failed");
        return;
      }

      const redirectUrl = data?.checkoutUrl || data?.checkout_url || data?.url;
      if (redirectUrl) {
        window.location.href = String(redirectUrl);
        return;
      }

      console.error("No checkoutUrl returned:", data);
      alert("Checkout failed");
    } catch (e) {
      console.error(e);
      alert("Checkout error");
    }
  };

  const getColorThumb = (colorName: string) => {
    const key = String(colorName || "").trim();
    if (!key) return "";
    const byKey = displayedColorImageKey;
    if (colorImageKey && typeof colorImageKey === "object") {
      const k = (colorImageKey as any)?.[key];
      if (k) return `https://m.media-amazon.com/images/I/${k}._AC_SR38,50_.jpg`;
    }
    if (byKey) return `https://m.media-amazon.com/images/I/${byKey}._AC_SR38,50_.jpg`;
    return "";
  };

  const brand = String(
    (product as any)?.brand ||
      (product as any)?.brand_name ||
      (product as any)?.manufacturer ||
      (product as any)?.sold_by ||
      ""
  ).trim();

  return (
    <section className={`max-w-[1500px] mx-auto px-3 sm:px-4 py-6 sm:py-10 ${EMBER}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[72px_1fr]">
          {/* Thumbs */}
          <div className="flex flex-row lg:flex-col flex-none w-full lg:w-[72px] gap-3 lg:max-h-[640px] overflow-x-auto lg:overflow-y-auto overflow-y-hidden lg:overflow-x-hidden pr-0 lg:pr-1 order-2 lg:order-1">
            {displayedImagesWithVariant.map((u, i) => (
              <button
                key={`${u}-${i}`}
                type="button"
                onClick={() => setActiveImage(u)}
                onMouseEnter={() => setActiveImage(u)}
                className={`border rounded overflow-hidden flex items-center justify-center bg-white ${
                  activeImage === u
                    ? "border-[#007185]"
                    : "border-[#D5D9D9] hover:border-[#007185]"
                }`}
                style={{ width: 72, height: 72 }}
                aria-label="Select image"
              >
                <img
                  src={u}
                  alt=""
                  className="w-full h-full object-cover block"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>

          {/* Main */}
          <div className="border border-[#D5D9D9] rounded bg-white flex items-center justify-center aspect-square max-h-[520px] sm:max-h-[640px] overflow-hidden order-1 lg:order-2">
            {activeImage ? (
              <img
                src={activeImage}
                alt={displayTitle}
                className="w-full h-full object-contain block"
                loading="eager"
                decoding="sync"
              />
            ) : (
              <div className={`${EMBER} text-[12px] leading-[16px] text-[#565959]`}>
                No image
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* Info column */}
            <div className="space-y-6">
              <div className="space-y-2">
                {brand ? (
                  <div className={`${EMBER} text-[12px] leading-[16px] text-[#565959]`}>
                    Brand:{" "}
                    <button
                      type="button"
                      className="text-[#007185] hover:underline"
                      onClick={() => {}}
                    >
                      {brand}
                    </button>
                  </div>
                ) : null}

                <h1
                  className={`${EMBER} text-[24px] font-[400] leading-[32px] text-[#0F1111] break-words`}
                >
                  {displayTitle}
                </h1>

                {boughtInPastMonth ? <BoughtBadge text={boughtInPastMonth} /> : null}

                {avg || reviewCount ? (
                  <button
                    type="button"
                    className={`flex items-center gap-2 text-[14px] leading-[20px] ${EMBER}`}
                    onClick={() => {
                      document
                        .getElementById("reviews")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    aria-label="Jump to reviews"
                  >
                    {avg ? <Stars value={avg} /> : null}
                    {avg ? (
                      <span className="text-[#007185]">{avg.toFixed(1)}</span>
                    ) : null}
                    {reviewCount ? (
                      <span className="text-[#007185]">
                        ({Number(reviewCount).toLocaleString()})
                      </span>
                    ) : null}
                  </button>
                ) : null}

                <PriceAmazon displayPrice={displayPrice} />
              </div>

              <div className="space-y-5">
                {/* Color — only rendered when hasColors is true */}
                {hasColors ? (
                  hasMultipleColors ? (
                    <div className="space-y-2">
                      <div
                        className={`${EMBER} text-[14px] leading-[20px] font-semibold text-[#0F1111]`}
                      >
                        Color
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(colors.length ? colors : swatchKeys).map((c) => {
                          const isActive = c === selectedColor;
                          const thumb = getColorThumb(c);
                          const sw = (
                            colorSwatches && typeof colorSwatches === "object"
                              ? (colorSwatches as any)?.[c]
                              : ""
                          ) as any;
                          const swStr = typeof sw === "string" ? sw.trim() : "";

                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setColorUserSelected(true);
                                setSelectedColor(c);
                              }}
                              className={`flex items-center gap-2 bg-white ${EMBER} text-[14px] leading-[20px] px-[10px] h-[38px] rounded-[2px] ${
                                isActive
                                  ? "border border-[#e77600] bg-[#fdf8f5] shadow-[0_0_0_1px_#e77600_inset]"
                                  : "border border-[#D5D9D9] hover:border-[#8D9096] hover:bg-[#F3F3F3]"
                              }`}
                              aria-pressed={isActive}
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={c}
                                  className="w-10 h-10 object-cover rounded border border-[#D5D9D9]"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : isLikelyUrl(swStr) ? (
                                <img
                                  src={stripAmazonSizeModifiers(swStr)}
                                  alt={c}
                                  className="w-10 h-10 object-cover rounded border border-[#D5D9D9]"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : isLikelyColor(swStr) ? (
                                <span
                                  className="inline-block w-10 h-10 rounded border border-[#D5D9D9]"
                                  style={{ backgroundColor: swStr }}
                                />
                              ) : (
                                <span
                                  className={`inline-flex w-10 h-10 rounded border border-[#D5D9D9] items-center justify-center text-[10px] text-[#565959] bg-white ${EMBER}`}
                                >
                                  {String(c || "")
                                    .trim()
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>
                              )}
                              <span className="whitespace-nowrap text-[#0F1111]">{c}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        className={`${EMBER} text-[14px] leading-[20px] font-semibold text-[#0F1111]`}
                      >
                        Color
                      </div>
                      <div className={`${EMBER} text-[14px] leading-[20px] text-[#0F1111]`}>
                        {colors[0] || swatchKeys[0]}
                      </div>
                    </div>
                  )
                ) : null}

                {/* Size — only rendered when hasSizes is true */}
                {hasSizes ? (
                  <div className="space-y-2">
                    <div
                      className={`${EMBER} text-[14px] leading-[20px] font-semibold text-[#0F1111]`}
                    >
                      Size
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s) => {
                        const isActive = s === selectedSize;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSize(s)}
                            className={`bg-white ${EMBER} text-[14px] leading-[38px] px-[10px] h-[38px] rounded-[2px] ${
                              isActive
                                ? "border border-[#e77600] bg-[#fdf8f5] shadow-[0_0_0_1px_#e77600_inset]"
                                : "border border-[#D5D9D9] hover:border-[#8D9096] hover:bg-[#F3F3F3]"
                            }`}
                            aria-pressed={isActive}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Size chart */}
                {hasSizeChart ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      className={`${EMBER} text-[14px] leading-[20px] text-[#007185] hover:underline`}
                      onClick={() => setSizeChartOpen((v) => !v)}
                    >
                      Size chart
                    </button>

                    {sizeChartOpen ? (
                      <div className="border border-[#D5D9D9] rounded p-3 bg-white overflow-x-auto">
                        {sizeChartImg ? (
                          <img
                            src={sizeChartImg}
                            alt="Size chart"
                            className="max-w-full h-auto"
                          />
                        ) : parsedSizeChart ? (
                          <table
                            className={`${EMBER} min-w-[520px] w-full text-[14px] leading-[20px]`}
                          >
                            <thead>
                              <tr>
                                {parsedSizeChart.headers.map((h: string, i: number) => (
                                  <th
                                    key={i}
                                    className="text-left border-b border-[#D5D9D9] p-2 font-semibold text-[#0F1111]"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {parsedSizeChart.rows.map((row: string[], ri: number) => (
                                <tr key={ri}>
                                  {row.map((cell: string, ci: number) =>
                                    ci === 0 ? (
                                      <th
                                        key={ci}
                                        className="text-left border-b border-[#D5D9D9] p-2 font-semibold text-[#0F1111]"
                                      >
                                        {cell}
                                      </th>
                                    ) : (
                                      <td
                                        key={ci}
                                        className="border-b border-[#D5D9D9] p-2 text-[#0F1111]"
                                      >
                                        {cell}
                                      </td>
                                    )
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div
                            className={`${EMBER} text-[12px] leading-[16px] text-[#565959]`}
                          >
                            Size chart unavailable.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* About this item */}
                {aboutParas.length ? (
                  <div className="space-y-2">
                    <div
                      className={`${EMBER} text-[18px] font-bold leading-[24px] text-[#0F1111]`}
                    >
                      About this item
                    </div>
                    <div
                      className={`space-y-2 ${EMBER} text-[14px] leading-[20px] text-[#0F1111]`}
                    >
                      {aboutParas.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Buy box */}
            <div className="border border-[#D5D9D9] rounded-lg py-[14px] px-[18px] bg-white space-y-4 lg:sticky lg:top-3 lg:self-start">
              <PriceAmazon displayPrice={displayPrice} />

              <div className={`${EMBER} text-[12px] leading-[16px] text-[#0F1111]`}>
                <span className="font-semibold">FREE delivery</span>{" "}
                <span className="text-[#565959]">4–8 Days</span>
              </div>

              <div
                className={`${EMBER} text-[#007600] font-semibold text-[16px] leading-[20px]`}
              >
                In Stock
              </div>

              {/* Qty */}
              <div
                className={`${EMBER} flex items-center gap-2 text-[14px] leading-[20px] text-[#0F1111]`}
              >
                <span className="text-[#565959]">Qty:</span>
                <select
                  className={`${EMBER} bg-[#F0F2F2] border border-[#D5D9D9] rounded-lg shadow-[0_2px_5px_0_rgba(15,17,17,.15)] px-3 h-[29px] text-[14px] leading-[20px]`}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                  aria-label="Quantity"
                >
                  {Array.from({ length: 10 }).map((_, i) => {
                    const n = i + 1;
                    return (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="button"
                className={`${EMBER} w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-normal py-2 rounded-full border border-[#FCD200] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] text-[14px] leading-[20px]`}
                onClick={handleAddToCart}
              >
                Add to cart
              </button>

              <button
                type="button"
                className={`${EMBER} w-full bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] font-normal py-2 rounded-full border border-[#FF8F00] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] text-[14px] leading-[20px]`}
                onClick={buyNow}
              >
                Buy now
              </button>

              <div className={`${EMBER} text-[12px] leading-[16px] text-[#0F1111] space-y-2`}>
                <div className="flex justify-between">
                  <span className="text-[#565959]">Ships from</span>
                  <span className="text-[#0F1111]">Our Warehouse</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#565959]">Sold by</span>
                  <span className="text-[#0F1111]">
                    {String((product as any)?.sold_by || "Ventari")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#565959]">Returns</span>
                  <div className="text-right text-[#007185] leading-snug">
                    <div>FREE Returns</div>
                    <div>30-day return window</div>
                  </div>
                </div>

                <div>
                  <span className="text-[#565959]">Gift options</span>{" "}
                  <span>Available at checkout</span>
                </div>
              </div>

              <button
                type="button"
                className={`${EMBER} w-full flex items-center justify-center gap-2 border border-[#D5D9D9] hover:border-[#007185] rounded py-2 text-[14px] leading-[20px] bg-white`}
                onClick={() => {
                  addToWishlist({
                    id: String(
                      (product as any)?.id ||
                        (product as any)?.slug ||
                        (product as any)?.handle ||
                        ""
                    ),
                    title: displayTitle,
                    image: activeImage,
                    price: displayPrice,
                  });
                  navigate("/wishlist");
                }}
              >
                <Heart className="w-4 h-4" />
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductHeroSection;
