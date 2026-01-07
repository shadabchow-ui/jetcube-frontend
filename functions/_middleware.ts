export async function onRequest({ request, env, next }: any) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only intercept these paths (sitemaps + indexes)
  const isSitemap = pathname.startsWith("/sitemap");
  const isIndexes = pathname.startsWith("/indexes/");

  if (!isSitemap && !isIndexes) {
    return next();
  }

  // R2 key is path without leading slash
  const key = pathname.slice(1);

  const obj = await env.JETCUBE_R2.get(key);

  // CRITICAL: never fall back to SPA for these
  if (!obj) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Edge-MW": "hit-notfound",
      },
    });
  }

  const isXML = key.endsWith(".xml");
  const isJSON = key.endsWith(".json");

  return new Response(obj.body, {
    headers: {
      "Content-Type": isXML
        ? "application/xml; charset=utf-8"
        : isJSON
          ? "application/json; charset=utf-8"
          : "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "X-Edge-MW": "hit",
    },
  });
}
