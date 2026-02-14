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

async function readBodyText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function looksLikeHtml(text: string): boolean {
  const t = (text || "").trim().toLowerCase();
  return (
    t.startsWith("<!doctype html") ||
    t.startsWith("<html") ||
    t.includes("<head")
  );
}

function normalizePart(part: string): string {
  return String(part || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

/**
 * Join URL parts safely without double slashes.
 */
export function joinUrl(base: string, ...parts: string[]): string {
  const b = String(base || "").trim().replace(/\/+$/, "");
  const rest = parts
    .filter((p) => p !== undefined && p !== null)
    .map((p) => normalizePart(String(p)))
    .filter(Boolean)
    .join("/");

  if (!b) return `/${rest}`;
  if (!rest) return b;
  return `${b}/${rest}`;
}

/**
 * Resolve the base URL to your public R2 endpoint.
 * Priority: env var (Vite) → env var (CRA) → hard fallback.
 */
export function getR2BaseUrl(): string {
  // Vite-style envs
  const vite =
    (import.meta as any)?.env?.VITE_R2_BASE_URL ||
    (import.meta as any)?.env?.VITE_R2_PUBLIC_URL ||
    (import.meta as any)?.env?.VITE_R2_URL;

  // CRA-style envs
  const cra =
    (process as any)?.env?.REACT_APP_R2_BASE_URL ||
    (process as any)?.env?.REACT_APP_R2_PUBLIC_URL;

  const chosen = vite || cra;

  // Hard fallback: your custom domain (matches your screenshots)
  return String(chosen || "https://r2.ventari.net").replace(/\/+$/, "");
}

// Backwards-compatible constant used across the app
export const R2_BASE = getR2BaseUrl();

async function parseJsonPossiblyGzipped(res: Response, url: string) {
  // If server says gzip explicitly, try to decompress
  const enc = (res.headers.get("content-encoding") || "").toLowerCase();

  // Some R2 objects are stored as .json.gz but may not set content-encoding,
  // so also detect by file extension.
  const isGzByExt = /\.gz(\?|#|$)/i.test(url);

  const buf = await res.arrayBuffer();
  const u8 = new Uint8Array(buf);

  const shouldDecompress = enc.includes("gzip") || isGzByExt;

  if (!shouldDecompress) {
    // normal JSON
    const txt = new TextDecoder("utf-8").decode(u8);
    return JSON.parse(txt);
  }

  // Decompress gzip in-browser via DecompressionStream
  // (supported in modern Chromium + Safari 17+)
  try {
    // @ts-ignore
    const ds = new DecompressionStream("gzip");
    const stream = new Response(
      new Blob([u8]).stream().pipeThrough(ds)
    );
    const txt = await stream.text();
    return JSON.parse(txt);
  } catch (e) {
    // If decompression isn't available, surface a meaningful error
    throw new Error(
      `Failed to decompress gzip JSON for ${url}. Your browser may not support DecompressionStream.`
    );
  }
}

/**
 * STRICT JSON fetch with helpful error messages.
 * Backwards compatible with these call styles:
 *  - fetchJsonStrict(url)
 *  - fetchJsonStrict(url, { allow404: true })
 *  - fetchJsonStrict(url, "Label")
 *  - fetchJsonStrict(url, "Label", { allow404: true })
 */
export async function fetchJsonStrict<T = any>(
  url: string,
  opts?: FetchJsonOptions
): Promise<T | null>;
export async function fetchJsonStrict<T = any>(
  url: string,
  label?: string,
  opts?: FetchJsonOptions
): Promise<T | null>;
export async function fetchJsonStrict<T = any>(
  url: string,
  a: any = {},
  b: any = undefined
): Promise<T | null> {
  const label = typeof a === "string" ? (a as string) : undefined;
  const opts: FetchJsonOptions =
    typeof a === "string"
      ? ((b || {}) as FetchJsonOptions)
      : ((a || {}) as FetchJsonOptions);

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
    const prefix = label ? `${label}: ` : "";
    throw new Error(`${prefix}${res.status} ${res.statusText} for ${url}${hint}`);
  }

  return (await parseJsonPossiblyGzipped(res, url)) as T;
}

/**
 * Convenience fetch helper:
 * try key.json, then key.json.gz (common for R2 stored gz JSON).
 * `key` should be a path WITHOUT extension.
 */
export async function fetchJsonWithGzipFallback<T = any>(
  baseUrl: string,
  key: string,
  opts: FetchJsonOptions = {}
): Promise<T | null> {
  const jsonUrl = joinUrl(baseUrl, `${key}.json`);
  const gzUrl = joinUrl(baseUrl, `${key}.json.gz`);

  const a = await fetchJsonStrict<T>(jsonUrl, "JSON fetch", { ...opts, allow404: true });
  if (a !== null) return a;

  const b = await fetchJsonStrict<T>(gzUrl, "GZ JSON fetch", { ...opts, allow404: true });
  return b;
}


