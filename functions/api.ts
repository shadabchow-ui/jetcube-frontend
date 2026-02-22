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

  // Let the dedicated PDP route file handle this
  if (pathname === "/api/pdp" || pathname.startsWith("/api/pdp/")) {
    return ctx.next();
  }

  // Category aggregation
  if (pathname.startsWith("/api/category/")) {
    const category = decodeURIComponent(pathname.replace("/api/category/", "").trim());
    return handleCategory(category, env, ctx as any, request);
  }

  // Assistant health route
  if (pathname.startsWith("/api/assistant")) {
    return json({ ok: true, message: "assistant endpoint alive" });
  }

  // Pass through unknown API routes so nested handlers can run
  return ctx.next();
};

async function handleCategory(category: string, env: Env, ctx: ExecutionContext, req: Request) {
  if (!category) {
    return json({ ok: false, error: "missing_category" }, 400);
  }

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
