export async function onRequest({ request, env, next }: any) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // ----------------------------
  // Helpers
  // ----------------------------
  const jsonHeaders = (cacheSeconds: number) => ({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": `public, max-age=${cacheSeconds}`,
    "X-Edge-MW": "hit",
  });

  function stripSlashes(s: string) {
    return s.replace(/^\/+|\/+$/g, "");
  }

  function normalizeCategoryPath(input: string): string {
    if (!input) return "";
    let s = String(input).trim();
    const idx = s.indexOf("/c/");
    if (idx !== -1) s = s.slice(idx + 3);
    s = s.replace(/^c\//, "");
    s = decodeURIComponent(s);
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

  async function r2GetObject(key: string) {
    const obj = await env.JETCUBE_R2?.get(key);
    return obj || null;
  }

  async function r2ReadText(key: string): Promise<string | null> {
    const obj = await r2GetObject(key);
    if (!obj) return null;

    const isGz =
      key.toLowerCase().endsWith(".gz") ||
      String(obj?.httpMetadata?.contentType || "")
        .toLowerCase()
        .includes("gzip");

    if (!isGz) {
      return await new Response(obj.body).text();
    }

    // Decompress gz safely (even if metadata is wrong)
    try {
      const DS: any = (globalThis as any).DecompressionStream;
      if (!DS) {
        // Worst-case fallback: return raw bytes as text (likely unusable, but won't crash)
        return await new Response(obj.body).text();
      }
      const ab = await new Response(obj.body).arrayBuffer();
      const ds = new DS("gzip");
      const stream = new Blob([ab]).stream().pipeThrough(ds);
      return await new Response(stream).text();
    } catch {
      return await new Response(obj.body).text();
    }
  }

  async function r2ReadJson<T = any>(key: string): Promise<T | null> {
    const txt = await r2ReadText(key);
    if (txt == null) return null;
    const s = txt.trim();
    if (!s) return null;
    // Guard against accidental HTML fallback (should never happen from R2, but keep it safe)
    if (s.startsWith("<")) return null;
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }

  async function r2ReadJsonFromCandidates<T = any>(keys: string[]): Promise<T | null> {
    for (const k of keys) {
      const data = await r2ReadJson<T>(k);
      if (data != null) return data;
    }
    return null;
  }

  function resolveShardKeyFromManifest(slug: string, shardMap: Record<string, string>): string | null {
    const keys = Object.keys(shardMap || {});
    if (!keys.length) return null;
    if (shardMap[slug]) return slug;
    const hit = keys.find((k) => slug.toLowerCase().startsWith(k.toLowerCase()));
    return hit || null;
  }

  function normalizeProductKey(productPath: string): string {
    return String(productPath || "").replace(/^\/+/, "");
  }

  async function fetchProductJsonWithFallback(productKeyOrPath: string): Promise<any | null> {
    const base = normalizeProductKey(productKeyOrPath);
    const variants: string[] = [];
    const seen = new Set<string>();

    const push = (k: string) => {
      const kk = String(k || "").trim();
      if (!kk || seen.has(kk)) return;
      seen.add(kk);
      variants.push(kk);
    };

    push(base);

    if (base.endsWith(".json")) push(`${base}.gz`);
    if (base.endsWith(".json.gz")) push(base.replace(/\.json\.gz$/i, ".json"));

    if (!/\.json(\.gz)?$/i.test(base)) {
      push(`${base}.json`);
      push(`${base}.json.gz`);
    }

    for (const k of variants) {
      const data = await r2ReadJson<any>(k);
      if (data != null) return data;
    }

    return null;
  }

  // ----------------------------
  // API endpoints (single-request loaders)
  // ----------------------------
  const isApi = pathname.startsWith("/api/");
  if (isApi) {
    // /api/pdp?slug=...
    if (pathname === "/api/pdp") {
      const slug = (url.searchParams.get("slug") || url.searchParams.get("id") || "").trim();
      if (!slug) {
        return new Response(JSON.stringify({ error: "Missing slug" }), {
          status: 400,
          headers: jsonHeaders(0),
        });
      }

      // Index/manifest candidates (mirror frontend)
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
        if (idx[slug]) productPath = String(idx[slug]);

        if (!productPath) {
          const shardMap =
            idx?.shards ||
            idx?.pdp2_shards ||
            idx?.pdp_shards ||
            idx?.map ||
            idx?.paths;

          if (shardMap && typeof shardMap === "object") {
            const shardKey = resolveShardKeyFromManifest(slug, shardMap as Record<string, string>);
            if (shardKey) {
              const shardRel = String((shardMap as any)[shardKey] || "");
              const shardKeyPath = normalizeProductKey(shardRel);
              const shardObj = await r2ReadJson<Record<string, string>>(shardKeyPath);
              if (shardObj && shardObj[slug]) productPath = String(shardObj[slug]);
            }
          }
        }
      }

      if (!productPath) productPath = `products/${slug}.json`;

      const product = await fetchProductJsonWithFallback(productPath);
      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found", slug }), {
          status: 404,
          headers: jsonHeaders(60),
        });
      }

      // Optional: embed lightweight related arrays so PDP can avoid extra fetches later
      // (If index missing, just return empty arrays)
      const related: any[] = [];
      const alsoViewed: any[] = [];

      try {
        const indexItems = await r2ReadJson<any[]>("products/search_index.enriched.json");
        if (Array.isArray(indexItems)) {
          const currentKey =
            (product as any)?.slug ||
            (product as any)?.handle ||
            (product as any)?.asin ||
            slug;

          const currentCat = (product as any)?.category_slug || "";

          if (currentCat) {
            for (const p of indexItems) {
              const key = p?.slug || p?.handle || p?.asin || p?.id || null;
              if (!key || key === currentKey) continue;
              if (p?.category_slug && p.category_slug === currentCat) {
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
        // ignore
      }

      const payload = {
        product,
        related,
        alsoViewed,
      };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: jsonHeaders(300),
      });
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

      // category index paths (for sidebar / tree)
      const categoryIndex =
        (await r2ReadJsonFromCandidates<any>([
          "indexes/_category_urls.json",
          "indexes/_category_urls.json.gz",
        ])) ?? null;

      // Try direct category_products files
      const parts = stripSlashes(normalized)
        .split("/")
        .filter(Boolean)
        .map(decodeURIComponent);

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

      // Fallback: filter from full cards index
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

            return candidates.some((c) => c == want || c.startsWith(`${want}/`));
          });

          categoryProductsRaw = filtered;
        }
      }

      const payload = {
        path: normalized,
        categoryIndex,
        products: pickProductsArray(categoryProductsRaw),
      };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: jsonHeaders(300),
      });
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
                if (brandN.includes(t) || categoryN.includes(t)) score += 2;
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
  // Only intercept these paths (sitemaps + indexes + products)
  const isSitemap = pathname.startsWith("/sitemap");
  const isIndexes = pathname.startsWith("/indexes/");
  const isProducts = pathname.startsWith("/products/");

  if (!isSitemap && !isIndexes && !isProducts) {
    return next();
  }

  // R2 key is path without leading slash
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

  // If the object key ends in .gz, advertise it as gzipped to avoid client-side ambiguity.
  // (Client code also has a fallback decompressor if metadata is missing.)
  if (isGZ) {
    headers["Content-Encoding"] = "gzip";
    headers["Vary"] = "Accept-Encoding";
  }

  return new Response(obj.body, { headers });
}
