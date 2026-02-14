// src/config/r2.ts

export type FetchJsonOptions = {
  allow404?: boolean;
  signal?: AbortSignal;
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
  return t.startsWith("<!doctype html") || t.startsWith("<html") || t.includes("<head");
}

function normalizePart(part: string): string {
  return String(part || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

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
 * Resolve base URL for public R2.
 * Safe for Vite/browser: NEVER touch `process` directly.
 */
export function getR2BaseUrl(): string {
  // Vite-style envs
  const viteEnv = (import.meta as any)?.env;
  const vite =
    viteEnv?.VITE_R2_BASE_URL ||
    viteEnv?.VITE_R2_PUBLIC_URL ||
    viteEnv?.VITE_R2_URL;

  // CRA-style envs (only if globalThis.process exists)
  const anyGlobal = globalThis as any;
  const craEnv = anyGlobal?.process?.env;
  const cra =
    craEnv?.REACT_APP_R2_BASE_URL ||
    craEnv?.REACT_APP_R2_PUBLIC_URL;

  const chosen = vite || cra;

  // Hard fallback
  return String(chosen || "https://r2.ventari.net").replace(/\/+$/, "");
}

// Backwards-compatible constant
export const R2_BASE = getR2BaseUrl();

async function parseJsonPossiblyGzipped(res: Response, url: string) {
  const enc = (res.headers.get("content-encoding") || "").toLowerCase();
  const isGzByExt = /\.gz(\?|#|$)/i.test(url);

  const buf = await res.arrayBuffer();
  const u8 = new Uint8Array(buf);

  const shouldDecompress = enc.includes("gzip") || isGzByExt;

  if (!shouldDecompress) {
    const txt = new TextDecoder("utf-8").decode(u8);
    return JSON.parse(txt);
  }

  try {
    // @ts-ignore
    const ds = new DecompressionStream("gzip");
    const stream = new Response(new Blob([u8]).stream().pipeThrough(ds));
    const txt = await stream.text();
    return JSON.parse(txt);
  } catch {
    throw new Error(
      `Failed to decompress gzip JSON for ${url}. Browser may not support DecompressionStream.`
    );
  }
}

/**
 * Backwards-compatible signatures:
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
    typeof a === "string" ? ((b || {}) as FetchJsonOptions) : ((a || {}) as FetchJsonOptions);

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
    const hint = looksLikeHtml(body) ? " (returned HTML – likely wrong URL/path)" : "";
    const prefix = label ? `${label}: ` : "";
    throw new Error(`${prefix}${res.status} ${res.statusText} for ${url}${hint}`);
  }

  return (await parseJsonPossiblyGzipped(res, url)) as T;
}
