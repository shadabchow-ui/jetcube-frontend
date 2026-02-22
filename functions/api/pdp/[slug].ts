import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  JETCUBE_R2?: R2Bucket;
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=UTF-8');
  }
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=300');
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function readR2Json(bucket: R2Bucket, key: string): Promise<Response | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;

  const headers = new Headers();
  headers.set('content-type', 'application/json; charset=UTF-8');
  headers.set('cache-control', 'public, max-age=300');
  if (obj.httpEtag) headers.set('etag', obj.httpEtag);
  if (key.endsWith('.gz')) headers.set('content-encoding', 'gzip');

  return new Response(obj.body, { status: 200, headers });
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const slug = params?.slug;

  if (!slug || typeof slug !== 'string') {
    return json({ error: 'Missing slug' }, { status: 400 });
  }

  const bucket = env?.JETCUBE_R2;
  if (!bucket) {
    return json(
      {
        error: 'Missing R2 binding',
        binding: 'JETCUBE_R2',
        hint: 'Add the JETCUBE_R2 R2 binding in Cloudflare Pages project settings and local wrangler config.',
      },
      { status: 500 }
    );
  }

  const candidateKeys = [
    `product/${slug}.json.gz`,
    `products/${slug}.json.gz`,
    `pdp/${slug}.json.gz`,
    `product/${slug}.json`,
    `products/${slug}.json`,
    `pdp/${slug}.json`,
  ];

  for (const key of candidateKeys) {
    const hit = await readR2Json(bucket, key);
    if (hit) return hit;
  }

  return json({ error: 'PDP not found', slug, tried: candidateKeys }, { status: 404 });
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'GET' || context.request.method === 'HEAD') {
    return onRequestGet(context);
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'GET, HEAD' },
  });
};
