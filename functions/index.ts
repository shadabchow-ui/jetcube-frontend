export async function onRequestGet(context: any) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // NOTE:
  // In Pages Functions, calling fetch(request) for same-origin URLs can create recursion.
  // Use context.next() to fall through to static assets / SPA.

  // Serve index JSON
  if (pathname === "/indexes/_category_urls.json") {
    const obj = await env.JETCUBE_R2?.get("indexes/_category_urls.json");
    if (!obj) return new Response("Not found", { status: 404 });

    return new Response(obj.body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Serve sitemap
  if (pathname.startsWith("/sitemap")) {
    const key = pathname.replace(/^\//, "");
    const obj = await env.JETCUBE_R2?.get(key);
    if (!obj) return new Response("Not found", { status: 404 });

    return new Response(obj.body, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // FALL THROUGH → static assets / SPA
  return next();
}

