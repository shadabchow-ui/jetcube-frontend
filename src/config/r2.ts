// src/config/r2.ts

export const R2_BASE_URL: string =
  (import.meta as any).env?.VITE_R2_BASE_URL ||
  (import.meta as any).env?.VITE_R2_PUBLIC_BASE ||
  'https://r2.ventari.net';

export function joinUrl(base: string, ...parts: string[]) {
  const all = [base, ...parts]
    .filter(Boolean)
    .map((s) => String(s))
    .map((s, i) => (i === 0 ? s.replace(/\/+$/g, '') : s.replace(/^\/+|\/+$/g, '')));
  return all.join('/');
}

function looksGzipped(url: string, contentType: string | null, contentEncoding: string | null) {
  if (url.endsWith('.gz')) return true;
  if (contentEncoding && contentEncoding.toLowerCase().includes('gzip')) return true;
  if (contentType && contentType.toLowerCase().includes('gzip')) return true;
  return false;
}

async function readBodyAsTextPossiblyGzip(res: Response, url: string): Promise<string> {
  const ct = res.headers.get('content-type');
  const ce = res.headers.get('content-encoding');

  if (!looksGzipped(url, ct, ce)) {
    return await res.text();
  }

  const buf = await res.arrayBuffer();

  // Modern browser gzip decode (no dependency)
  // Cloudflare Pages visitors will generally have this available.
  if (typeof (globalThis as any).DecompressionStream !== 'undefined') {
    const ds = new (globalThis as any).DecompressionStream('gzip');
    const stream = new Blob([buf]).stream().pipeThrough(ds);
    return await new Response(stream).text();
  }

  // If DecompressionStream isn't available, fail loudly with a clear message.
  throw new Error(
    `Response appears gzipped but DecompressionStream is not available in this browser. URL=${url}`
  );
}

export async function fetchJsonStrict<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const preview = await res.text().catch(() => '');
    throw new Error(
      `fetchJsonStrict: ${res.status} ${res.statusText} for ${url}\n` +
        (preview ? `Body preview:\n${preview.slice(0, 300)}` : '')
    );
  }

  const text = await readBodyAsTextPossiblyGzip(res, url);

  // Guard against HTML error pages masquerading as 200s
  const trimmed = text.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    throw new Error(`fetchJsonStrict: Expected JSON but got HTML for ${url}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (e: any) {
    throw new Error(`fetchJsonStrict: Invalid JSON from ${url}: ${e?.message || String(e)}`);
  }
}

