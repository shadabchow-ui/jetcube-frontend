import { useEffect, useMemo, useState } from "react";
import { Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductPdp } from "../../../pdp/ProductPdpContext";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";

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
    .replace(/\._SS\d+_\./g, ".")
    .replace(/\._SL\d+_\./g, ".");
  return out;
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
  return <div className="text-[13px] text-[#565959]">{text}</div>;
}

function detectBoughtLine(product: any) {
  const n = Number((product as any)?.social_proof?.bought_past_month || 0);
  if (Number.isFinite(n) && n >= 50) return `${n}+ bought in the past month`;
  const spText = String((product as any)?.social_proof?.text || "").trim();
  // Only allow explicit, source-provided text (still deterministic)
  if (spText) return spText;
  return "";
}

function imageBaseKey(url: string) {
  const u = String(url || "");
  const noQ = u.split("?")[0];
  return stripAmazonSizeModifiers(noQ);
}

/**
 * Parse size chart HTML into structured data and render our own table.
 * No dangerouslySetInnerHTML.
 */
function parseSizeChartHtml(rawHtml: string) {
  if (!rawHtml || typeof rawHtml !== "string") return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
    const table = doc.querySelector("table");
    if (!table) return null;

    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length < 2) return null;

    const headers = Array.from(rows[0].querySelectorAll("th")).map((th) =>
      String(th.textContent || "").trim()
    );

    const dataRows = rows.slice(1).map((tr) => {
      const cells = Array.from(tr.querySelectorAll("th, td"));
      return cells.map((c) => String(c.textContent || "").trim());
    });

    if (!headers.length || !dataRows.length) return null;
    return { headers, rows: dataRows };
  } catch {
    return null;
  }
}

/**
 * Category-neutral size resolver:
 * If chart exists, it wins (use first column).
 * Else fall back to scraped sizes.
 */
function resolveCanonicalSizes(product: any, scrapedSizes: string[]) {
  const chart =
    (product as any)?.size_chart ||
    (product as any)?.variations?.size_chart ||
    null;

  const rawHtml =
    chart && typeof chart === "object" && typeof (chart as any).html === "string"
      ? String((chart as any).html || "").trim()
      : "";

  if (rawHtml) {
    const parsed = parseSizeChartHtml(rawHtml);
    if (parsed?.rows?.length) {
      const fromChart = parsed.rows
        .map((r: string[]) => String(r?.[0] || "").trim())
        .filter(Boolean);
      if (fromChart.length) return uniqKeepOrder(fromChart);
    }
  }

  return uniqKeepOrder((scrapedSizes || []).map((x) => String(x || "").trim()).filter(Boolean));
}

export const ProductHeroSection = (): JSX.Element => {
  const product = useProductPdp();
  const { addToCart, openCart } = useCart();
  const { addToWishlist } = useWishlist();

  const navigate = useNavigate();

  // Images
  const rawImages = useMemo(() => {
    const imgs = (product as any)?.images;
    if (Array.isArray(imgs)) return imgs.map(String).filter(Boolean);
    const single = (product as any)?.image;
    return single ? [String(single)] : [];
  }, [product]);

  const images = useMemo(() => selectBestImageVariant(rawImages), [rawImages]);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    setActiveImage(images[0] || "");
  }, [images.join("|")]);

  // Reviews
  const reviews = (product as any)?.reviews?.items || [];
  const avg = useMemo(() => averageRating(reviews), [reviews]);
  const reviewCount = Number((product as any)?.reviews?.review_count || (product as any)?.reviews?.count || reviews?.length || 0);

  // Variants
  const { colors, sizes: scrapedSizes } = useMemo(() => extractOptions(product), [product]);

  const colorImagesMap = (product as any)?.color_images;
  const colorImageKey = (product as any)?.color_image_key;
  const colorSwatches = (product as any)?.color_swatches;

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");

  useEffect(() => {
    setSelectedColor(colors[0] || "");
  }, [colors.join("|")]);

  // Canonical sizes (fix shoe-size pollution when chart exists)
  const sizes = useMemo(() => resolveCanonicalSizes(product, scrapedSizes), [product, scrapedSizes.join("|")]);

  useEffect(() => {
    setSelectedSize(sizes[0] || "");
  }, [sizes.join("|")]);

  useEffect(() => {
    if (!selectedColor) return;
    if (!colorImageKey || !images.length) return;

    const key = colorImageKey?.[selectedColor];
    if (!key) return;

    const match = images.find(
      (u) => imageBaseKey(u).includes(key) || imageBaseKey(u) === key
    );
    if (match) setActiveImage(match);
    // DO NOT change this behavior
  }, [selectedColor, colorImageKey, images]);

  const getColorThumb = (color: string) => {
    const fromMap = Array.isArray(colorImagesMap?.[color])
      ? colorImagesMap[color][0]
      : "";
    if (fromMap) return stripAmazonSizeModifiers(String(fromMap));

    const key = colorImageKey?.[color];
    if (key) {
      const match = images.find(
        (u) => imageBaseKey(u).includes(key) || imageBaseKey(u) === key
      );
      if (match) return match;
    }

    return images[0] || "";
  };

  const displayTitle = useMemo(() => pickSafeTitle(product), [product]);

  const displayPrice = useMemo(() => {
    const p = (product as any)?.price;
    if (typeof p === "string" && p.trim()) return p.trim();
    if (typeof p === "number" && Number.isFinite(p) && p > 0) return `$${p.toFixed(2)}`;
    return "Price unavailable";
  }, [product]);

  const boughtInPastMonth = useMemo(() => detectBoughtLine(product), [product]);

  const aboutThisItemRaw = useMemo(() => pickSafeDescription(product), [product]);
  const aboutParas = useMemo(() => splitParas(aboutThisItemRaw), [aboutThisItemRaw]);

  // Size chart (ONLY if present in JSON)
  const sizeChart =
    (product as any)?.size_chart || (product as any)?.variations?.size_chart;
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  useEffect(() => {
    setSizeChartOpen(false);
  }, [displayTitle]);

  const sizeChartHtml =
    sizeChart &&
    typeof sizeChart === "object" &&
    typeof (sizeChart as any).html === "string"
      ? String((sizeChart as any).html || "").trim()
      : "";
  const sizeChartImg = typeof sizeChart === "string" ? String(sizeChart).trim() : "";
  const hasSizeChart = Boolean(sizeChartImg || sizeChartHtml);

  const parsedSizeChart = useMemo(() => {
    if (!sizeChartHtml) return null;
    return parseSizeChartHtml(sizeChartHtml);
  }, [sizeChartHtml]);

  const [qty, setQty] = useState(1);

  const handleAddToCart = () => {
    const p = (product as any)?.price;
    const priceNum =
      typeof p === "number"
        ? p
        : typeof p === "string"
        ? Number(String(p).replace(/[^0-9.]/g, ""))
        : NaN;

    addToCart(
      {
        id: String((product as any)?.id || (product as any)?.handle),
        name: displayTitle,
        price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0,
        image: String((product as any)?.image || activeImage || images[0] || ""),
      },
      qty
    );

    openCart();

    window.dispatchEvent(
      new CustomEvent("cart:toast", {
        detail: { message: "Added to cart" },
      })
    );
  };

  // ✅ Buy Now -> Square checkout (ONLY CHANGE)
  const buyNow = async () => {
    try {
      const p = (product as any)?.price;
      const priceNum =
        typeof p === "number"
          ? p
          : typeof p === "string"
          ? Number(String(p).replace(/[^0-9.]/g, ""))
          : NaN;

      const priceCents =
        Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum * 100) : 0;

      const apiBase = (import.meta.env.VITE_SQUARE_API_BASE || "https://square-api.shadabchow.workers.dev").replace(/\/+$/, "");

      const res = await fetch(`${apiBase}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: [
            {
              title: displayTitle,
              price_cents: priceCents,
              quantity: qty,
            },
          ],
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

  return (
    <section className="max-w-[1500px] mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[72px_1fr]">
          {/* Thumbs */}
          <div className="flex flex-row lg:flex-col flex-none w-full lg:w-[72px] gap-3 lg:max-h-[640px] overflow-x-auto lg:overflow-y-auto overflow-y-hidden lg:overflow-x-hidden pr-0 lg:pr-1 order-2 lg:order-1">
            {images.map((u, i) => (
              <button
                key={`${u}-${i}`}
                type="button"
                onClick={() => setActiveImage(u)}
                className={`border rounded overflow-hidden flex items-center justify-center ${
                  activeImage === u ? "border-black" : "border-gray-200 hover:border-black"
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

          {/* Main (DO NOT TOUCH) */}
          <div className="border rounded bg-gray-50 flex items-center justify-center aspect-[3/4] max-h-[520px] sm:max-h-[640px] overflow-hidden order-1 lg:order-2">
            {activeImage ? (
              <img
                src={activeImage}
                alt={displayTitle}
                className="w-full h-full object-contain block"
                loading="eager"
                decoding="sync"
              />
            ) : (
              <div className="text-sm text-gray-500">No image</div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* Info column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-[#0F1111]">
                  {displayTitle}
                </h1>

                {boughtInPastMonth ? <BoughtBadge text={boughtInPastMonth} /> : null}

                {avg || reviewCount ? (
                  <div className="flex items-center gap-2 text-sm">
                    {avg ? <Stars value={avg} /> : null}
                    {avg ? <span className="text-[#0F1111]">{avg.toFixed(1)}</span> : null}
                    {reviewCount ? (
                      <span className="text-[#007185]">
                        ({Number(reviewCount).toLocaleString()})
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="text-2xl font-bold text-[#0F1111]">{displayPrice}</div>

                <div className="text-[13px] text-[#0F1111]">
                  <span className="font-semibold">Best Price</span>{" "}
                  <span className="font-semibold">Guarantee</span>
                </div>
              </div>

              <div className="space-y-5">
                {/* ✅ Color FIRST */}
                {colors.length ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Color</div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => {
                        const isActive = c === selectedColor;
                        const thumb = getColorThumb(c);
                        const sw = colorSwatches?.[c];

                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            className={`flex items-center gap-2 border rounded px-2 py-2 text-sm ${
                              isActive ? "border-black" : "border-gray-300 hover:border-black"
                            }`}
                            aria-pressed={isActive}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={c}
                                className="w-10 h-10 object-cover rounded border"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : sw ? (
                              <span
                                className="inline-block w-10 h-10 rounded border"
                                style={{ backgroundColor: sw }}
                              />
                            ) : null}

                            <span className="whitespace-nowrap">{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* ✅ Size */}
                {sizes.length ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Size</div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s) => {
                        const isActive = s === selectedSize;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSize(s)}
                            className={`border rounded px-3 py-2 text-sm ${
                              isActive ? "border-black" : "border-gray-300 hover:border-black"
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

                {/* ✅ Size chart link */}
                {hasSizeChart ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="text-sm text-[#007185] hover:underline"
                      onClick={() => setSizeChartOpen((v) => !v)}
                    >
                      Size chart
                    </button>

                    {sizeChartOpen ? (
                      <div className="border rounded p-3 bg-white overflow-x-auto">
                        {sizeChartImg ? (
                          <img src={sizeChartImg} alt="Size chart" className="max-w-full h-auto" />
                        ) : parsedSizeChart ? (
                          <table className="min-w-[520px] w-full text-sm">
                            <thead>
                              <tr>
                                {parsedSizeChart.headers.map((h: string, i: number) => (
                                  <th
                                    key={i}
                                    className="text-left border-b p-2 font-semibold text-[#0F1111]"
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
                                      <th key={ci} className="text-left border-b p-2 font-semibold">
                                        {cell}
                                      </th>
                                    ) : (
                                      <td key={ci} className="border-b p-2 text-[#0F1111]">
                                        {cell}
                                      </td>
                                    )
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-sm text-[#565959]">Size chart unavailable.</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* About this item */}
                {aboutParas.length ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">About this item</div>
                    <div className="space-y-2 text-sm text-[#0F1111] leading-relaxed">
                      {aboutParas.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Buy box (DO NOT MOVE / DO NOT CHANGE LAYOUT) */}
            <div className="border rounded-lg p-5 bg-white space-y-4">
              <div className="text-2xl font-bold text-[#0F1111]">{displayPrice}</div>

              <div className="text-[13px] text-[#0F1111]">
                <span className="font-semibold">FREE delivery</span>{" "}
                <span className="text-[#565959]">4–8 Days</span>
              </div>

              <div className="text-[#007600] font-semibold">Available now</div>

              {/* Qty selector */}
              <div className="flex items-center gap-2 text-sm text-[#0F1111]">
                <span className="text-[#565959]">Units:</span>
                <select
                  className="border rounded px-2 py-1 bg-white"
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
                className="w-full bg-[#0061c9] hover:bg-[#0061c9] text-[#FFFFFF] font-semibold py-2 rounded-full border border-[#0061c9]"
                onClick={handleAddToCart}
              >
                Add to Basket
              </button>

              <button
                type="button"
                className="w-full bg-[#0571e3] hover:bg-[#0571e3] text-[#FFFFFF] font-semibold py-2 rounded-full border border-[#0061c9]"
                onClick={buyNow}
              >
                Pay now
              </button>

              <div className="text-sm text-[#0F1111] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#565959]">Ships from</span>
                  <span className="text-[#0F1111]">Our Warehouse</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#565959]">Direct from</span>
                  <span className="text-[#0F1111]">
                    {String((product as any)?.sold_by || "Ventari")}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-[#565959]">Returns</span>
                <div className="text-right text-[#2162a1] leading-snug">
                  <div>Refund or replace — on us</div>
                  <div>30-day return window</div>
                </div>
              </div>

              <div className="text-[13px] text-[#0F1111]">
                <span className="text-[#565959]">Gift options</span>{" "}
                <span>Available at checkout</span>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border rounded py-2 text-sm"
                onClick={() => {
                  const p = (product as any)?.price;
                  const priceNum =
                    typeof p === "number"
                      ? p
                      : typeof p === "string"
                      ? Number(String(p).replace(/[^0-9.]/g, ""))
                      : NaN;

                  addToWishlist({
                    id: String((product as any)?.id || (product as any)?.handle),
                    name: displayTitle,
                    price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0,
                    image: String((product as any)?.image || activeImage || images[0] || ""),
                  });

                  window.dispatchEvent(
                    new CustomEvent("wishlist:toast", {
                      detail: { message: "Added to wishlist" },
                    })
                  );
                }}
              >
                <Heart className="w-4 h-4" />
                Add to Wishlist
              </button>

              <button
                type="button"
                className="w-full border rounded py-2 text-sm"
                onClick={() => navigate("/shop")}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
