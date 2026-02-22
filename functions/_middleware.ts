// functions/_middleware.ts
// Cloudflare Pages Functions middleware

export async function onRequest({ request, env, next }: any) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // ==========================================
  // 1. ABSOLUTE TOP-LEVEL BYPASS FOR PDP
  // Let functions/api/pdp/[slug].ts handle this!
  // ==========================================
  if (pathname === '/api/pdp' || pathname.startsWith('/api/pdp/')) {
    return next();
  }

  // ----------------------------
  // Helpers
  // ----------------------------
  const jsonHeaders = (cacheSeconds: number, extra: Record<string, string> = {}) => ({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': `public, max-age=${cacheSeconds}`,
    'X-Edge-MW': 'hit',
    ...extra,
  });

  function stripSlashes(s: string) {
    return String(s || '').replace(/^\/+|\/+$/g, '');
  }

  function safeDecodeURIComponent(s: string): string {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  }

  function normalizeKey(s: string): string {
    return String(s || '').replace(/^\/+/, '');
  }

  function normalizeCategoryPath(input: string): string {
    if (!input) return '';
    let s = String(input).trim();
    const idx = s.indexOf('/c/');
    if (idx !== -1) s = s.slice(idx + 3);
    s = s.replace(/^c\//, '');
    s = safeDecodeURIComponent(s);
    s = stripSlashes(s);
    s = s.toLowerCase();
    s = s.replace(/\s+/g, '-');
    s = s.replace(/-+/g, '-');
    return s;
  }

  function pickProductsArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }

  function looksGzip(key: string, obj?: any): boolean {
    const k = String(key || '').toLowerCase();
    const enc = String(obj?.httpMetadata?.contentEncoding || '').toLowerCase();
    const ct = String(obj?.httpMetadata?.contentType || '').toLowerCase();
    return k.endsWith('.gz') || enc.includes('gzip') || ct.includes('gzip');
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

    try {
      const DS: any = (globalThis as any).DecompressionStream;
      if (!DS) {
        return await new Response(obj.body).text();
      }

      const ab = await new Response(obj.body).arrayBuffer();
      const ds = new DS('gzip');
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

    if (s.startsWith('<!doctype') || s.startsWith('<html') || s.startsWith('<')) return null;

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

  // ----------------------------
  // API endpoints (Category & Search)
  // ----------------------------
  if (pathname.startsWith('/api/')) {
    // /api/category?path=...
    if (pathname === '/api/category') {
      const rawPath = (url.searchParams.get('path') || '').trim();
      const normalized = normalizeCategoryPath(rawPath);

      if (!normalized) {
        return new Response(JSON.stringify({ error: 'Missing path' }), {
          status: 400,
          headers: jsonHeaders(0),
        });
      }

      const categoryIndex =
        (await r2ReadJsonFromCandidates<any>([
          'indexes/_category_urls.json',
          'indexes/_category_urls.json.gz',
        ])) ?? null;

      const parts = stripSlashes(normalized)
        .split('/')
        .filter(Boolean)
        .map((p) => safeDecodeURIComponent(p));

      const hyphenName = `${parts.join('-')}.json`;
      const legacyName = `${parts.join('__')}.json`;

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

      if (!categoryProductsRaw) {
        const cards =
          (await r2ReadJsonFromCandidates<any>([
            'indexes/_index.cards.json',
            'indexes/_index.cards.json.gz',
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
            else if (typeof raw === 'string') push(raw);
            else if (raw && typeof raw === 'object') push(raw.path ?? raw.url ?? raw.slug);

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
    if (pathname === '/api/search') {
      const q = (url.searchParams.get('q') || '').trim();

      if (!q) {
        return new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: jsonHeaders(60),
        });
      }

      function normalize(s: string) {
        return String(s || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      const tokens = normalize(q).split(' ').filter(Boolean);

      const indexItems =
        (await r2ReadJsonFromCandidates<any[]>([
          'indexes/search_index.enriched.json',
          'indexes/search_index.enriched.json.gz',
          'products/search_index.enriched.json',
          'products/search_index.enriched.json.gz',
        ])) ?? [];

      const results = Array.isArray(indexItems)
        ? indexItems
            .map((it: any) => {
              const titleN = normalize(it?.title || '');
              const brandN = normalize(it?.brand || '');
              const categoryN = normalize(it?.category || '');
              const searchableN = normalize(it?.searchable || '');

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

    return new Response(JSON.stringify({ error: 'Unknown API route' }), {
      status: 404,
      headers: jsonHeaders(60),
    });
  }

  // ----------------------------
  // R2 proxy paths (Sitemaps / Indexes)
  // ----------------------------
  const isSitemap = pathname.startsWith('/sitemap');
  const isIndexes = pathname.startsWith('/indexes/');
  const isProductSingular = pathname.startsWith('/product/');
  const isProductsLegacy = pathname.startsWith('/products/');

  if (!isSitemap && !isIndexes && !isProductSingular && !isProductsLegacy) {
    return next();
  }

  const key = pathname.slice(1);
  const obj = await env.JETCUBE_R2?.get(key);

  if (!obj) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Edge-MW': 'hit-notfound',
      },
    });
  }

  const lowerKey = key.toLowerCase();
  const isXML = lowerKey.endsWith('.xml');
  const isJSON = lowerKey.endsWith('.json') || lowerKey.endsWith('.json.gz');
  const isGZ = lowerKey.endsWith('.gz');

  const contentType = isXML
    ? 'application/xml; charset=utf-8'
    : isJSON
      ? 'application/json; charset=utf-8'
      : 'application/octet-stream';

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=86400',
    'X-Edge-MW': 'hit',
  };

  if (isGZ) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
  }

  return new Response(obj.body, { headers });
}
