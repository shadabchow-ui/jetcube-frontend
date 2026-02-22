import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Keep API traffic on the Functions pipeline.
  if (path === '/api' || path.startsWith('/api/')) {
    return context.next();
  }

  // Let Pages serve static assets + SPA/static files normally.
  return context.next();
};
