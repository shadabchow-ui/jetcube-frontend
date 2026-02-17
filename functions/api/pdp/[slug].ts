export interface Env {
  JETCUBE_R2: R2Bucket;
}

async function gunzipToText(buffer: ArrayBuffer): Promise<string> {
  // Cloudflare Workers supports DecompressionStream.
  const stream = new Response(buffer).body;
  if (!stream) return "";
  const decompressed = stream.pipeThrough(new DecompressionStream("gzip"));
  return await new Response(decompressed).text();
}

async function readJsonMaybeGz(env: Env, keyBase: string): Promise<any | null> {
  // Prefer .json.gz if present, otherwise fall back to .json
  const gzKey = `${keyBase}.json.gz`;
  const jsonKey = `${keyBase}.json`;

  const gzObj = await env.JETCUBE_R2.get(gzKey);
  if (gzObj) {
    const ab = await gzObj.arrayBuffer();
    const text = await gunzipToText(ab);
    return JSON.parse(text);
  }

  const obj = await env.JETCUBE_R2.get(jsonKey);
  if (!obj) return null;
  return await obj.json();
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, env, request } = context;
  const slug = params.slug as string;

  const cache = caches.default;
  const cacheKey = new Request(request.url);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const base = `products/${slug}`;

  // Keep response shape identical to what the frontend expects.
  const [product, pricing, reviews, availability] = await Promise.all([
    readJsonMaybeGz(env, base),
    readJsonMaybeGz(env, `${base}.pricing`),
    readJsonMaybeGz(env, `${base}.reviews`),
    readJsonMaybeGz(env, `${base}.availability`),
  ]);

  if (!product) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const body = JSON.stringify({ product, pricing, reviews, availability });

  const res = new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Safe default; reduces repeated R2 reads.
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });

  // Cache the response at the edge
  context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
};



