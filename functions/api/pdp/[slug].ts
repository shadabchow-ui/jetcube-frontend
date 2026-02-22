export interface Env {
  JETCUBE_R2: R2Bucket;
}

function json(body: any, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-pdp-handler": "functions/api/pdp/[slug].ts",
      ...extra,
    },
  });
}

async function readJson(obj: R2ObjectBody, isGzip: boolean) {
  if (!isGzip) {
    return JSON.parse(await obj.text());
  }

  const ab = await obj.arrayBuffer();
  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS) {
    // Fallback if DecompressionStream unavailable
    return JSON.parse(await obj.text());
  }

  const ds = new DS("gzip");
  const stream = new Blob([ab]).stream().pipeThrough(ds);
  return JSON.parse(await new Response(stream).text());
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const slug = decodeURIComponent(String(params?.slug || "")).trim();

  if (!slug) {
    return json({ ok: false, error: "missing_slug" }, 400);
  }

  const keys = [`product/${slug}.json.gz`, `product/${slug}.json`];

  for (const key of keys) {
    const obj = await env.JETCUBE_R2.get(key);
    if (!obj) continue;

    const data = await readJson(obj, key.endsWith(".gz"));
    return json(
      { ok: true, slug, data, product: data },
      200,
      { "x-pdp-key": key }
    );
  }

  return json(
    { ok: false, error: "not_found", slug, tried: keys },
    404
  );
};
