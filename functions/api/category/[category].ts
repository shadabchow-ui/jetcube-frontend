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
    headers.set('cache-control', 'public, max-age=600, stale-while-revalidate=3600');
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const category = context.params?.category;
  if (!category || typeof category !== 'string') {
    return json({ error: 'Missing category' }, { status: 400 });
  }

  const bucket = context.env?.JETCUBE_R2;
  if (!bucket) {
    return json(
      {
        error: 'Missing R2 binding',
        binding: 'JETCUBE_R2',
      },
      { status: 500 }
    );
  }

  const cache = caches.default;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const metaKeys = [
    `indexes/${category}.json`,
    `categories/${category}/_index.json`,
    `category/${category}.json`,
  ];
  const productsKeys = [
    `indexes/${category}.products.json`,
    `categories/${category}/products.json`,
  ];

  let metaObj: R2ObjectBody | null = null;
  let metaKeyHit: string | null = null;
  for (const key of metaKeys) {
    const obj = await bucket.get(key);
    if (obj) {
      metaObj = obj;
      metaKeyHit = key;
      break;
    }
  }

  if (!metaObj) {
    return json({ error: 'Category not found', category, tried: metaKeys }, { status: 404 });
  }

  let productsObj: R2ObjectBody | null = null;
  let productsKeyHit: string | null = null;
  for (const key of productsKeys) {
    const obj = await bucket.get(key);
    if (obj) {
      productsObj = obj;
      productsKeyHit = key;
      break;
    }
  }

  const payload = {
    ok: true,
    category,
    meta: await metaObj.json(),
    products: productsObj ? await productsObj.json() : [],
    source: {
      meta: metaKeyHit,
      products: productsKeyHit,
    },
  };

  const response = json(payload);
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};
