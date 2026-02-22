
import type { PagesFunction } from '@cloudflare/workers-types';

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=UTF-8');
  }
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'no-store');
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }

  const url = new URL(request.url);
  return json({
    ok: true,
    route: '/api',
    pathname: url.pathname,
    message: 'API root is live',
    timestamp: new Date().toISOString(),
  });
};
