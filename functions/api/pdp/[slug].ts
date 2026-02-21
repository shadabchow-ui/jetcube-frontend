export const onRequestGet: PagesFunction = async (ctx) => {
  const { request, env } = ctx;

  const url = new URL(request.url);
  const slug = decodeURIComponent(url.pathname.split("/").pop() || "").trim();

  if (!slug) {
    return new Response(JSON.stringify({ error: "missing slug" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  try {
    // Try gzip first (recommended for your current upload flow)
    const gzKey = `product/${slug}.json.gz`;
    const jsonKey = `product/${slug}.json`;

    let obj = await env.JETCUBE_R2?.get(gzKey);

    if (obj) {
      const body = await obj.arrayBuffer();
      return new Response(body, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-encoding": "gzip",
          "cache-control": "public, max-age=300",
        },
      });
    }

    // Fallback to plain json
    obj = await env.JETCUBE_R2?.get(jsonKey);

    if (!obj) {
      return new Response(
        JSON.stringify({
          error: "not found",
          slug,
          tried: [gzKey, jsonKey],
        }),
        {
          status: 404,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
    }

    const text = await obj.text();
    return new Response(text, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "pdp fetch failed",
        slug,
        detail: err?.message || String(err),
      }),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }
};








