import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  JETCUBE_R2?: R2Bucket;
  JETCUBE_PRODUCTS?: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  // Pass the request through to let static assets / the React SPA
  // or other nested API routes (like /api/pdp) handle the traffic.
  return ctx.next();
};
