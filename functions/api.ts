import type { PagesFunction } from '@cloudflare/workers-types';

/**
 * This file MUST NOT act as a router for /api/*
 * Cloudflare Pages file-based routing will dispatch:
 *   /api/pdp/[slug]        -> functions/api/pdp/[slug].ts
 *   /api/category/[cat]   -> functions/api/category/[category].ts
 *   /api/assistant        -> functions/api/assistant.ts
 *
 * This file should only handle:
 *   GET /api
 */

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only handle /api or /api/
  if (path !== '/api' && path !== '/api/') {
    // IMPORTANT: return 404 so nested file routes can handle their own paths
    return new Response('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-api-handler': 'functions/api.ts',
      },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      service: 'ventari-api',
      routes: [
        '/api/pdp/:slug',
        '/api/category/:category',
        '/api/assistant',
      ],
      ts: Date.now(),
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-api-handler': 'functions/api.ts',
      },
    }
  );
};

// Default export for all methods
export const onRequest = onRequestGet;
