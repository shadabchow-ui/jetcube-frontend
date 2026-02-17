export const onRequestGet: PagesFunction = async (context) => {
  try {
    const { params, env } = context;
    const slug = params?.slug;

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const key = `products/${slug}.json.gz`;
    const obj = await env.JETCUBE_R2.get(key);

    if (!obj) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("Content-Type", "application/json");
    headers.set("Content-Encoding", "gzip");
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(obj.body, { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};




