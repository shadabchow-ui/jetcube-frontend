export async function onRequest({ request, env, next }: any) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // ----------------------------
  // Helpers
  // ----------------------------
  const jsonHeaders = (cacheSeconds: number, extra: Record<string, string> = {}) => ({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": `public, max-age=${cacheSeconds}`,
    "X-Edge-MW": "hit",
    ...extra,
  });

  function stripSlashes(s: string) {
    return String(s || "").replace(/^\/+|\/+$/g, "");
  }

  function safeDecodeURIComponent(s: string): string {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  }

  function normalizeKey(s: string): string {
    return String(s || "").replace(/^\/+/, "");
  }

  function normalizeCategoryPath(input: string): string {
    if (!input) return "";
    let s = String(input).trim();
    const idx = s.indexOf("/c/");
    if (idx !== -1) s = s.slice(idx + 3);
    s = s.replace(/^c\//, "");
    s = safeDecodeURIComponent(s);
    s = stripSlashes(s);
    s = s.toLowerCase();
    s = s.replace(/\s+/g, "-");
    s = s.replace(/-+/g, "-");
    return s;
  }

  function pickProductsArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }

  function looksGzip(key: string, obj?: any): boolean {
    const k = String(key || "").toLowerCase();
    const enc = String(obj?.httpMetadata?.contentEncoding || "").toLowerCase();
    const ct = String(obj?.httpMetadata?.contentType || "").toLowerCase();
    return k.endsWith(".gz") || enc.includes("gzip") || ct.includes("gzip");
  }

  async function r2GetObject(key: string) {
    return (await env.JETCUBE_R2?.get(normalizeKey(key))) || null;
  }

  async function r2ReadText(key: string): Promise<string | null> {
    const obj = await r2GetObject(key);
    if (!obj) return null;

    if (!looksGzip(key, obj)) {
      return await new Response(obj.body).text();
    }

    // Decompress gz even if metadata is wrong/missing
    try {
      const DS: any = (globalThis as any).DecompressionStream;
      if (!DS) {
        return await new Response(obj.body).text();
      }
      const ab = await new Response(obj.body).arrayBuffer();
      const ds = new DS("gzip");
      const stream = new Blob([ab]).stream().pipeThrough(ds);
      return await new Response(stream).text();
    } catch {
      // fallback (prevents hard crash)
      return await new Response(obj.body).text();
    }
  }

  async function r2ReadJson<T = any>(key: string): Promise<T | null> {
    const txt = await r2ReadText(key);
    if (txt == null) return null;
    const s = txt.trim();
    if (!s) return null;

    // guard against accidental HTML fallback
    if (s.startsWith("<!doctype") || s.startsWith("<html") || s.startsWith("<")) return null;

    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }

  async function r2ReadJsonFromCandidates<T = any>(keys: string[]): Promise<T | null> {
    for (const key of keys) {
      const data = await r2ReadJson<T>(key);
      if (data != null) return data;
    }
    return null;
  }

  function resolveShardKeyFromManifest(slug: string, shardMap: Record<string, string>): string | null {
    const map = shardMap || {};
    if (typeof map !== "object") return null;

    if (map[slug]) return slug;

    const keys = Object.keys(map);
    if (!keys.length) return null;

    const lowerSlug = slug.toLowerCase();
    const hit = keys.find((k) => lowerSlug.startsWith(k.toLowerCase()));
    return hit || null;
  }

  function buildCanonicalPdpCandidatesFromSlug(slug: string): string[] {
    const clean = stripSlashes(slug);
    return [
      `product/${clean}.json.gz`,
      `product/${clean}.json`,
      `products/${clean}.json.gz`,
      `products/${clean}.json`,
    ];
  }

  function buildPdpCandidatesFromPath(productPathOrSlug: string): string[] {
    const raw = normalizeKey(productPathOrSlug);
    const out: string[] = [];
    const seen = new Set<string>();

    const push = (k: string) => {
      const kk = normalizeKey(k);
      if (!kk || seen.has(kk)) return;
      seen.add(kk);
      out.push(kk);
    };

    if (!raw) return out;

    const hasExt = /\.json(\.gz)?$/i.test(raw);
    const startsProduct = raw.startsWith("product/");
    const startsProducts = raw.startsWith("products/");

    // If only slug passed
    if (!startsProduct && !startsProducts && !hasExt) {
      for (const k of buildCanonicalPdpCandidatesFromSlug(raw)) push(k);
      return out;
    }

    // If path passed without extension
    if ((startsProduct || startsProducts) && !hasExt) {
      push(`${raw}.json.gz`);
      push(`${raw}.json`);

      // mirror singular/plural
      if (startsProduct) {
        const tail = raw.slice("product/".length);
        push(`products/${tail}.json.gz`);
        push(`products/${tail}.json`);
      }
      if (startsProducts) {
        const tail = raw.slice("products/".length);
        push(`product/${tail}.json.gz`);
        push(`product/${tail}.json`);
      }
      return out;
    }

    // Exact key first
    push(raw);

    // Twin compression form
    if (raw.endsWith(".json")) push(`${raw}.gz`);
    if (raw.endsWith(".json.gz")) push(raw.replace(/\.json\.gz$/i, ".json"));

    // Mirror singular/plural version of same key
    if (raw.startsWith("product/")) {
      const mirrored = `products/${raw.slice("product/".length)}`;
      push(mirrored);
      if (mirrored.endsWith(".json")) push(`${mirrored}.gz`);
      if (mirrored.endsWith(".json.gz")) push(mirrored.replace(/\.json\.gz$/i, ".json"));
    } else if (raw.startsWith("products/")) {
      const mirrored = `product/${raw.slice("products/".length)}`;
      push(mirrored);
      if (mirrored.endsWith(".json")) push(`${mirrored}.gz`);
      if (mirrored.endsWith(".json.gz")) push(mirrored.replace(/\.json\.gz$/i, ".json"));
    }

    // Final canonical slug fallback if we can infer slug
    const m = raw.match(/^(?:product|products)\/(.+?)(?:\.json(?:\.gz)?)?$/i);
    if (m?.[1]) {
      for (const k of buildCanonicalPdpCandidatesFromSlug(m[1])) push(k);
    }

    return out;
  }

  async function fetchProductJsonWithFallback(productPathOrSlug: string): Promise<{ data: any | null; hitKey: string | null; tried: string[] }> {
    const tried = buildPdpCandidatesFromPath(productPathOrSlug);

    for (const key of tried) {
      const data = await r2ReadJson<any>(key);
      if (data != null) {
        return { data, hitKey: key, tried };
      }
    }

    return { data: null, hitKey: null, tried };
  }

  async function resolveProductPathFromIndexes(slug: string): Promise<string | null> {
    const idx = await r2ReadJsonFromCandidates<any>([
      "indexes/pdp_path_map.json",
      "indexes/pdp_path_map.json.gz",
      "indexes/pdp2/_index.json",
      "indexes/pdp2/_index.json.gz",
      "indexes/_index.json",
      "indexes/_index.json.gz",
    ]);

    let productPath: string | null = null;

    if (idx && typeof idx === "object") {
      if (idx[slug]) {
        productPath = String(idx[slug]);
      }

      if (!productPath) {
        const shardMap =
          idx?.shards ||
          idx?.pdp2_shards ||
          idx?.pdp_shards ||
          idx?.map ||
          idx?.paths;

        if (shardMap && typeof shardMap === "object") {
          const shardPrefix = resolveShardKeyFromManifest(slug, shardMap as Record<string, string>);
          if (shardPrefix) {
            const shardPath = normalizeKey(String((shardMap as any)[shardPrefix] || ""));
            if (shardPath) {
              const shard = await r2ReadJson<Record<string, string>>(shardPath);
              if (shard && shard[slug]) {
                productPath = String(shard[slug]);
              }
            }
          }
        }
      }
    }

    // NOTE: do NOT force singular here. Keep what index gives us (product/ or products/)
    return productPath ? normalizeKey(productPath) : null;
  }

  async function buildPdpPayload(slugRaw: string) {
    const slug = safeDecodeURIComponent(String(slugRaw || "").trim());

    if (!slug) {
      return {
        response: new Response(JSON.stringify({ ok: false, error: "missing_slug" }), {
          status: 400,
          headers: jsonHeaders(0, {
            "x-pdp-handler": "functions/_middleware.ts",
          }),
        }),
      };
    }

    // Try index/shard-resolved path first, then direct canonical slug candidates.
    const indexedPath = await resolveProductPathFromIndexes(slug);

    let productResult = indexedPath
      ? await fetchProductJsonWithFallback(indexedPath)
      : { data: null, hitKey: null, tried: [] as string[] };

    if (!productResult.data) {
      const direct = await fetchProductJsonWithFallback(slug);
      productResult = {
        data: direct.data,
        hitKey: direct.hitKey,
        tried: [...productResult.tried, ...direct.tried],
      };
    }

    if (!productResult.data) {
      return {
        response: new Response(
          JSON.stringify({
            ok: false,
            error: "not_found",
            slug,
            indexedPath,
            tried: Array.from(new Set(productResult.tried)),
          }),
          {
            status: 404,
            headers: jsonHeaders(60, {
              "x-pdp-handler": "functions/_middleware.ts",
            }),
          }
        ),
      };
    }

    const product = productResult.data;
    const hitKey = productResult.hitKey || "";

    const related: any[] = [];
    const alsoViewed: any[] = [];

    // Optional lightweight enrichment
    try {
      const indexItems = await r2ReadJsonFromCandidates<any[]>([
        "products/search_index.enriched.json",
        "products/search_index.enriched.json.gz",
        "indexes/search_index.enriched.json",
        "indexes/search_index.enriched.json.gz",
      ]);

      if (Array.isArray(indexItems)) {
        const currentKey =
          (product as any)?.slug ||
          (product as any)?.handle ||
          (product as any)?.asin ||
          slug;

        const currentCat =
          (product as any)?.category_slug ||
          (product as any)?.categorySlug ||
          "";

        if (currentCat) {
          for (const p of indexItems) {
            const key = p?.slug || p?.handle || p?.asin || p?.id || null;
            if (!key || key === currentKey) continue;
            if ((p?.category_slug || p?.categorySlug) === currentCat) {
              related.push(p);
              if (related.length >= 8) break;
            }
          }
        }

        for (const p of indexItems) {
          const key = p?.slug || p?.handle || p?.asin || p?.id || null;
          if (!key || key === currentKey) continue;
          alsoViewed.push(p);
          if (alsoViewed.length >= 8) break;
        }
      }
    } catch {
      // ignore enrichment failures
    }

    const payload = {
      ok: true,
      slug,
      data: product,
      product, // backward compatibility
      related,
      alsoViewed,
      _debug: {
        indexedPath,
        hitKey,
      },
    };

    return {
      response: new Response(JSON.stringify(payload), {
        status: 200,
        headers: jsonHeaders(300, {
          "x-pdp-handler": "functions/_middleware.ts",
          "x-pdp-key": hitKey || "unknown",
        }),
      }),
    };
  }

  // ----------------------------
  // API endpoints (single-request loaders)
  // ----------------------------
  if (pathname.startsWith("/api/")) {
    // Support:
    //   /api/pdp?slug=...
    //   /api/pdp/:slug
    // IMPORTANT: Delegate PDP to functions/api/pdp/[slug].ts
    if (pathname === "/api/pdp" || pathname.startsWith("/api/pdp/")) {
      return next();
    }

    // /api/category?path=...
    if (pathname === "/api/category") {
      const rawPath = (url.searchParams.get("path") || "").trim();
      const normalized = normalizeCategoryPath(rawPath);

      if (!normalized) {
        return new Response(JSON.stringify({ error: "Missing path" }), {
          status: 400,
          headers: jsonHeaders(0),
        });
      }

      const categoryIndex =
        (await r2ReadJsonFromCandidates<any>([
          "indexes/_category_urls.json",
          "indexes/_category_urls.json.gz",
        ])) ?? null;

      const parts = stripSlashes(normalized)
        .split("/")
        .filter(Boolean)
        .map((p) => safeDecodeURIComponent(p));

      const hyphenName = `${parts.join("-")}.json`;
      const legacyName = `${parts.join("__")}.json`;

      const productCandidates = [
        `indexes/category_products/${hyphenName}`,
        `indexes/category_products/${hyphenName}.gz`,
        `indexes/category_products/_categories/${hyphenName}`,
        `indexes/category_products/_categories/${hyphenName}.gz`,
        `indexes/category_products/${legacyName}`,
        `indexes/category_products/${legacyName}.gz`,
        `indexes/category_products/_categories/${legacyName}`,
        `indexes/category_products/_categories/${legacyName}.gz`,
      ];

      let categoryProductsRaw = await r2ReadJsonFromCandidates<any>(productCandidates);

      // fallback: filter cards index
      if (!categoryProductsRaw) {
        const cards =
          (await r2ReadJsonFromCandidates<any>([
            "indexes/_index.cards.json",
            "indexes/_index.cards.json.gz",
          ])) ?? null;

        const all = pickProductsArray(cards);
        if (all.length) {
          const want = normalizeCategoryPath(normalized);

          const filtered = all.filter((p: any) => {
            const raw =
              p?.category_path ??
              p?.categoryPath ??
              p?.category ??
              p?.category_url ??
              p?.categoryUrl ??
              p?.categorySlug ??
              p?.categories ??
              p?.category_paths ??
              null;

            const candidates: string[] = [];

            const push = (v: any) => {
              if (!v) return;
              const s = normalizeCategoryPath(String(v));
              if (s) candidates.push(s);
            };

            if (Array.isArray(raw)) raw.forEach(push);
            else if (typeof raw === "string") push(raw);
            else if (raw && typeof raw === "object") push(raw.path ?? raw.url ?? raw.slug);

            return candidates.some((c) => c === want || c.startsWith(`${want}/`));
          });

          categoryProductsRaw = filtered;
        }
      }

      return new Response(
        JSON.stringify({
          path: normalized,
          categoryIndex,
          products: pickProductsArray(categoryProductsRaw),
        }),
        {
          status: 200,
          headers: jsonHeaders(300),
        }
      );
    }

    // /api/search?q=...
    if (pathname === "/api/search") {
      const q = (url.searchParams.get("q") || "").trim();

      if (!q) {
        return new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: jsonHeaders(60),
        });
      }

      function normalize(s: string) {
        return String(s || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      function tokenize(s: string) {
        return normalize(s).split(" ").filter(Boolean);
      }

      const tokens = tokenize(q);

      const indexItems =
        (await r2ReadJsonFromCandidates<any[]>([
          "indexes/search_index.enriched.json",
          "indexes/search_index.enriched.json.gz",
          "products/search_index.enriched.json",
          "products/search_index.enriched.json.gz",
        ])) ?? [];

      const results = Array.isArray(indexItems)
        ? indexItems
            .map((it: any) => {
              const titleN = normalize(it?.title || "");
              const brandN = normalize(it?.brand || "");
              const categoryN = normalize(it?.category || "");
              const searchableN = normalize(it?.searchable || "");

              let score = 0;
              for (const t of tokens) {
                if (titleN.includes(t)) score += 3;
                if (brandN.includes(t)) score += 2;
                if (categoryN.includes(t)) score += 1;
                if (searchableN.includes(t)) score += 1;
              }
              return score > 0 ? { it, score } : null;
            })
            .filter(Boolean)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 60)
            .map((x: any) => x.it)
        : [];

      return new Response(JSON.stringify({ items: results }), {
        status: 200,
        headers: jsonHeaders(60),
      });
    }

    return new Response(JSON.stringify({ error: "Unknown API route" }), {
      status: 404,
      headers: jsonHeaders(60),
    });
  }

  // ----------------------------
  // R2 proxy paths
  // ----------------------------
  // Only intercept these paths (sitemaps + indexes + product/products)
  const isSitemap = pathname.startsWith("/sitemap");
  const isIndexes = pathname.startsWith("/indexes/");
  const isProductSingular = pathname.startsWith("/product/");
  const isProductsLegacy = pathname.startsWith("/products/");

  if (!isSitemap && !isIndexes && !isProductSingular && !isProductsLegacy) {
    return next();
  }

  const key = pathname.slice(1);
  const obj = await env.JETCUBE_R2?.get(key);

  // CRITICAL: never fall back to SPA for these
  if (!obj) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Edge-MW": "hit-notfound",
      },
    });
  }

  const lowerKey = key.toLowerCase();
  const isXML = lowerKey.endsWith(".xml");
  const isJSON = lowerKey.endsWith(".json") || lowerKey.endsWith(".json.gz");
  const isGZ = lowerKey.endsWith(".gz");

  const contentType = isXML
    ? "application/xml; charset=utf-8"
    : isJSON
      ? "application/json; charset=utf-8"
      : "application/octet-stream";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=86400",
    "X-Edge-MW": "hit",
  };

  // If the object key ends in .gz, advertise gz
  if (isGZ) {
    headers["Content-Encoding"] = "gzip";
    headers["Vary"] = "Accept-Encoding";
  }

  return new Response(obj.body, { headers });
}
