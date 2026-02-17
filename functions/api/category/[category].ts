export interface Env {
  JETCUBE_R2: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async ({ params, env, request, waitUntil }) => {
  const category = params.category as string;

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const [meta, products] = await Promise.all([
    env.JETCUBE_R2.get(`indexes/${category}.json`),
    env.JETCUBE_R2.get(`indexes/${category}.products.json`),
  ]);

  if (!meta) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const payload = {
    category,
    meta: await meta.json(),
    products: products ? await products.json() : [],
  };

  const res = new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
    },
  });

  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
};

