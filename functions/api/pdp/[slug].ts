export interface Env {
  JETCUBE_R2: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const slug = ctx.params.slug as string;

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  // Serve cached JSON from R2: products/<slug>.json or products/<slug>.json.gz
  const base = `products/${slug}`;

  const [plain, gz] = await Promise.all([
    ctx.env.JETCUBE_R2.get(`${base}.json`),
    ctx.env.JETCUBE_R2.get(`${base}.json.gz`),
  ]);

  const obj = gz ?? plain;
  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);

  // Make sure content-type is correct even if metadata missing
  if (!headers.get("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  // If gz exists, ensure encoding header is correct
  if (gz) {
    headers.set("content-encoding", "gzip");
  }

  // Cache is safe for immutable product blobs
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
};

