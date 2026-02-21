// functions/index.ts
// Cloudflare Pages Functions entry.
// Keep this as a bundled API handler + direct R2 proxy for indexes/sitemaps.

type R2ObjectBodyLike = {
  body: ReadableStream<Uint8Array>;
  httpMetadata?: {
    contentType?: string;
    contentEncoding?: string;
    cacheControl?: string;
  };
  etag?: string;
};

type R2BucketLike = {
  get: (key: string) => Promise<R2ObjectBodyLike | null>;
};

type EnvLike = {
  JETCUBE_R2?: R2BucketLike;
};

function stripLeadingSlash(s: string) {
  return String(s || "").replace(/^\/+/, "");
}

function cacheHeaders(maxAgeSeconds: number) {
  return `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}`;
}

function jsonResponse(
  body: any,
  status = 200,
  maxAgeSeconds = 300,
  extraHeaders: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheHeaders(maxAgeSeconds),
      ...extraHeaders,
    },
  });
}

function textResponse(body: string, contentType: string, status = 200, maxAgeSeconds = 300) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheHeaders(maxAgeSeconds),
    },
  });
}

async function readObjArrayBuffer(obj: R2ObjectBodyLike): Promise<ArrayBuffer> {
  return await new Response(obj.body).arrayBuffer();
}

function looksGz(key: string, obj?: R2ObjectBodyLike | null) {
  const k = String(key || "").toLowerCase();
  const enc = String(obj?.httpMetadata?.contentEncoding || "").toLowerCase();
  const ct = String(obj?.httpMetadata?.contentType || "").toLowerCase();
  return k.endsWith(".gz") || enc.includes("gzip") || ct.includes("gzip");
}

async function gunzipToText(ab: ArrayBuffer): Promise<string> {
  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS) throw new Error("DecompressionStream not available");
  const ds = new DS("gzip");
  const stream = new Blob([ab]).stream().pipeThrough(ds);
  return await new Response(stream).text();
}

async function getTextFromR2(r2: R2BucketLike, key: string): Promise<string | null> {
  const obj = await r2.get(stripLeadingSlash(key));
  if (!obj) return null;

  const ab = await readObjArrayBuffer(obj);
  if (!ab || ab.byteLength === 0) return "";

  if (looksGz(key, obj)) {
    return await gunzipToText(ab);
  }

  return await new Response(ab).text();
}

async function getJsonFromR2<T = any>(r2: R2BucketLike, key: string): Promise<T | null> {
  const txt = await getTextFromR2(r2, key);
  if (txt === null) return null;
  if (!txt) return null;

  try {
    return JSON.parse(txt) as T;
  } catch (e: any) {
    throw new Error(`[functions/index] JSON parse failed for ${key}: ${e?.message || e}`);
  }
}

async function proxyR2Object(
  r2: R2BucketLike,
  key: string,
  contentType: string,
  maxAgeSeconds: number
): Promise<Response> {
  const obj = await r2.get(stripLeadingSlash(key));
  if (!obj) return new Response("Not found", { status: 404 });

  // Decompress gz JSON/XML for browser safety if metadata is inconsistent
  if (looksGz(key, obj)) {
    const ab = await readObjArrayBuffer(obj);
    const txt = await gunzipToText(ab);
    return textResponse(txt, contentType, 200, maxAgeSeconds);
  }

  return new Response(obj.body, {
    status: 200,
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || contentType,
      "Cache-Control": cacheHeaders(maxAgeSeconds),
      ...(obj.etag ? { ETag: obj.etag } : {}),
    },
  });
}

/* ============================
   PDP bundling (1 request)
   ============================ */

let INDEX_CACHE: any | null = null;
let INDEX_PROMISE: Promise<any | null> | null = null;

const SHARD_CACHE: Record<string, any> = {};
const SHARD_PROMISE: Record<string, Promise<any | null>> = {};

function normalizeKey(k: string): string {
  return String(k || "").replace(/^\/+/, "");
}

async function loadIndexOnce(r2: R2BucketLike): Promise<any | null> {
  if (INDEX_CACHE) return INDEX_CACHE;
  if (INDEX_PROMISE) return INDEX_PROMISE;

  const candidates = [
    "indexes/pdp_path_map.json",
    "indexes/pdp_path_map.json.gz",
    "indexes/pdp2/_index.json",
    "indexes/pdp2/_index.json.gz",
    "indexes/_index.json",
    "indexes/_index.json.gz",
  ];

  INDEX_PROMISE = (async () => {
    for (const key of candidates) {
      const data = await getJsonFromR2<any>(r2, key);
      if (data != null) {
        INDEX_CACHE = data;
        return data;
      }
    }
    INDEX_CACHE = null;
    return null;
  })();

  return INDEX_PROMISE;
}

function resolveShardKeyFromManifest(slug: string, shardMap: Record<string, string>): string | null {
  if (!shardMap || typeof shardMap !== "object") return null;
  if (shardMap[slug]) return slug;

  const keys = Object.keys(shardMap);
  if (!keys.length) return null;

  const lower = slug.toLowerCase();
  return keys.find((k) => lower.startsWith(k.toLowerCase())) || null;
}

async function fetchShard(r2: R2BucketLike, shardKey: string): Promise<any | null> {
  const key = normalizeKey(shardKey);
  if (SHARD_CACHE[key]) return SHARD_CACHE[key];
  if (SHARD_PROMISE[key]) return SHARD_PROMISE[key];

  SHARD_PROMISE[key] = (async () => {
    const data = await getJsonFromR2<any>(r2, key);
    if (data != null) SHARD_CACHE[key] = data;
    return data ?? null;
  })();

  return SHARD_PROMISE[key];
}

async function resolveProductKeyFromIndex(r2: R2BucketLike, slug: string): Promise<string | null> {
  const idx = await loadIndexOnce(r2);
  if (!idx || typeof idx !== "object") return null;

  if (idx[slug]) {
    let k = normalizeKey(String(idx[slug]));
    // Normalize legacy index entries to product/
    if (k.startsWith("products/")) k = `product/${k.slice("products/".length)}`;
    return k;
  }

  const shardMap =
    (idx as any).shards ||
    (idx as any).pdp2_shards ||
    (idx as any).pdp_shards ||
    (idx as any).map ||
    (idx as any).paths;

  if (shardMap && typeof shardMap === "object") {
    const shardSel = resolveShardKeyFromManifest(slug, shardMap);
    if (shardSel) {
      const shardRel = String(shardMap[shardSel] || "");
      if (shardRel) {
        const shardObj = await fetchShard(r2, normalizeKey(shardRel));
        if (shardObj && typeof shardObj === "object" && shardObj[slug]) {
          let k = normalizeKey(String(shardObj[slug]));
          if (k.startsWith("products/")) k = `product/${k.slice("products/".length)}`;
          return k;
        }
      }
    }
  }

  return null;
}

function buildStrictProductCandidates(inputKey: string, slug: string): string[] {
  const variants: string[] = [];
  const seen = new Set<string>();

  const push = (k: string) => {
    const kk = normalizeKey(k);
    if (!kk || seen.has(kk)) return;
    seen.add(kk);
    variants.push(kk);
  };

  let key = normalizeKey(inputKey);

  // Normalize legacy path if index still points to it.
  if (key.startsWith("products/")) {
    key = `product/${key.slice("products/".length)}`;
  }

  // If key has no extension, prefer gz then json
  if (!/\.json(\.gz)?$/i.test(key)) {
    push(`${key}.json.gz`);
    push(`${key}.json`);
  } else if (key.endsWith(".json")) {
    push(`${key}.gz`);
    push(key);
  } else if (key.endsWith(".json.gz")) {
    push(key);
    push(key.replace(/\.json\.gz$/i, ".json"));
  } else {
    push(key);
  }

  // Always enforce canonical slug fallbacks too (strict product/* only)
  push(`product/${slug}.json.gz`);
  push(`product/${slug}.json`);

  return variants;
}

async function fetchProductJsonStrict(r2: R2BucketLike, inputKey: string, slug: string) {
  const candidates = buildStrictProductCandidates(inputKey, slug);
  let lastErr: any = null;

  for (const k of candidates) {
    try {
      const data = await getJsonFromR2<any>(r2, k);
      if (data != null) {
        return { data, key: k, tried: candidates };
      }
    } catch (e: any) {
      lastErr = e;
    }
  }

  const triedMsg = candidates.join(", ");
  if (lastErr) {
    throw new Error(`${lastErr?.message || "Product fetch failed"}. Tried: ${triedMsg}`);
  }
  throw new Error(`Product not found. Tried: ${triedMsg}`);
}

async function handlePdpApi(r2: R2BucketLike, slug: string): Promise<Response> {
  const s = String(slug || "").trim();
  if (!s) {
    return jsonResponse(
      { ok: false, error: "missing_slug" },
      400,
      0,
      { "x-pdp-handler": "functions/index.ts" }
    );
  }

  const resolvedFromIndex = await resolveProductKeyFromIndex(r2, s);
  const seedKey = resolvedFromIndex || normalizeKey(`product/${s}.json`);

  try {
    const { data } = await fetchProductJsonStrict(r2, seedKey, s);

    return jsonResponse(
      { ok: true, slug: s, data, product: data },
      200,
      300,
      { "x-pdp-handler": "functions/index.ts" }
    );
  } catch (e: any) {
    return jsonResponse(
      {
        ok: false,
        error: "not_found",
        slug: s,
        detail: e?.message || String(e),
      },
      404,
      60,
      { "x-pdp-handler": "functions/index.ts" }
    );
  }
}

/* ============================
   Category bundling (kept)
   ============================ */

let CAT_URLS_CACHE: any | null = null;
let CAT_URLS_PROMISE: Promise<any | null> | null = null;

let INDEX_CARDS_CACHE: any | null = null;
let INDEX_CARDS_PROMISE: Promise<any | null> | null = null;

async function loadCategoryUrlsOnce(r2: R2BucketLike): Promise<any | null> {
  if (CAT_URLS_CACHE) return CAT_URLS_CACHE;
  if (CAT_URLS_PROMISE) return CAT_URLS_PROMISE;

  CAT_URLS_PROMISE = (async () => {
    const a = await getJsonFromR2<any>(r2, "indexes/_category_urls.json.gz");
    if (a != null) return (CAT_URLS_CACHE = a);

    const b = await getJsonFromR2<any>(r2, "indexes/_category_urls.json");
    if (b != null) return (CAT_URLS_CACHE = b);

    CAT_URLS_CACHE = null;
    return null;
  })();

  return CAT_URLS_PROMISE;
}

async function loadIndexCardsOnce(r2: R2BucketLike): Promise<any | null> {
  if (INDEX_CARDS_CACHE) return INDEX_CARDS_CACHE;
  if (INDEX_CARDS_PROMISE) return INDEX_CARDS_PROMISE;

  INDEX_CARDS_PROMISE = (async () => {
    const a = await getJsonFromR2<any>(r2, "indexes/_index.cards.json.gz");
    if (a != null) return (INDEX_CARDS_CACHE = a);

    const b = await getJsonFromR2<any>(r2, "indexes/_index.cards.json");
    if (b != null) return (INDEX_CARDS_CACHE = b);

    INDEX_CARDS_CACHE = null;
    return null;
  })();

  return INDEX_CARDS_PROMISE;
}

function normalizeCategoryPathInput(path: string) {
  let s = String(path || "").trim();
  if (!s) return "";
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  const idx = s.indexOf("/c/");
  if (idx !== -1) s = s.slice(idx + 3);
  s = s.replace(/^\/+/, "");
  s = s.replace(/^c\//i, "");
  try {
    s = decodeURIComponent(s);
  } catch {}
  s = s.replace(/^\/+|\/+$/g, "");
  s = s.toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-");
  return s;
}

async function loadCategoryProducts(r2: R2BucketLike, categoryPath: string): Promise<any | null> {
  const s = normalizeCategoryPathInput(categoryPath);
  if (!s) return null;

  const hyphen = `${s}.json`;
  const hyphenGz = `${s}.json.gz`;
  const legacy = `${s.split("/").join("-").replace(/-/g, "__")}.json`;
  const legacyGz = `${s.split("/").join("-").replace(/-/g, "__")}.json.gz`;

  const candidates = [
    `indexes/category_products/${hyphenGz}`,
    `indexes/category_products/${hyphen}`,
    `indexes/category_products/${legacyGz}`,
    `indexes/category_products/${legacy}`,
  ];

  for (const key of candidates) {
    const data = await getJsonFromR2<any>(r2, key);
    if (data != null) return data;
  }

  return null;
}

async function handleCategoryApi(r2: R2BucketLike, categoryPath: string): Promise<Response> {
  const path = normalizeCategoryPathInput(categoryPath);
  if (!path) return jsonResponse({ ok: false, error: "missing_category_path" }, 400, 0);

  const [categoryUrls, indexCards, categoryProducts] = await Promise.all([
    loadCategoryUrlsOnce(r2),
    loadIndexCardsOnce(r2),
    loadCategoryProducts(r2, path),
  ]);

  return jsonResponse(
    {
      ok: true,
      categoryPath: path,
      categoryUrls,
      indexCards,
      categoryProducts,
    },
    200,
    300
  );
}

/* ============================
   Main handler
   ============================ */

export async function onRequestGet(context: any) {
  const { request, env, next } = context as {
    request: Request;
    env: EnvLike;
    next: () => Promise<Response>;
  };

  const url = new URL(request.url);
  const pathname = url.pathname;
  const r2 = env.JETCUBE_R2;

  // Bundled API: PDP
  if (pathname === "/api/pdp" || pathname.startsWith("/api/pdp/")) {
    if (!r2) {
      return jsonResponse(
        { ok: false, error: "r2_binding_missing" },
        500,
        0,
        { "x-pdp-handler": "functions/index.ts" }
      );
    }

    const slug =
      pathname.startsWith("/api/pdp/")
        ? decodeURIComponent(pathname.slice("/api/pdp/".length))
        : url.searchParams.get("slug") ||
          url.searchParams.get("id") ||
          url.searchParams.get("handle") ||
          "";

    return await handlePdpApi(r2, slug);
  }

  // Bundled API: Category
  if (pathname === "/api/category") {
    if (!r2) return jsonResponse({ ok: false, error: "r2_binding_missing" }, 500, 0);

    const path =
      url.searchParams.get("path") ||
      url.searchParams.get("category") ||
      url.searchParams.get("c") ||
      "";

    try {
      return await handleCategoryApi(r2, path);
    } catch (e: any) {
      return jsonResponse({ ok: false, error: e?.message || String(e) }, 500, 0);
    }
  }

  // Direct proxy for indexes
  if (pathname.startsWith("/indexes/")) {
    if (!r2) return new Response("Not found", { status: 404 });
    return await proxyR2Object(r2, stripLeadingSlash(pathname), "application/json; charset=utf-8", 86400);
  }

  // Direct proxy for sitemaps
  if (pathname.startsWith("/sitemap")) {
    if (!r2) return new Response("Not found", { status: 404 });
    return await proxyR2Object(r2, stripLeadingSlash(pathname), "application/xml; charset=utf-8", 86400);
  }

  // Fall through to static assets / SPA
  return next();
}
