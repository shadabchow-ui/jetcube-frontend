export const onRequestGet: PagesFunction = async (context) => {
  try {
    const slug = context.params?.slug as string | undefined;

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const r2Base = context.env?.R2_PUBLIC_BASE || "";

    const productUrl = `${r2Base}/products/${encodeURIComponent(slug)}.json.gz`;

    const res = await fetch(productUrl);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(res.body, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-encoding": "gzip",
        "cache-control": "public, max-age=600",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};





