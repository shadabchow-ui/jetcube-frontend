export interface Env {
  JETCUBE_R2: R2Bucket;
}

const PDP_TTL = 60 * 60; // 1 hour
const CATEGORY_TTL = 60 * 10; // 10 minutes

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);
    const pathname = url.pathname;



    if (pathname.startsWith("/api/category/")) {
      const category = pathname.slice("/api/category/".length);
      return handleCategory(category, env, ctx, req);
    }

    return json(
      { ok: false, error: "not_found", route: pathname },
      404,
      { "x-pdp-handler": "functions/api.ts" }
    );
  },
};

function json(body: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

async function readR2JsonObject(obj: R2ObjectBody, key: string): Promise<any> {
  const isGzip = key.toLowerCase().endsWith(".gz");

  if (!isGzip) {
    const text = await obj.text();
    return JSON.parse(text);
  }

  const compressed = await obj.arrayBuffer();
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([compressed]).stream().pipeThrough(ds);
  const text = await new Response(stream).text();
  return JSON.parse(text);
}

async function readOptionalSidecarJson(
  env: Env,
  key: string,
  fallback: any = null
): Promise<any> {
  try {
    const obj = await env.JETCUBE_R2.get(key);
    if (!obj) return fallback;
    const text = await obj.text();
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function handlePDP(slug: string, env: Env, ctx: ExecutionContext, req: Request) {
  const cache = caches.default;
  const cacheKey = new Request(req.url, req);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const cleanSlug = decodeURIComponent(String(slug || "").trim());

  if (!cleanSlug) {
    return json(
      { ok: false, error: "missing_slug" },
      400,
      { "x-pdp-handler": "functions/api.ts" }
    );
  }

  const productBase = `product/${cleanSlug}`;
  const candidates = [`${productBase}.json.gz`, `${productBase}.json`];

  let productObj: R2ObjectBody | null = null;
  let resolvedKey = "";
  let resolvedBase = productBase;

  for (const key of candidates) {
    const obj = await env.JETCUBE_R2.get(key);
    if (obj) {
      productObj = obj;
      resolvedKey = key;
      resolvedBase = key.replace(/\.json(?:\.gz)?$/i, "");
      break;
    }
  }

  if (!productObj) {
    return json(
      {
        ok: false,
        error: "not_found",
        slug: cleanSlug,
        tried: candidates,
      },
      404,
      { "x-pdp-handler": "functions/api.ts" }
    );
  }

  let productJson: any;
  try {
    productJson = await readR2JsonObject(productObj, resolvedKey);
  } catch (e: any) {
    return json(
      {
        ok: false,
        error: "invalid_product_json",
        slug: cleanSlug,
        key: resolvedKey,
        detail: e?.message || String(e),
      },
      500,
      { "x-pdp-handler": "functions/api.ts" }
    );
  }

  // Optional sidecars stay supported (same base path as resolved product key)
  const [pricing, reviews, availability] = await Promise.all([
    readOptionalSidecarJson(env, `${resolvedBase}.pricing.json`, null),
    readOptionalSidecarJson(env, `${resolvedBase}.reviews.json`, []),
    readOptionalSidecarJson(env, `${resolvedBase}.availability.json`, null),
  ]);

  const payload = {
    ok: true,
    slug: cleanSlug,
    data: productJson,
    product: productJson, // backward compatibility
    pricing,
    reviews,
    availability,
  };

  const res = new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${PDP_TTL}, stale-while-revalidate=86400`,
      "x-pdp-handler": "functions/api.ts",
    },
  });

  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function handleCategory(category: string, env: Env, ctx: ExecutionContext, req: Request) {
  const cache = caches.default;
  const cacheKey = new Request(req.url, req);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const cleanCategory = decodeURIComponent(String(category || "").trim());

  if (!cleanCategory) {
    return json({ ok: false, error: "missing_category" }, 400);
  }

  const indexKey = `indexes/${cleanCategory}.json`;
  const productsKey = `indexes/${cleanCategory}.products.json`;

  const [indexObj, productsObj] = await Promise.all([
    env.JETCUBE_R2.get(indexKey),
    env.JETCUBE_R2.get(productsKey),
  ]);

  if (!indexObj) {
    return json({ ok: false, error: "not_found", category: cleanCategory }, 404);
  }

  const payload = {
    ok: true,
    category: cleanCategory,
    meta: await indexObj.json(),
    products: productsObj ? await productsObj.json() : [],
  };

  const res = new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${CATEGORY_TTL}, stale-while-revalidate=3600`,
    },
  });

  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
