export interface Env {
  JETCUBE_R2: R2Bucket;
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-pdp-handler": "functions/api/pdp/[slug].ts",
    },
  });
}

async function readJson(obj: R2ObjectBody, isGzip: boolean) {
  if (!isGzip) {
    return JSON.parse(await obj.text());
  }
  const ab = await obj.arrayBuffer();
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([ab]).stream().pipeThrough(ds);
  return JSON.parse(await new Response(stream).text());
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const slug = decodeURIComponent(url.pathname.split("/").pop() || "").trim();

  if (!slug) {
    return json({ ok: false, error: "missing_slug" }, 400);
  }

  const keys = [
    `product/${slug}.json.gz`,
    `product/${slug}.json`,
  ];

  for (const key of keys) {
    const obj = await env.JETCUBE_R2.get(key);
    if (!obj) continue;

    const data = await readJson(obj, key.endsWith(".gz"));
    return json({ ok: true, slug, data, product: data });
  }

  return json(
    { ok: false, error: "not_found", slug, tried: keys },
    404
  );
};
