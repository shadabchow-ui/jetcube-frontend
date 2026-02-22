import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  JETCUBE_R2?: R2Bucket;
  JETCUBE_PRODUCTS?: R2Bucket;
}

function jsonRes(body: any, status = 200, extra: Record<string, string> = {}) {
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

export const onRequest: PagesFunction<Env> = async ({ params, env }) => {
  const slug = decodeURIComponent(String(params?.slug || "")).trim();

  if (!slug) {
    return jsonRes({ ok: false, error: "missing_slug" }, 400);
  }

  // Check which R2 binding is available
  const bucket = env.JETCUBE_R2 || env.JETCUBE_PRODUCTS;
  if (!bucket) {
    return jsonRes({ ok: false, error: "missing_r2_binding" }, 500);
  }

  // Priority order of R2 keys to check
  const triedKeys = [
    `product/${slug}.json.gz`,
    `product/${slug}.json`,
    `products/${slug}.json.gz`,
    `products/${slug}.json`,
    `${slug}.json.gz`,
    `${slug}.json`
  ];

  for (const key of triedKeys) {
    const obj = await bucket.get(key);
    if (!obj) continue;

    try {
      const isGzip = key.endsWith(".gz") || obj.httpMetadata?.contentEncoding === "gzip";
      let data;

      if (isGzip && typeof DecompressionStream !== "undefined") {
        // Efficient stream piping for GZIP decompression
        const ds = new DecompressionStream("gzip");
        const decompressedStream = obj.body.pipeThrough(ds);
        const text = await new Response(decompressedStream).text();
        data = JSON.parse(text);
      } else {
        // Fallback for uncompressed files
        data = JSON.parse(await obj.text());
      }

      // Return the successfully parsed JSON
      return jsonRes(
        { ok: true, slug, data, product: data },
        200,
        { "x-pdp-key": key, "x-pdp-is-gzip": String(isGzip) }
      );
      
    } catch (err: any) {
      // If parsing fails, report the error cleanly without crashing the whole worker
      return jsonRes(
        { ok: false, error: "parse_failed", key, message: err.message },
        500
      );
    }
  }

  // If the loop finishes without returning, the item wasn't found
  return jsonRes({ ok: false, error: "not_found", slug, triedKeys }, 404);
};
