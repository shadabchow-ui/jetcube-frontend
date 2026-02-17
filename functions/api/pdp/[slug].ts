export interface Env {
  JETCUBE_R2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const slug = context.params?.slug as string | undefined;

  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const baseKey = `products/${slug}.json`;
  const gzKey = `${baseKey}.gz`;

  // Prefer gz if present
  const gzObj = await context.env.JETCUBE_R2.get(gzKey);
  if (gzObj) {
    const headers = new Headers();
    headers.set("content-type", "application/json; charset=utf-8");
    headers.set("content-encoding", "gzip");
    headers.set("cache-control", "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400");

    return new Response(gzObj.body, { status: 200, headers });
  }

  const obj = await context.env.JETCUBE_R2.get(baseKey);
  if (!obj) {
    return new Response(JSON.stringify({ error: "Not found", slug }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const headers = new Headers();
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400");

  return new Response(obj.body, { status: 200, headers });
};







