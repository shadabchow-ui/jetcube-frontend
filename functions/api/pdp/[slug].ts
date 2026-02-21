type Env = {
  JETCUBE_R2: R2Bucket;
};

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-pdp-handler": "functions/api/pdp/[slug].ts",
    },
  });
}

async function readJsonFromR2Object(obj: R2ObjectBody, key: string): Promise<any> {
  const lower = key.toLowerCase();

  if (!lower.endsWith(".gz")) {
    const text = await obj.text();
    return JSON.parse(text);
  }

  const ab = await obj.arrayBuffer();
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([ab]).stream().pipeThrough(ds);
  const text = await new Response(stream).text();
  return JSON.parse(text);
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  const url = new URL(request.url);
  const slug = decodeURIComponent(url.pathname.split("/").pop() || "").trim();

  if (!slug) {
    return json({ ok: false, error: "missing_slug" }, 400);
  }

  try {
    const keys = [`product/${slug}.json.gz`, `product/${slug}.json`];

    let hitObj: R2ObjectBody | null = null;
    let hitKey = "";

    for (const key of keys) {
      const obj = await env.JETCUBE_R2.get(key);
      if (obj) {
        hitObj = obj;
        hitKey = key;
        break;
      }
    }

    if (!hitObj) {
      return json(
        {
          ok: false,
          error: "not_found",
          slug,
          tried: keys,
        },
        404
      );
    }

    const data = await readJsonFromR2Object(hitObj, hitKey);

    return new Response(
      JSON.stringify({
        ok: true,
        slug,
        data,
        product: data,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-pdp-handler": "functions/api/pdp/[slug].ts",
        },
      }
    );
  } catch (err: any) {
    return json(
      {
        ok: false,
        error: "pdp_fetch_failed",
        slug,
        detail: err?.message || String(err),
      },
      500
    );
  }
};
