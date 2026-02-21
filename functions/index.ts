// Cloudflare Pages Functions entry.
// This file should NOT handle PDP.
// PDP is handled exclusively by: functions/api/pdp/[slug].ts

export interface Env {
  JETCUBE_R2?: R2Bucket;
}

function json(body: any, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-index-handler": "functions/index.ts",
      ...extra,
    },
  });
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request } = ctx;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Never intercept API routes here.
  if (pathname.startsWith("/api/")) {
    return ctx.next();
  }

  // Let static assets / SPA handle everything else.
  return ctx.next();
};
