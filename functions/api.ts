export interface Env {
  JETCUBE_R2: R2Bucket;
}

const PDP_TTL = 60 * 60; // 1 hour
const CATEGORY_TTL = 60 * 10; // 10 minutes

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // PDP aggregation
    if (pathname.startsWith("/api/pdp/")) {
      const slug = pathname.replace("/api/pdp/", "");
      return handlePDP(slug, env, ctx, req);
    }

    // Category/Search aggregation
    if (pathname.startsWith("/api/category/")) {
      const category = pathname.replace("/api/category/", "");
      return handleCategory(category, env, ctx, req);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function readR2Json(obj: R2ObjectBody, isGzip = false): Promise<any> {
  if (!isGzip) return await obj.json();

  // Cloudflare Workers supports DecompressionStream.
  const compressed = await obj.arrayBuffer();
  const ds = new DecompressionStream("gzip");
  const stream = new Response(compressed).body?.pipeThrough(ds);

  if (!stream) {
    throw new Error("Failed to create decompression stream");
  }

  return await new Response(stream).json();
}

async function handlePDP(slug: string, env: Env, ctx: ExecutionContext, req: Request) {
  const cacheKey = new Request(req.url, req);
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const cleanSlug = decodeURIComponent(String(slug || "").trim());
  const base = `product/${cleanSlug}`;

  const productGzKey = `${base}.json.gz`;
  const productJsonKey = `${base}.json`;

  // Product can now be gzipped or plain JSON.
  let productObj = await env.JETCUBE_R2.get(productGzKey);
  let productIsGzip = !!productObj;

  if (!productObj) {
    productObj = await env.JETCUBE_R2.get(productJsonKey);
    productIsGzip = false;
  }

  // Optional sidecar files (keep existing behavior)
  const [pricing, reviews, availability] = await Promise.all([
    env.JETCUBE_R2.get(`${base}.pricing.json`),
    env.JETCUBE_R2.get(`${base}.reviews.json`),
    env.JETCUBE_R2.get(`${base}.availability.json`),
  ]);

  if (!productObj) {
    return new Response(
      JSON.stringify({
        error: "Not found",
        slug: cleanSlug,
        tried: [productGzKey, productJsonKey],
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const productJson = await readR2Json(productObj, productIsGzip);

  // Keep backward compatibility for any callers using payload.product
  // and support App.tsx (which prefers payload.data).
  const payload = {
    ok: true,
    slug: cleanSlug,
    data: productJson,
    product: productJson,
    pricing: pricing ? await pricing.json() : null,
    reviews: reviews ? await reviews.json() : [],
    availability: availability ? await availability.json() : null,
  };

  const res = new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${PDP_TTL}, stale-while-revalidate=86400`,
      "x-pdp-handler": "functions/api.ts",
    },
  });

  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function handleCategory(category: string, env: Env, ctx: ExecutionContext, req: Request) {
  const cacheKey = new Request(req.url, req);
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const indexKey = `indexes/${category}.json`;
  const productsKey = `indexes/${category}.products.json`;

  const [indexObj, productsObj] = await Promise.all([
    env.JETCUBE_R2.get(indexKey),
    env.JETCUBE_R2.get(productsKey),
  ]);

  if (!indexObj) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const payload = {
    category: category,
    meta: await indexObj.json(),
    products: productsObj ? await productsObj.json() : [],
  };

  const res = new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CATEGORY_TTL}, stale-while-revalidate=3600`,
    },
  });

  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
