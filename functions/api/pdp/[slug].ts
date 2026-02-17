export interface Env {
  JETCUBE_R2: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, env, request } = context;
  const slug = params.slug as string;

  const cache = caches.default;
  const cacheKey = new Request(request.url);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const base = `products/${slug}`;

  const [product, pricing, reviews, availability] = await Promise.all([
    env.JETCUBE_R2.get(`${base}.json`),
    env.JETCUBE_R2.get(`${base}.pricing.json`),
    env.JETCUBE_R2.get(`${base}.reviews.json`),
    env.JETCUBE_R2.get(`${base}.availability.json`),
  ]);

  if (!product) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = {
    product: await product.json(),
    pricing: pricing ? await pricing.json() : null,
    reviews: reviews ? await reviews.json() : [],
    availability: availability ? await availability.json() : null,
  };

  const res = new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });

  context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
};

