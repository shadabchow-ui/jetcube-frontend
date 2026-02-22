import type { PagesFunction } from '@cloudflare/workers-types';

// Root function is intentionally passive; Pages/static + _redirects control routing.
export const onRequest: PagesFunction = async (context) => {
  return context.next();
};
