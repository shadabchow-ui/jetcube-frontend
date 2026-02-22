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

async function readObjectAsJsonResponse(obj: R2ObjectBody, key: string) {
  const isGz = key.endsWith('.gz');
  const headers = new Headers();

  obj.writeHttpMetadata(headers);
  headers.set('x-pdp-key', key);
  headers.set('x-pdp-handler', 'functions/api/pdp/[slug].ts');
  headers.set('cache-control', 'public, max-age=120');

  if (!isGz) {
    headers.set(
      'content-type',
      headers.get('content-type') || 'application/json; charset=utf-8'
    );
    return new Response(obj.body, { status: 200, headers });
  }

  // Decompress .json.gz and return normal JSON
  const compressed = await obj.arrayBuffer();
  const ds = new DecompressionStream('gzip');
  const decompressedStream = new Blob([compressed]).stream().pipeThrough(ds);
  const text = await new Response(decompressedStream).text();

  headers.set('content-type', 'application/json; charset=utf-8');
  headers.delete('content-encoding'); // important: we're returning decompressed JSON
  return new Response(text, { status: 200, headers });
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const slug = String(params?.slug || '').trim();
  if (!slug) return json({ ok: false, error: 'Missing slug' }, 400);

  const bucket = env.JETCUBE_R2 || env.JETCUBE_PRODUCTS;
  if (!bucket) {
    return json(
      {
        ok: false,
        error: 'R2 bucket binding missing',
        expectedBindings: ['JETCUBE_R2', 'JETCUBE_PRODUCTS'],
      },
      500
    );
  }

  // Put your REAL path first (based on screenshot)
  const candidates = [
    `product/${slug}.json.gz`,
    `product/${slug}.json`,
    `products/${slug}.json.gz`,
    `products/${slug}.json`,
    `pdp/${slug}.json.gz`,
    `pdp/${slug}.json`,
    `${slug}.json.gz`,
    `${slug}.json`,
  ];

  for (const key of candidates) {
    const obj = await bucket.get(key);
    if (!obj) continue;
    return readObjectAsJsonResponse(obj, key);
  }

  return json(
    {
      ok: false,
      error: 'Product not found in R2',
      slug,
      triedKeys: candidates,
    },
    404
  );
};

export const onRequest = onRequestGet;
