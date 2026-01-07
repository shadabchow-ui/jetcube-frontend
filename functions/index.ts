export async function onRequestGet({ request, env }: any) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Serve index JSON
  if (pathname === "/indexes/_category_urls.json") {
    const obj = await env.R2_BUCKET.get("indexes/_category_urls.json");
    if (!obj) return new Response("Not found", { status: 404 });

    return new Response(obj.body, {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Serve sitemap
  if (pathname.startsWith("/sitemap")) {
    const key = pathname.replace("/", "");
    const obj = await env.R2_BUCKET.get(key);
    if (!obj) return new Response("Not found", { status: 404 });

    return new Response(obj.body, {
      headers: { "Content-Type": "application/xml" },
    });
  }

  // FALL THROUGH → static assets / SPA
  return fetch(request);
}
