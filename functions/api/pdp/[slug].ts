export interface Env {
  JETCUBE_R2?: R2Bucket;
  // Optional fallback if R2 binding isn't present:
  // Example: https://<your-r2-public-domain>
  R2_PUBLIC_BASE?: string;
  // Optional override (if you store a full products base like https://.../products)
  R2_PUBLIC_PRODUCTS_BASE?: string;
}

function withCors(headers: Headers) {
  // Keep this permissive unless you want to lock it down later.
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return headers;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env, request } = context;

  const slugRaw = (params as any)?.slug;
  const slug = typeof slugRaw === "string" ? slugRaw : Array.isArray(slugRaw) ? slugRaw[0] : "";
  if (!slug) {
    const headers = withCors(new Headers({ "Content-Type": "application/json" }));
    return new Response(JSON.stringify({ error: "missing slug" }), { status: 400, headers });
  }

  // Handle preflight defensively (even though this is GET-only)
  if (request.method === "OPTIONS") {
    const headers = withCors(new Headers());
    return new Response(null, { status: 204, headers });
  }

  // Prefer R2 binding if available
  if (env.JETCUBE_R2) {
    // Try gz first
    const gzKey = `products/${slug}.json.gz`;
    const jsonKey = `products/${slug}.json`;

    const gzObj = await env.JETCUBE_R2.get(gzKey);
    if (gzObj) {
      const headers = withCors(new Headers());
      headers.set("Content-Type", "application/json");
      headers.set("Content-Encoding", "gzip");
      headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
      // pass through etag if present
      if ((gzObj as any).etag) headers.set("ETag", (gzObj as any).etag);
      return new Response(gzObj.body, { status: 200, headers });
    }

    const jsonObj = await env.JETCUBE_R2.get(jsonKey);
    if (jsonObj) {
      const headers = withCors(new Headers());
      headers.set("Content-Type", "application/json");
      headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
      if ((jsonObj as any).etag) headers.set("ETag", (jsonObj as any).etag);
      return new Response(jsonObj.body, { status: 200, headers });
    }

    const headers = withCors(new Headers({ "Content-Type": "application/json" }));
    headers.set("Cache-Control", "public, max-age=60, s-maxage=60");
    return new Response(JSON.stringify({ error: "not found", slug }), { status: 404, headers });
  }

  // Fallback: fetch from public R2 URL if binding isn't configured
  const base =
    env.R2_PUBLIC_PRODUCTS_BASE ||
    (env.R2_PUBLIC_BASE ? `${env.R2_PUBLIC_BASE.replace(/\/+$/, "")}/products` : "");

  if (!base) {
    const headers = withCors(new Headers({ "Content-Type": "application/json" }));
    return new Response(JSON.stringify({ error: "R2 not configured" }), { status: 500, headers });
  }

  const url = `${base.replace(/\/+$/, "")}/${encodeURIComponent(slug)}.json`;
  const res = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } });

  const headers = withCors(new Headers(res.headers));
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
  return new Response(res.body, { status: res.status, headers });
};






