export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\//, "");

  // ---- INDEX FILES ----
  if (path.startsWith("indexes/")) {
    const obj = await env.JETCUBE_R2.get(path);
    if (!obj) return new Response("Not found", { status: 404 });

    return new Response(obj.body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  // ---- SITEMAPS ----
  if (path === "sitemap.xml" || path.startsWith("sitemap-")) {
    const obj = await env.JETCUBE_R2.get(path);
    if (!obj) return new Response("Not found", { status: 404 });

    return new Response(obj.body, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // ---- FALL THROUGH TO REACT ----
  return fetch(request);
};
