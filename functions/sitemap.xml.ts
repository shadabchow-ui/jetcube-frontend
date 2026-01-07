export async function onRequestGet({ env }) {
  const obj = await env.JETCUBE_R2.get("sitemap.xml");

  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
