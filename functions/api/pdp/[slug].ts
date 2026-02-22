export interface Env {
  JETCUBE_R2: R2Bucket;
  VITE_R2_BASE_URL?: string;
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=UTF-8');
  }
  headers.set('cache-control', 'public, max-age=60');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function text(message: string, status = 200, headers?: HeadersInit) {
  return new Response(message, {
    status,
    headers: {
      'content-type': 'text/plain; charset=UTF-8',
      ...headers,
    },
  });
}

async function tryReadGzipJson(bucket: R2Bucket, key: string): Promise<Response | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;

  const headers = new Headers();
  headers.set('content-type', 'application/json; charset=UTF-8');
  headers.set('content-encoding', 'gzip');
  headers.set('cache-control', 'public, max-age=300');

  if (obj.httpEtag) headers.set('etag', obj.httpEtag);

  return new Response(obj.body, { status: 200, headers });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const slug = context.params?.slug;

  if (!slug || typeof slug !== 'string') {
    return json({ error: 'Missing slug param' }, { status: 400 });
  }

  const bucket = context.env?.JETCUBE_R2;
  if (!bucket) {
    // This is the exact local error you saw before; now it fails cleanly.
    return json(
      {
        error: 'R2 binding JETCUBE_R2 is not available',
        hint: 'Check Cloudflare Pages > Settings > Bindings and local wrangler config.',
      },
      { status: 500 }
    );
  }

  // Primary key (your raw R2 URL proves this convention exists)
  const directKey = `product/${slug}.json.gz`;

  // Keep index-based fallback behavior (minimal/non-breaking)
  // If your current implementation uses a richer index strategy, keep it and just leave the binding guards above.
  const candidateKeys = [
    directKey,
    `products/${slug}.json.gz`, // compatibility fallback if older uploads used "products/"
  ];

  for (const key of candidateKeys) {
    const res = await tryReadGzipJson(bucket, key);
    if (res) return res;
  }

  return json(
    {
      error: 'PDP not found',
      slug,
      tried: candidateKeys,
    },
    { status: 404 }
  );
};
