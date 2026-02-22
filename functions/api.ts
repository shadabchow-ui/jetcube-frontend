export interface Env {
  JETCUBE_R2: R2Bucket;
}

const CATEGORY_TTL = 60 * 10; // 10 minutes

function json(body: any, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-api-handler": "functions/api.ts",
      ...extra,
    },
  });
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // IMPORTANT:
  // PDP is handled exclusively by Pages Functions:
  //   functions/api/pdp/[slug].ts
  // Do NOT route /api/pdp/* here.
  if (pathname === "/api/pdp" || pathname.startsWith("/api/pdp/")) {
    return ctx.next();
  }

  // Category aggregation
  if (pathname.startsWith("/api/category/")) {
    const category = decodeURIComponent(pathname.replace("/api/category/", "").trim());
    return handleCategory(category, env, ctx as any, request);
  }

  // Assistant or other APIs can live here
  if (pathname.startsWith("/api/assistant")) {
    return json({ ok: true, message: "assistant endpoint alive" });
  }

  // Let other specific API route files handle their own paths.
  return ctx.next();
};

async function readR2Json(obj: R2ObjectBody, isGzip = false): Promise<any> {
  if (!isGzip) return await obj.json();

  const compressed = await obj.arrayBuffer();
  const ds = new DecompressionStream("gzip");
  const stream = new Response(compressed).body?.pipeThrough(ds);
  if (!stream) throw new Error("gzip stream failed");
  return await new Response(stream).json();
}

// Kept intact for current category behavior.
async function handleCategory(category: string, env: Env, ctx: ExecutionContext, req: Request) {
  if (!category) {
    return json({ ok: false, error: "missing_category" }, 400);
  }

  const cacheKey = new Request(req.url, req);
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // You can adjust these keys to your real category index layout
  const indexKey = `indexes/${category}.json`;
  const productsKey = `indexes/${category}.products.json`;

  const [indexObj, productsObj] = await Promise.all([
    env.JETCUBE_R2.get(indexKey),
    env.JETCUBE_R2.get(productsKey),
  ]);

  if (!indexObj) {
    return json({ ok: false, error: "category_not_found", category }, 404);
  }

  const payload = {
    ok: true,
    category,
    meta: await indexObj.json(),
    products: productsObj ? await productsObj.json() : [],
  };

  const res = new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${CATEGORY_TTL}, stale-while-revalidate=3600`,
      "x-api-handler": "functions/api.ts",
    },
  });

  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
