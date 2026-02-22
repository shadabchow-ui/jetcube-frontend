import type { PagesFunction } from '@cloudflare/workers-types';

/**
 * Root-level function only.
 * Do NOT route /api/* here.
 */
export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only handle root path if this function is invoked.
  if (path !== '/' && path !== '') {
    return new Response('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-root-handler': 'functions/index.ts',
      },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      route: '/',
      ts: Date.now(),
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-root-handler': 'functions/index.ts',
      },
    }
  );
};

export const onRequest = onRequestGet;
