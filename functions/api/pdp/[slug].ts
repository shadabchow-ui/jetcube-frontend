import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  JETCUBE_R2?: R2Bucket;
  JETCUBE_PRODUCTS?: R2Bucket;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env, request }) => {
  const slug = String(params?.slug || '').trim();
  if (!slug) return json({ ok: false, error: 'Missing slug' }, 400);

  // Support either binding name while debugging
  const bucket = env.JETCUBE_R2 || env.JETCUBE_PRODUCTS;
  if (!bucket) {
    return json({
      ok: false,
      error: 'R2 bucket binding missing',
      expectedBindings: ['JETCUBE_R2', 'JETCUBE_PRODUCTS'],
    }, 500);
  }

  // Try common legacy/current key layouts
  const candidates = [
    `pdp/${slug}.json`,
    `products/${slug}.json`,
    `product/${slug}.json`,
    `p/${slug}.json`,
    `${slug}.json`,
    `indexes/pdp/${slug}.json`,
    `indexes/pdp2/${slug}.json`,
  ];

  for (const key of candidates) {
    const obj = await bucket.get(key);
    if (!obj) continue;

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('content-type', headers.get('content-type') || 'application/json; charset=utf-8');
    headers.set('x-pdp-handler', 'functions/api/pdp/[slug].ts');
    headers.set('x-pdp-key', key);
    headers.set('cache-control', 'public, max-age=120');

    return new Response(obj.body, { status: 200, headers });
  }

  // Temporary debug response (keep until fixed)
  return json({
    ok: false,
    error: 'Product not found in R2',
    slug,
    triedKeys: candidates,
    hint: 'Check actual object key path in R2 for this product slug',
  }, 404);
};

export const onRequest = onRequestGet;
