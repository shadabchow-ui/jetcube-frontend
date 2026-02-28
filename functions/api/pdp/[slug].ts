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

function looksLikeAsin(s: string): boolean {
  // Amazon ASINs are typically 10 chars, letters+digits
  const t = (s || "").trim();
  return /^[A-Za-z0-9]{10}$/.test(t);
}

async function getJsonFromR2(bucket: R2Bucket, key: string): Promise<any | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;

  const isGzip = key.endsWith(".gz") || obj.httpMetadata?.contentEncoding === "gzip";

  if (isGzip && typeof DecompressionStream !== "undefined") {
    const ds = new DecompressionStream("gzip");
    const decompressedStream = obj.body.pipeThrough(ds);
    const text = await new Response(decompressedStream).text();
    return JSON.parse(text);
  }

  return JSON.parse(await obj.text());
}

async function resolveAsinToHandle(bucket: R2Bucket, asin: string): Promise<{ handle: string; key: string } | null> {
  const a = asin.trim();

  // Keep this list small and deterministic.
  // You can standardize on ONE of these (recommended: asins/{asin}.json).
  const tried = [
    `asins/${a}.json`,
    `asin/${a}.json`,
    `asins/${a}.json.gz`,
    `asin/${a}.json.gz`,
  ];

  for (const key of tried) {
    try {
      const j = await getJsonFromR2(bucket, key);
      const handle = String(j?.handle || "").trim();
      if (handle) return { handle, key };
    } catch {
      // ignore parse errors here; continue trying other keys
    }
  }

  return null;
}

export const onRequest: PagesFunction<Env> = async ({ params, env }) => {
  let slug = decodeURIComponent(String(params?.slug || "")).trim();

  if (!slug) {
    return jsonRes({ ok: false, error: "missing_slug" }, 400);
  }

  // Check which R2 binding is available
  const bucket = env.JETCUBE_R2 || env.JETCUBE_PRODUCTS;
  if (!bucket) {
    return jsonRes({ ok: false, error: "missing_r2_binding" }, 500);
  }

  // ✅ NEW: If the slug looks like an ASIN, try to resolve it to a handle via alias objects.
  // This prevents /p/{ASIN} from bouncing to homepage when the platform stores PDP JSON by handle.
  let asinResolved: { handle: string; key: string } | null = null;
  if (looksLikeAsin(slug)) {
    asinResolved = await resolveAsinToHandle(bucket, slug.toUpperCase());
    if (asinResolved?.handle) {
      slug = asinResolved.handle;
    }
  }

  // Priority order of R2 keys to check (handle-based)
  const triedKeys = [
    `product/${slug}.json.gz`,
    `product/${slug}.json`,
    `products/${slug}.json.gz`,
    `products/${slug}.json`,
    `${slug}.json.gz`,
    `${slug}.json`,
  ];

  for (const key of triedKeys) {
    const obj = await bucket.get(key);
    if (!obj) continue;

    try {
      const isGzip = key.endsWith(".gz") || obj.httpMetadata?.contentEncoding === "gzip";
      let data;

      if (isGzip && typeof DecompressionStream !== "undefined") {
        const ds = new DecompressionStream("gzip");
        const decompressedStream = obj.body.pipeThrough(ds);
        const text = await new Response(decompressedStream).text();
        data = JSON.parse(text);
      } else {
        data = JSON.parse(await obj.text());
      }

      return jsonRes(
        {
          ok: true,
          slug,
          data,
          product: data,
          asinResolved: asinResolved ? { from: (params as any)?.slug ?? null, key: asinResolved.key, handle: asinResolved.handle } : null,
        },
        200,
        {
          "x-pdp-key": key,
          "x-pdp-is-gzip": String(isGzip),
          ...(asinResolved ? { "x-pdp-asin-resolved": "1", "x-pdp-asin-alias-key": asinResolved.key } : {}),
        }
      );
    } catch (err: any) {
      return jsonRes(
        { ok: false, error: "parse_failed", key, message: err.message },
        500
      );
    }
  }

  return jsonRes({ ok: false, error: "not_found", slug, triedKeys, asinResolved }, 404);
};
