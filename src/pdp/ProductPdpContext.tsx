import React, { createContext, useContext } from "react";
import { R2_BASE, joinUrl, fetchJsonStrict } from "../config/r2";

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

/* ────────────────────────────────────────────────────────
   NEW: Product DATA context (consumed by useProductPdp)
   ──────────────────────────────────────────────────────── */
const ProductDataContext = createContext<any | null>(null);

/* ────────────────────────────────────────────────────────
   v31.3-gold PDP normalization (UI compatibility layer)
   Goal: keep existing UI components unchanged by projecting
   gold fields into the legacy keys they already read.
   ──────────────────────────────────────────────────────── */
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

  // Images: prefer gold media gallery (HD), fall back to legacy images/image
  const gallery = gold?.media?.gallery;
  if (Array.isArray(gallery) && gallery.length) {
    out.images = gallery.map(String).filter(Boolean);
    if (!out.image) out.image = out.images[0] || null;
  }

  // Specs: keep legacy specs, add normalized specs when present
  const normalizedSpecs = gold?.specs?.normalized;
  if (
    normalizedSpecs &&
    typeof normalizedSpecs === "object" &&
    !Array.isArray(normalizedSpecs)
  ) {
    out.specs_normalized = { ...normalizedSpecs };
    // Merge into legacy specs map for sections that only read `specs`
    const legacySpecs =
      out.specs &&
      typeof out.specs === "object" &&
      !Array.isArray(out.specs)
        ? out.specs
        : {};
    out.specs = { ...legacySpecs, ...normalizedSpecs };
  }

  // Size chart: keep both structured + safe HTML if present
  if (gold?.sizeChart) {
    if (gold.sizeChart.tables && !out.size_chart_tables)
      out.size_chart_tables = gold.sizeChart.tables;
    if (gold.sizeChart.htmlSafe && !out.size_chart_html)
      out.size_chart_html = gold.sizeChart.htmlSafe;
  }

  // A+: expose blocks/images for downstream sections (even if currently unused)
  if (gold?.aplus) {
    if (!out.aplus) out.aplus = gold.aplus;
    if (!out.aplus_blocks) out.aplus_blocks = gold.aplus.blocks;
    if (!out.aplus_images) out.aplus_images = gold.aplus.images;
  }

  // Variants / Twister: project into legacy-friendly `variations`
  const variants = gold?.variants;
  if (variants && typeof variants === "object") {
    const dims: string[] = Array.isArray(variants.dimensions)
      ? variants.dimensions.map(String)
      : [];
    const values: any =
      variants.values && typeof variants.values === "object" ? variants.values : {};
    const matrix: any[] = Array.isArray(variants.matrix) ? variants.matrix : [];

    const variations: any =
      out.variations && typeof out.variations === "object" ? { ...out.variations } : {};

    // Find color/size dimension names (case-insensitive)
    const colorDim =
      dims.find((d) => d.toLowerCase() === "color") ||
      dims.find((d) => d.toLowerCase().includes("color"));
    const sizeDim =
      dims.find((d) => d.toLowerCase() === "size") ||
      dims.find((d) => d.toLowerCase().includes("size"));

    if (colorDim) {
      const colorList = Array.isArray(values[colorDim]) ? values[colorDim] : [];
      if (
        !variations.colors ||
        !Array.isArray(variations.colors) ||
        !variations.colors.length
      ) {
        variations.colors = colorList;
      }
    }

    if (sizeDim) {
      const sizeList = Array.isArray(values[sizeDim]) ? values[sizeDim] : [];
      if (!variations.sizes || !Array.isArray(variations.sizes) || !variations.sizes.length) {
        variations.sizes = sizeList;
      }
    }

    if (!out.variations) out.variations = variations;

    // Optional: color → images map if matrix includes an image per variant.
    // (Your sample matrix uses { values: {...} } and currently has no image field.)
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
          selections && typeof selections === "object" ? selections[colorDim] : null;

        if (!colorVal || !img) continue;

        const key = String(colorVal).trim();
        const url = String(img).trim();
        if (!key || !url) continue;

        (colorImages[key] ||= []).push(url);
      }

      // De-dupe while preserving order
      for (const k of Object.keys(colorImages)) {
        const seen = new Set<string>();
        colorImages[k] = colorImages[k].filter((u) =>
          seen.has(u) ? false : (seen.add(u), true)
        );
      }

      if (!out.color_images && Object.keys(colorImages).length) out.color_images = colorImages;
      if (!out.color_image_key) out.color_image_key = colorDim;
    }
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

      // Support both array format and manifest { base, shards }
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
