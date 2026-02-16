/* src/config/r2.ts
   R2 helper utilities (Cloudflare Pages-safe)

   Exports:
   - R2_BASE
   - joinUrl
   - fetchJsonAuto  (gz-aware, tolerant when Content-Encoding is missing)
   - fetchJsonStrict (legacy signature-compatible)
*/

export const DEFAULT_R2_BASE = "";

export function getR2BaseUrl() {
  const raw =
    (import.meta as any)?.env?.VITE_R2_BASE ??
    (globalThis as any)?.VITE_R2_BASE ??
    DEFAULT_R2_BASE;

  const cleaned = String(raw ?? "").trim().replace(/\/+$/, "");

  if (!cleaned || cleaned === "undefined" || cleaned === "null") {
    throw new Error(
      "[r2] VITE_R2_BASE is not set. Provide import.meta.env.VITE_R2_BASE (e.g. https://pub-xxxx.r2.dev).",
    );
  }

  // Hard block legacy domains
  if (/\bventari\.net\b/i.test(cleaned) || /\br2\.ventari\.net\b/i.test(cleaned)) {
    throw new Error(`[r2] Refusing legacy base URL: ${cleaned}`);
  }

  if (!/^https?:\/\//i.test(cleaned)) {
    throw new Error(`[r2] VITE_R2_BASE must be an absolute URL (got: ${cleaned}).`);
  }

  return cleaned;
}

export const R2_BASE = getR2BaseUrl();

export function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

export type FetchJsonAutoOpts = {
  allow404?: boolean;
  init?: RequestInit;
};

/**
 * Fetch JSON and parse it, supporting .json.gz objects even if Content-Encoding is missing.
 * Returns null when allow404 is true and the server returns 404.
 */
export async function fetchJsonAuto<T = any>(
  url: string,
  label: string,
  opts: FetchJsonAutoOpts = {},
): Promise<T | null> {
  const res = await fetch(url, {
    ...opts.init,
    headers: {
      Accept: "application/json, text/plain, */*",
      ...(opts.init?.headers || {}),
    },
  });

  if (opts.allow404 && res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`[${label}] HTTP ${res.status} for ${url}`);
  }

  const contentEncoding = (res.headers.get("content-encoding") || "").toLowerCase();
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const looksGz =
    url.toLowerCase().endsWith(".gz") ||
    contentType.includes("application/gzip") ||
    contentType.includes("application/x-gzip");

  // If it's not a gz file, or the server correctly indicates gzip encoding, a normal read is safe.
  if (!looksGz || contentEncoding.includes("gzip")) {
    const txt = await res.text();
    return txt ? (JSON.parse(txt) as T) : (null as any);
  }

  // Some R2 public buckets may serve *.json.gz without Content-Encoding: gzip.
  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS) {
    throw new Error(
      `[${label}] ${url} appears gzipped but is missing Content-Encoding: gzip, and DecompressionStream is not available in this browser.`,
    );
  }

  const ab = await res.arrayBuffer();
  const ds = new DS("gzip");
  const decompressedStream = new Blob([ab]).stream().pipeThrough(ds);
  const txt = await new Response(decompressedStream).text();
  return txt ? (JSON.parse(txt) as T) : (null as any);
}

type FetchJsonStrictOpts = {
  allow404?: boolean;
  init?: RequestInit;
  label?: string;
};

function normalizeFetchArgs(
  url: string,
  arg2?: string | FetchJsonStrictOpts,
  arg3?: FetchJsonStrictOpts,
) {
  let label: string | undefined;
  let opts: FetchJsonStrictOpts | undefined;

  if (typeof arg2 === "string") {
    label = arg2;
    opts = arg3;
  } else {
    opts = arg2;
  }

  return {
    url,
    label: opts?.label || label,
    opts: opts || {},
  };
}

/**
 * Fetch JSON with strict erroring, but supports allow404 => null.
 * Backwards compatible with older code that calls:
 *   fetchJsonStrict(url, "Label", { allow404: true })
 */
export async function fetchJsonStrict<T = any>(
  url: string,
  opts?: FetchJsonStrictOpts,
): Promise<T>;
export async function fetchJsonStrict<T = any>(
  url: string,
  label?: string,
  opts?: FetchJsonStrictOpts,
): Promise<T>;
export async function fetchJsonStrict<T = any>(
  url: string,
  arg2?: string | FetchJsonStrictOpts,
  arg3?: FetchJsonStrictOpts,
): Promise<T> {
  const { label, opts } = normalizeFetchArgs(url, arg2, arg3);
  const tag = label || "fetchJsonStrict";

  const init: RequestInit = {
    ...opts.init,
    headers: {
      Accept: "application/json, text/plain, */*",
      ...(opts.init?.headers || {}),
    },
  };

  const res = await fetch(url, init);

  if (res.status === 404 && opts.allow404) {
    return null as any;
  }

  if (!res.ok) {
    let snippet = "";
    try {
      const text = await res.text();
      snippet = text.slice(0, 220).replace(/\s+/g, " ").trim();
    } catch {
      // ignore
    }
    throw new Error(
      `[${tag}] HTTP ${res.status} for ${url}` + (snippet ? ` (body: ${snippet})` : ""),
    );
  }

  const ct = res.headers.get("content-type") || "";
  const looksJson =
    ct.includes("application/json") || /\.json(\.gz)?$/i.test(url) || ct.includes("+json");

  if (looksJson) {
    try {
      return (await res.json()) as T;
    } catch {
      // fall through to text parse
    }
  }

  const rawText = await res.text();
  try {
    return JSON.parse(rawText) as T;
  } catch {
    const snippet = rawText.slice(0, 220).replace(/\s+/g, " ").trim();
    throw new Error(
      `[${tag}] Expected JSON but got non-JSON from ${url}` + (snippet ? ` (body: ${snippet})` : ""),
    );
  }
}



 
