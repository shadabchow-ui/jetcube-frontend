// src/config/r2.ts

export type FetchJsonOptions = {
  /**
   * If true, a 404 returns null instead of throwing.
   */
  allow404?: boolean;

  /**
   * Abort signal support.
   */
  signal?: AbortSignal;

  /**
   * Extra headers if needed (rare for public R2).
   */
  headers?: Record<string, string>;
};

/**
 * Joins URL parts safely without producing `//` or dropping path segments.
 */
export function joinUrl(base: string, ...parts: string[]): string {
  const b = String(base || "").trim();
  if (!b) throw new Error("joinUrl: base is empty");

  const baseUrl = b.endsWith("/") ? b.slice(0, -1) : b;

  const cleaned = parts
    .filter((p) => p !== undefined && p !== null)
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0)
    .map((p) => p.replace(/^\/+/, "").replace(/\/+$/, ""));

  return [baseUrl, ...cleaned].join("/");
}

/**
 * Prefer an env-provided base. Fallback to your custom domain.
 * Update fallback if your domain changes.
 */
export function getR2BaseUrl(): string {
  // Vite-style envs:
  const vite =
    (import.meta as any)?.env?.VITE_R2_PUBLIC_BASE ||
    (import.meta as any)?.env?.VITE_R2_PUBLIC_URL ||
    (import.meta as any)?.env?.VITE_R2_BASE_URL;

  // CRA-style envs (if applicable):
  const cra =
    (process as any)?.env?.REACT_APP_R2_PUBLIC_BASE ||
    (process as any)?.env?.REACT_APP_R2_PUBLIC_URL ||
    (process as any)?.env?.REACT_APP_R2_BASE_URL;

  const raw = (vite || cra || "").trim();

  // ✅ Fallback to your custom domain (based on your screenshot)
  const fallback = "https://r2.ventari.net";

  const base = raw || fallback;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function readBodyText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function looksLikeHtml(text: string): boolean {
  const t = (text || "").trim().toLowerCase();
  return t.startsWith("<!doctype html") || t.startsWith("<html") || t.includes("<head");
}

async function parseJsonPossiblyGzipped(res: Response, url: string): Promise<any> {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const contentEncoding = (res.headers.get("content-encoding") || "").toLowerCase();
  const isGzByHeader = contentEncoding.includes("gzip") || contentType.includes("application/gzip");
  const isGzByName = url.toLowerCase().endsWith(".gz");

  // If it’s normal JSON, parse directly.
  if (!isGzByHeader && !isGzByName) {
    const text = await readBodyText(res);

    // If we got HTML, surface a clearer error.
    if (looksLikeHtml(text)) {
      throw new Error(
        `fetchJsonStrict: Expected JSON but got HTML from ${url}. ` +
          `This usually means a 404/403 or wrong base URL/path.`
      );
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`fetchJsonStrict: Invalid JSON from ${url} (${String(e)})`);
    }
  }

  // Gzip path:
  // If server set Content-Encoding:gzip, browsers *may* already decode,
  // but for R2 objects served as .json.gz without encoding headers, we must decode ourselves.
  const buf = await res.arrayBuffer();

  // If DecompressionStream exists, use it (modern Chromium/Safari).
  if (typeof (globalThis as any).DecompressionStream === "function") {
    try {
      const ds = new (globalThis as any).DecompressionStream("gzip");
      const decompressedStream = new Response(
        new Blob([buf]).stream().pipeThrough(ds)
      ).body;

      if (!decompressedStream) {
        throw new Error("DecompressionStream returned empty body");
      }

      const decompressedText = await new Response(decompressedStream).text();

      if (looksLikeHtml(decompressedText)) {
        throw new Error(
          `fetchJsonStrict: Expected gzipped JSON but got HTML from ${url}. ` +
            `Likely wrong key/path or 404.`
        );
      }

      return JSON.parse(decompressedText);
    } catch (e) {
      throw new Error(`fetchJsonStrict: Gzip decode failed for ${url} (${String(e)})`);
    }
  }

  // No DecompressionStream support
  throw new Error(
    `fetchJsonStrict: Response appears gzipped (${url}) but DecompressionStream is unavailable. ` +
      `Fix by setting object metadata Content-Encoding:gzip on R2, or serve plain .json.`
  );
}

/**
 * Fetch JSON from a URL. If it’s a .json.gz object (or served as gzip), it will decode.
 * If it gets HTML, it throws a useful error.
 */
export async function fetchJsonStrict<T = any>(
  url: string,
  opts: FetchJsonOptions = {}
): Promise<T | null> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json,text/plain,*/*",
      ...(opts.headers || {}),
    },
    signal: opts.signal,
  });

  if (res.status === 404 && opts.allow404) return null;

  if (!res.ok) {
    const body = await readBodyText(res);
    const hint = looksLikeHtml(body)
      ? " (returned HTML – likely wrong URL/path or blocked)"
      : "";
    throw new Error(`fetchJsonStrict: ${res.status} ${res.statusText} for ${url}${hint}`);
  }

  return (await parseJsonPossiblyGzipped(res, url)) as T;
}

/**
 * Convenience: tries `<path>.json` then `<path>.json.gz`.
 * Useful when your bucket stores gzipped objects but code sometimes requests .json.
 */
export async function fetchJsonWithGzipFallback<T = any>(
  baseUrl: string,
  keyWithoutExt: string,
  opts: FetchJsonOptions = {}
): Promise<T> {
  const jsonUrl = joinUrl(baseUrl, `${keyWithoutExt}.json`);
  const gzUrl = joinUrl(baseUrl, `${keyWithoutExt}.json.gz`);

  const a = await fetchJsonStrict<T>(jsonUrl, { ...opts, allow404: true });
  if (a !== null) return a;

  const b = await fetchJsonStrict<T>(gzUrl, { ...opts, allow404: false });
  return b as T;
}

