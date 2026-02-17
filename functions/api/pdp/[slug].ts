export const onRequest: PagesFunction<{
  JETCUBE_R2: R2Bucket;
}> = async (context) => {
  const { env, params } = context;

  const slug = String(params.slug || "").trim();
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ---- helpers ----
  const gunzipToText = async (buf: ArrayBuffer): Promise<string> => {
    const DS = (globalThis as any).DecompressionStream;
    if (!DS) {
      // If DecompressionStream isn't available, fail loudly (better than silent garbage JSON).
      throw new Error("DecompressionStream not available in runtime");
    }
    const stream = new Response(buf).body!.pipeThrough(new DS("gzip"));
    return await new Response(stream).text();
  };

  const readJsonFromR2 = async (keyBase: string): Promise<any | null> => {
    // Try plain JSON first, then gz
    const candidates = [`${keyBase}.json`, `${keyBase}.json.gz`];

    for (const key of candidates) {
      const obj = await env.JETCUBE_R2.get(key);
      if (!obj) continue;

      try {
        if (key.endsWith(".gz")) {
          const ab = await obj.arrayBuffer();
          const txt = await gunzipToText(ab);
          return JSON.parse(txt);
        }
        return await obj.json();
      } catch {
        // If parse fails, keep trying other candidate
        continue;
      }
    }
    return null;
  };

  // ---- load payload ----
  const base = `products/${slug}`;

  const [product, pricing, reviews, availability] = await Promise.all([
    readJsonFromR2(base),
    readJsonFromR2(`${base}.pricing`),
    readJsonFromR2(`${base}.reviews`),
    readJsonFromR2(`${base}.availability`),
  ]);

  if (!product) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = {
    product,
    pricing: pricing ?? null,
    reviews: Array.isArray(reviews) ? reviews : [],
    availability: availability ?? null,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      // tweak if you want; this is safe and keeps Workers costs down
      "Cache-Control": "public, max-age=300",
    },
  });
};


