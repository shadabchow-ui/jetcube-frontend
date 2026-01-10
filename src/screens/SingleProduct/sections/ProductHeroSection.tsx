import { useEffect, useMemo, useState } from "react";
import { Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductPdp } from "../../../pdp/ProductPdpContext";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";

function stripAmazonSizeModifiers(url: string) {
  if (!url) return url;
  // remove common amazon sizing tokens like ._SX679_ ._SY450_ ._AC_SX679_
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
  // if amazon gives multiple variants, try stripping modifiers for HD
  const cleaned = urls.map((u) => stripAmazonSizeModifiers(u)).filter(Boolean);
  // keep order and return
  return uniqKeepOrder(cleaned);
}

function splitParas(text: string) {
  const t = String(text || "").trim();
  if (!t) return [];
  // split on blank lines first, then fall back to sentence-ish chunks
  const byBlank = t
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;

  // fallback: split long text into smaller paragraphs
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

  // v10/v11 schemas might store variations differently, handle robustly
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

  // newer explicit fields
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

function BoughtBadge({ text }: { text: string }) {
  return <div className="text-[13px] text-[#565959]">{text}</div>;
}

function detectBoughtLine(product: any) {
  // Prefer JSON field if present (supports multiple schema shapes)
  const spText = String((product as any)?.social_proof?.text || "").trim();
  if (spText) return spText;

  const fromJson = String((product as any)?.bought_past_month || "").trim();
  if (fromJson) return fromJson;

  // fallback: randomized 50–2000 weighted lower end
  const r = Math.random();
  let n = 0;
  if (r < 0.65) n = 50 + Math.floor(Math.random() * 351); // 50–400 common
  else if (r < 0.9) n = 401 + Math.floor(Math.random() * 600); // 401–1000
  else n = 1001 + Math.floor(Math.random() * 1000); // 1001–2000
  return `${n}+ bought in the past month`;
}

function imageBaseKey(url: string) {
  const u = String(url || "");
  // strip query + amazon modifiers to compare variants
  const noQ = u.split("?")[0];
  return stripAmazonSizeModifiers(noQ);
}

function normalizeSkuForDisplay(product: any) {
  // prefer explicit sku
  const sku = String((product as any)?.sku || "").trim();
  if (sku) return sku;
  // fallback to ASIN (but UI will label as SKU)
  const asin = String((product as any)?.asin || "").trim();
  if (asin) return asin;
  return "";
}

export const ProductHeroSection = (): JSX.Element => {
  const product = useProductPdp();
  const { addToCart, openCart } = useCart();
  const { toggle, has } = useWishlist();

  const wishlistId = useMemo(() => {
    return String((product as any)?.id || (product as any)?.handle || "").trim();
  }, [product]);

  const inWishlist = wishlistId ? has(wishlistId) : false;

  const rawImages = useMemo(() => {
    // ✅ Use strict gallery_images[] when present (never description/review images).
    // Fallback to legacy images[] for older JSONs.
    const imgs = Array.isArray((product as any)?.gallery_images)
      ? ((product as any).gallery_images as string[])
      : Array.isArray((product as any)?.images)
        ? ((product as any).images as string[])
        : [];
    const cleaned = imgs.map((u) => String(u || "").trim()).filter(Boolean);
    return selectBestImageVariant(uniqKeepOrder(cleaned));
  }, [product]);

  const images = rawImages;

  const [activeImage, setActiveImage] = useState<string>(images[0] ?? "");
  useEffect(() => {
    setActiveImage(images[0] ?? "");
  }, [images.join("|")]);

  const reviewsItems = Array.isArray((product as any)?.reviews?.items)
    ? ((product as any).reviews.items as any[])
    : [];
  const avg = averageRating(reviewsItems);

  const reviewCount = useMemo(() => {
    const cand =
      (product as any)?.reviews?.count ??
      (product as any)?.reviews?.total ??
      (product as any)?.review_count ??
      (product as any)?.reviews_count ??
      reviewsItems.length;

    const n = Number(cand);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }, [product, reviewsItems.length]);

  const { sizes, colors } = useMemo(() => extractOptions(product), [product]);

  const colorSwatches = useMemo(() => {
    const m = (product as any)?.color_swatches;
    return m && typeof m === "object" ? (m as Record<string, string>) : {};
  }, [product]);

  const colorImageKey = useMemo(() => {
    const m = (product as any)?.color_image_key;
    return m && typeof m === "object" ? (m as Record<string, string>) : {};
  }, [product]);

  const colorImagesMap = useMemo(() => {
    const m = (product as any)?.color_images;
    return m && typeof m === "object" ? (m as Record<string, string[]>) : {};
  }, [product]);

  const [selectedColor, setSelectedColor] = useState<string>(colors[0] ?? "");
  useEffect(() => {
    if (colors.length && !selectedColor) setSelectedColor(colors[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors.join("|")]);

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] ?? "");
  useEffect(() => {
    if (sizes.length && !selectedSize) setSelectedSize(sizes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes.join("|")]);

  // keep existing behavior: color selection updates activeImage using color_image_key mapping
  useEffect(() => {
    if (!selectedColor) return;
    const key = colorImageKey?.[selectedColor];
    if (!key) return;

    const match = images.find(
      (u) => imageBaseKey(u).includes(key) || imageBaseKey(u) === key
    );
    if (match) setActiveImage(match);
    // DO NOT change this behavior
  }, [selectedColor, colorImageKey, images]);

  const getColorThumb = (color: string) => {
    // 1) best: explicit HD color images extracted from HTML
    const fromMap = Array.isArray(colorImagesMap?.[color])
      ? colorImagesMap[color][0]
      : "";
    if (fromMap) return stripAmazonSizeModifiers(String(fromMap));

    // 2) next: derive from color_image_key -> match a gallery image
    const key = colorImageKey?.[color];
    if (key) {
      const match = images.find(
        (u) => imageBaseKey(u).includes(key) || imageBaseKey(u) === key
      );
      if (match) return match;
    }

    // 3) fallback: first gallery image (keeps UI from breaking)
    return images[0] || "";
  };

  const navigate = useNavigate();

  const displayPrice = useMemo(() => {
    const p = (product as any)?.price;
    if (typeof p === "string" && p.trim()) return p.trim();
    if (typeof p === "number" && Number.isFinite(p)) return `$${p.toFixed(2)}`;
    return "$49.99"; // fallback UI-only
  }, [product]);

  const displayedSku = useMemo(() => normalizeSkuForDisplay(product), [product]);

  const boughtInPastMonth = useMemo(() => detectBoughtLine(product), [product]);

  // About this item: prefer about_this_item; fallback to short_description
  const aboutThisItem = String(
    (product as any)?.about_this_item || (product as any)?.short_description || ""
  ).trim();
  const aboutParas = useMemo(() => splitParas(aboutThisItem), [aboutThisItem]);

  // Size chart (ONLY if present in JSON)
  const sizeChart =
    (product as any)?.size_chart || (product as any)?.variations?.size_chart;
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  useEffect(() => {
    setSizeChartOpen(false);
  }, [String(displayedSku)]);

  const sizeChartHtml =
    sizeChart &&
      typeof sizeChart === "object" &&
      typeof (sizeChart as any).html === "string"
      ? String((sizeChart as any).html || "").trim()
      : "";
  const sizeChartImg = typeof sizeChart === "string" ? String(sizeChart).trim() : "";
  const hasSizeChart = Boolean(sizeChartImg || sizeChartHtml);

  // Amazon-y Qty selector
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
        name: String((product as any)?.title || "Product"),
        price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 49.99,
        image: String((product as any)?.image || activeImage || images[0] || ""),
      },
      qty
    );

    openCart(); // ✅ open sidebar

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
        Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum * 100) : 4999;

      const apiBase = (import.meta.env.VITE_SQUARE_API_BASE || "https://square-api.shadabchow.workers.dev").replace(/\/+$/, "");

      const res = await fetch(`${apiBase}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: [
            {
              title: String((product as any)?.title || "Product"),
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
          {/* Thumbs (vertical + vertically scrollable only) */}
          <div className="flex flex-row lg:flex-col flex-none w-full lg:w-[72px] gap-3 lg:max-h-[640px] overflow-x-auto lg:overflow-y-auto overflow-y-hidden lg:overflow-x-hidden pr-0 lg:pr-1 order-2 lg:order-1">
            {images.map((u, i) => (
              <button
                key={`${u}-${i}`}
                type="button"
                onClick={() => setActiveImage(u)}
                className={`border rounded overflow-hidden flex items-center justify-center ${activeImage === u ? "border-black" : "border-gray-200 hover:border-black"
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
                alt={String((product as any)?.title || "Product")}
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
                {/* Amazon title color */}
                <h1 className="text-2xl font-semibold text-[#0F1111]">
                  {String((product as any)?.title || "Product")}
                </h1>

                {boughtInPastMonth ? <BoughtBadge text={boughtInPastMonth} /> : null}

                {/* Stars + rating + review count (Amazon-style row) */}
                {avg || reviewCount ? (
                  <div className="flex items-center gap-2 text-sm">
                    {avg ? <Stars value={avg} /> : null}

                    {avg ? <span className="text-[#0F1111]">{avg.toFixed(1)}</span> : null}

                    {reviewCount ? (
                      <span className="text-[#007185]">
                        ({reviewCount.toLocaleString()})
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
                            className={`flex items-center gap-2 border rounded px-2 py-2 text-sm ${isActive ? "border-black" : "border-gray-300 hover:border-black"
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
                            className={`border rounded px-3 py-2 text-sm ${isActive ? "border-black" : "border-gray-300 hover:border-black"
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

                {/* ✅ Size chart link (render even if sizes are empty) */}
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
                        ) : (
                          <div
                            className="text-sm text-[#0F1111]"
                            dangerouslySetInnerHTML={{ __html: sizeChartHtml }}
                          />
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

              {/* Qty selector (Amazon-y) */}
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

              {/* Amazon-style buttons (black text) */}
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

              {/* RETURNS: stacked lines (layout fix) */}
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

                  const id = String((product as any)?.id || (product as any)?.handle || "").trim();
                  if (!id) return;

                  toggle({
                    id,
                    name: String((product as any)?.title || "Product"),
                    price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 49.99,
                    image: String((product as any)?.image || activeImage || images[0] || ""),
                  });

                  window.dispatchEvent(
                    new CustomEvent("wishlist:toast", {
                      detail: { message: inWishlist ? "Removed from wishlist" : "Saved to wishlist" },
                    })
                  );
                }}
              >
                <Heart className="w-4 h-4" />
                {inWishlist ? "Saved" : "Add to List"}
              </button>

              <button
                type="button"
                className="w-full border rounded py-2 text-sm"
                onClick={() => navigate("/")}
              >
                Back to shop
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductHeroSection;





