import React, { createContext, useContext } from "react";
import { R2_BASE, joinUrl, fetchJsonStrict } from "../config/r2";

// CHANGED SECTIONS:
// A) variations.colors/sizes are only set when the computed list is non-empty
// B) Default apparel size fallback removed entirely — only real data from enrichment is used
// C) Dimension classification tightened: pack/oz/count/volume → sizes, not colors
// D) A+ images deduplicated against gallery Set after both are computed
// E) NEW: Bad legacy clothing sizes (S/M/L/XL etc.) are stripped from non-apparel products
//         before enrichment projection runs, so enrichment values always win.
// F) NEW: schema_inputs.twister is explicitly preserved through normalization so
//         ProductHeroSection can read it for pack/count ASIN-switching selectors.
// G) NEW: variations.size_chart is nulled for non-fashion products so the UI never
//         renders a clothing size chart on beauty/electronics/appliance pages.

type IndexItem = {
  slug: string;
  path: string;
  title?: string;
  price?: number;
  image?: string | null;
  category?: string;
};

type PdpShard = Record<string, string>;

type IndexManifest = {
  version?: string;
  base: string;
  shards: Record<string, string>;
};

type Ctx = {
  loadIndexOnce: () => Promise<IndexItem[] | IndexManifest>;
  loadPdpShard: (shardKey: string) => Promise<PdpShard | null>;
  fetchJson: (url: string) => Promise<any>;
};

const ProductPdpContext = createContext<Ctx | null>(null);

const ProductDataContext = createContext<any | null>(null);

// ── Dimension classification ────────────────────────────────────────────────
const COLOR_DIM_TERMS = ["color", "colour", "shade", "finish", "pattern"];
const SIZE_DIM_TERMS = [
  "size", "size_name", "pack", "count", "qty", "ounce", "oz",
  "fl", "gallon", "ml", "liter", "litre", "volume",
];

function isColorDimension(name: string): boolean {
  const lower = name.toLowerCase();
  return COLOR_DIM_TERMS.some((t) => lower.includes(t));
}

function isSizeDimension(name: string): boolean {
  const lower = name.toLowerCase();
  return SIZE_DIM_TERMS.some((t) => lower.includes(t));
}

// ── Conservative apparel/fashion detector ───────────────────────────────────
// Used for two guards:
//   1. Whether to strip phantom clothing sizes from variations.sizes  (existing, E)
//   2. Whether to preserve or null out variations.size_chart          (new, G)
//
// NON_FASHION wins over FASHION when both match (e.g. "beauty hair styling tools").
const APPAREL_KEYWORDS = [
  "apparel", "clothing", "shoes", "footwear", "sneaker", "boot", "sandal",
  "dress", "shirt", "pants", "jeans", "jacket", "hoodie", "sweater",
  "socks", "underwear", "bra", "legging", "tshirt", "t-shirt",
];

// Categories that must never receive a clothing size chart even if other signals
// are ambiguous. Listed here so the check is explicit and easy to extend.
const NON_FASHION_CATEGORY_HINTS = [
  "beauty", "personal care", "hair dryer", "hair care", "skin care",
  "cosmetics", "fragrance", "health & household", "grocery", "automotive",
  "tools", "electronics", "camera", "computer", "kitchen", "pet supplies",
  "office", "sports", "outdoor", "toys", "baby", "industrial",
];

function isApparelProduct(raw: any): boolean {
  const signals = [
    raw?.title,
    raw?.title_original,
    raw?.category,
    raw?.category_path,
    raw?.category_leaf,
    raw?.handle,
    raw?.product_type,
    raw?.department,
    raw?.family,
    raw?.pdp_enrichment_v1?.category,
    raw?.pdp_enrichment_v1?.family,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Non-fashion hint wins: if the category/title clearly names a non-fashion
  // domain, treat as non-apparel regardless of any clothing keyword coincidences.
  if (NON_FASHION_CATEGORY_HINTS.some((h) => signals.includes(h))) return false;

  return APPAREL_KEYWORDS.some((kw) => signals.includes(kw));
}

// ── Clothing size sentinel set ───────────────────────────────────────────────
// These are the default clothing sizes that scrapers sometimes inject for any
// product. For non-apparel products we must purge them so enrichment data wins.
const CLOTHING_SIZE_TOKENS = new Set([
  "xs", "s", "m", "l", "xl", "xxl", "xxxl", "2xl", "3xl", "4xl",
  "small", "medium", "large", "x-large", "xx-large",
  "one size", "one size fits all", "os",
]);

/**
 * Returns true if EVERY non-empty entry in the array is a standard clothing
 * size label. A single non-clothing value (e.g. "16 oz") makes it return false
 * so we never accidentally wipe real variant data.
 */
function isDefaultClothingSizeList(sizes: any[]): boolean {
  const strings = sizes
    .map((v) => String(v?.value ?? v?.label ?? v ?? "").trim().toLowerCase())
    .filter(Boolean);
  if (!strings.length) return false;
  return strings.every((s) => CLOTHING_SIZE_TOKENS.has(s));
}

// ── Dedup helper ─────────────────────────────────────────────────────────────
function dedupUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((u) => (seen.has(u) ? false : (seen.add(u), true)));
}

function normalizePdpForUi(raw: any) {
  if (!raw || typeof raw !== "object") return raw;

  const gold = (raw as any).pdp_enrichment_v1;
  const out: any = { ...(raw as any) };

  // Titles (existing UI reads .title_seo and .title)
  const titleOriginal = String((raw as any).title_original || "").trim();
  const titleSeo = String((raw as any).title_seo || "").trim();
  const title = String((raw as any).title || "").trim();

  if (!out.title) out.title = title || titleSeo || titleOriginal;
  if (!out.title_seo) out.title_seo = titleSeo || titleOriginal || out.title;

  // ── Images: prefer gold media gallery (HD), fall back to legacy ────────────
  const gallery = gold?.media?.gallery;
  let gallerySet = new Set<string>();

  if (Array.isArray(gallery) && gallery.length) {
    const deduped = dedupUrls(gallery.map(String).filter(Boolean));
    out.images = deduped;
    if (!out.image) out.image = out.images[0] || null;
    gallerySet = new Set(out.images);
  } else if (Array.isArray(out.images) && out.images.length) {
    // Build gallerySet from legacy images if gold gallery absent
    gallerySet = new Set(out.images.map(String).filter(Boolean));
  }

  // ── Specs ─────────────────────────────────────────────────────────────────
  const normalizedSpecs = gold?.specs?.normalized;
  if (
    normalizedSpecs &&
    typeof normalizedSpecs === "object" &&
    !Array.isArray(normalizedSpecs)
  ) {
    out.specs_normalized = { ...normalizedSpecs };
    const legacySpecs =
      out.specs && typeof out.specs === "object" && !Array.isArray(out.specs)
        ? out.specs
        : {};
    out.specs = { ...legacySpecs, ...normalizedSpecs };
  }

  // ── Size chart ────────────────────────────────────────────────────────────
  if (gold?.sizeChart) {
    if (gold.sizeChart.tables && !out.size_chart_tables)
      out.size_chart_tables = gold.sizeChart.tables;
    if (gold.sizeChart.htmlSafe && !out.size_chart_html)
      out.size_chart_html = gold.sizeChart.htmlSafe;
  }

  // ── A+ ────────────────────────────────────────────────────────────────────
  if (gold?.aplus) {
    if (!out.aplus) out.aplus = gold.aplus;
    if (!out.aplus_blocks) out.aplus_blocks = gold.aplus.blocks;

    if (!out.aplus_images) {
      const rawAplusImages: string[] = Array.isArray(gold.aplus.images)
        ? dedupUrls(gold.aplus.images.map(String).filter(Boolean))
        : [];
      // D) Remove any URLs that are already in the gallery
      out.aplus_images =
        gallerySet.size > 0
          ? rawAplusImages.filter((u) => !gallerySet.has(u))
          : rawAplusImages;
    }
  }

  // ── F) Preserve schema_inputs.twister ────────────────────────────────────
  // schema_inputs (including .twister) is already copied into `out` via the
  // initial spread above. We make the preservation explicit here so future
  // refactors don't accidentally drop it, and to mirror twister into the
  // pdp_enrichment_v1.variants namespace where the UI also looks.
  //
  // Shape: { dimensions: string[], values: Record<string, string[]>,
  //          asin_by_value: Record<string, Record<string, string>> }
  const twister = (raw as any)?.schema_inputs?.twister;
  if (twister && typeof twister === "object" && Array.isArray(twister.dimensions)) {
    // Ensure top-level schema_inputs.twister is intact on the output object.
    if (!out.schema_inputs) out.schema_inputs = {};
    out.schema_inputs = { ...out.schema_inputs, twister };

    // Mirror into pdp_enrichment_v1.variants.twister so ProductHeroSection can
    // read it from either path without conditional branching.
    if (!out.pdp_enrichment_v1) out.pdp_enrichment_v1 = {};
    if (!out.pdp_enrichment_v1.variants) out.pdp_enrichment_v1.variants = {};
    // Only set if not already populated by a richer enrichment source
    if (!out.pdp_enrichment_v1.variants.twister) {
      out.pdp_enrichment_v1.variants.twister = twister;
    }
  }

  // ── Variants / Twister: project into legacy-friendly `variations` ─────────
  const variants = gold?.variants;

  // Start with whatever was already on the raw object
  const variations: any =
    out.variations && typeof out.variations === "object"
      ? { ...out.variations }
      : {};

  // E) Strip bad legacy clothing sizes from non-apparel products BEFORE
  //    enrichment projection. This prevents scraped S/M/L/XL from winning
  //    precedence over real pack/volume/count values from the enrichment layer.
  const isFashion = isApparelProduct(raw);

  if (!isFashion) {
    if (
      Array.isArray(variations.sizes) &&
      isDefaultClothingSizeList(variations.sizes)
    ) {
      // Wipe the phantom clothing sizes; enrichment will fill in real values below
      variations.sizes = [];
    }

    // G) Clear size_chart for non-fashion products.
    // Older JSONs in R2 may have a size_chart object inside variations even for
    // beauty/appliance products (scraper false-positive). Null it out here so
    // the UI never renders a clothing measurement table for a hair dryer.
    if (variations.size_chart != null) {
      variations.size_chart = null;
    }
  }

  if (variants && typeof variants === "object") {
    const dims: string[] = Array.isArray(variants.dimensions)
      ? variants.dimensions.map(String)
      : [];
    const values: any =
      variants.values && typeof variants.values === "object" ? variants.values : {};
    const matrix: any[] = Array.isArray(variants.matrix) ? variants.matrix : [];

    // C) Classify dimensions strictly
    const colorDim =
      dims.find((d) => isColorDimension(d) && !isSizeDimension(d)) ?? null;

    // Size dim: prefer explicit size terms; fallback to any non-color dim
    const sizeDim =
      dims.find((d) => isSizeDimension(d)) ??
      dims.find((d) => !isColorDimension(d)) ??
      null;

    // Colors
    if (colorDim) {
      const colorList: any[] = Array.isArray(values[colorDim])
        ? values[colorDim]
        : [];
      // A) Only set when non-empty; never overwrite existing populated array
      if (
        colorList.length > 0 &&
        (!variations.colors ||
          !Array.isArray(variations.colors) ||
          !variations.colors.length)
      ) {
        variations.colors = colorList;
      }
    }

    // Sizes
    if (sizeDim) {
      const sizeList: any[] = Array.isArray(values[sizeDim])
        ? values[sizeDim]
        : [];

      if (
        !variations.sizes ||
        !Array.isArray(variations.sizes) ||
        !variations.sizes.length
      ) {
        // A+B) Only inject when source data is non-empty; never fabricate defaults
        if (sizeList.length > 0) {
          variations.sizes = sizeList;
        }
        // B) No fallback to S/M/L/XL — not even for apparel unless data provides it
      }
    }

    out.variations = variations;

    // Color → images map (only when color dim is genuinely a color)
    if (colorDim && Array.isArray(matrix) && matrix.length) {
      const colorImages: Record<string, string[]> = {};

      for (const row of matrix) {
        const selections =
          row?.selections && typeof row.selections === "object"
            ? row.selections
            : row?.values && typeof row.values === "object"
            ? row.values
            : null;

        const img = row?.image || row?.image_url || row?.img;
        const colorVal =
          selections && typeof selections === "object"
            ? selections[colorDim]
            : null;

        if (!colorVal || !img) continue;

        const key = String(colorVal).trim();
        const url = String(img).trim();
        if (!key || !url) continue;

        (colorImages[key] ||= []).push(url);
      }

      // De-dupe within each color bucket
      for (const k of Object.keys(colorImages)) {
        colorImages[k] = dedupUrls(colorImages[k]);
      }

      if (!out.color_images && Object.keys(colorImages).length)
        out.color_images = colorImages;
      if (!out.color_image_key) out.color_image_key = colorDim;
    }
  } else {
    // No enrichment variants block — still persist the cleaned variations object
    // (may have had clothing sizes and size_chart stripped above in E/G)
    out.variations = variations;
  }

  return out;
}

let INDEX_CACHE: IndexItem[] | IndexManifest | null = null;
let INDEX_PROMISE: Promise<IndexItem[] | IndexManifest> | null = null;

const SHARD_CACHE: Record<string, PdpShard> = {};
const SHARD_PROMISES: Record<string, Promise<PdpShard | null>> = {};

export function ProductPdpProvider({
  product,
  children,
}: {
  product?: any;
  children: React.ReactNode;
}) {
  async function loadIndexOnce() {
    if (INDEX_CACHE) return INDEX_CACHE;
    if (INDEX_PROMISE) return INDEX_PROMISE;

    const candidates = [
      "indexes/pdp2/_index.json.gz",
      "indexes/pdp2/_index.json",
      "indexes/_index.json.gz",
      "indexes/_index.json",
    ].map((rel) => joinUrl(R2_BASE, rel));

    INDEX_PROMISE = (async () => {
      let data: any = null;
      let usedUrl: string | null = null;

      for (const u of candidates) {
        const attempted = await fetchJsonStrict<any>(u, "Index fetch", {
          allow404: true,
        });
        if (attempted !== null) {
          data = attempted;
          usedUrl = u;
          break;
        }
      }

      if (!usedUrl) {
        throw new Error(
          `Global PDP index not found. Tried: ${candidates.join(", ")}`
        );
      }

      console.log("[ProductPdpContext] Index loaded:", usedUrl);

      if (Array.isArray(data)) {
        INDEX_CACHE = data as IndexItem[];
      } else if (
        data &&
        typeof data === "object" &&
        data.shards &&
        typeof data.shards === "object" &&
        !Array.isArray(data.shards)
      ) {
        INDEX_CACHE = data as IndexManifest;
      } else {
        throw new Error("Index is not an array or valid manifest");
      }

      return INDEX_CACHE!;
    })().catch((err) => {
      console.error("[ProductPdpContext] Index load failed:", err);
      INDEX_PROMISE = null;
      throw err;
    });

    return INDEX_PROMISE;
  }

  async function loadPdpShard(shardKey: string) {
    if (!shardKey) return null;
    if (SHARD_CACHE[shardKey]) return SHARD_CACHE[shardKey];
    if (SHARD_PROMISES[shardKey]) return SHARD_PROMISES[shardKey];

    const relCandidates = [
      `indexes/pdp2/${shardKey}.json.gz`,
      `indexes/pdp2/${shardKey}.json`,
      `indexes/pdp_paths/${shardKey}.json.gz`, // legacy
      `indexes/pdp_paths/${shardKey}.json`, // legacy
    ];

    const urls = relCandidates.map((rel) => joinUrl(R2_BASE, rel));
    console.log("[ProductPdpContext] Fetching shard candidates:", urls);

    SHARD_PROMISES[shardKey] = (async () => {
      for (const u of urls) {
        const data = await fetchJsonStrict<PdpShard>(u, "Shard fetch", {
          allow404: true,
        });
        if (data !== null) {
          SHARD_CACHE[shardKey] = data;
          console.log(`[ProductPdpContext] Shard ${shardKey} loaded from ${u}`);
          return data;
        }
      }
      console.warn(
        `[ProductPdpContext] Shard ${shardKey} not found in any known location`
      );
      return null;
    })().catch((err) => {
      console.warn(`[ProductPdpContext] Shard ${shardKey} failed:`, err);
      return null;
    });

    return SHARD_PROMISES[shardKey];
  }

  return (
    <ProductPdpContext.Provider
      value={{
        loadIndexOnce,
        loadPdpShard,
        fetchJson: (url: string) => fetchJsonStrict(url),
      }}
    >
      <ProductDataContext.Provider value={normalizePdpForUi(product ?? null)}>
        {children}
      </ProductDataContext.Provider>
    </ProductPdpContext.Provider>
  );
}

export function useProductPdpContext() {
  const ctx = useContext(ProductPdpContext);
  if (!ctx)
    throw new Error("useProductPdpContext must be used inside ProductPdpProvider");
  return ctx;
}

export function useProductPdp() {
  return useContext(ProductDataContext);
}
