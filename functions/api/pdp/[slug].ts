export const onRequestGet: PagesFunction = async (ctx) => {
  const { request, env } = ctx;

  // URL path: /api/pdp/:slug
  const url = new URL(request.url);
  const slug = url.pathname.split("/").pop() || "";

  if (!slug) {
    return new Response(JSON.stringify({ error: "missing slug" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  try {
    // R2 key for product JSON
    const key = `products/${slug}.json`;
    const obj = await env.JETCUBE_R2?.get(key);

    if (!obj) {
      return new Response(JSON.stringify({ error: "not found", slug }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const text = await obj.text();
    return new Response(text, {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "pdp fetch failed", slug }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
};








