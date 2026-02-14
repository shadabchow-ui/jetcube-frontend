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

export function joinUrl(baseUrl: string, ...parts: string[]): string {
  const base = (baseUrl || "").replace(/\/+$/, "");
  const cleaned = parts
    .filter(Boolean)
    .map((p) => String(p).replace(/^\/+/, "").replace(/\/+$/, ""));
  return [base, ...cleaned].join("/");
}

/**
 * Prefer an env-provided base. Fallback to your custom domain.
 * NOTE: Avoid referencing `process.env` in Vite/browser builds.
 */
export function getR2BaseUrl(): string {
  const env = ((import.meta as any)?.env || {}) as Record<string, string | undefined>;

  const raw =
    (env.VITE_R2_PUBLIC_BASE ||
      env.VITE_R2_PUBLIC_URL ||
      env.VITE_R2_BASE_URL ||
      "").trim();

  // ✅ Fallback to your custom domain (matches your R2 “Custom Domains” screenshot)
  const fallback = "https://r2.ventari.net";

  return raw || fallback;
}

/**
 * Backwards-compatible constant used across the codebase.
 * (Several components import { R2_BASE } directly.)
 */
export const R2_BASE: string = getR2BaseUrl();

function looksLikeHtml(text: string): boolean {
  const t = (text || "").trim().toLowerCase();
  return t.startsWith("<!doctype html") || t.startsWith("<html") || t.includes("<head");
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * Fetch JSON with strict error messages when R2 returns HTML/404/etc.
 * Supports allow404 => return null on 404.
 */
export async function fetchJsonStrict<T = any>(
  url: string,
  opts: FetchJsonOptions = {}
): Promise<T | null> {
  const res = await fetch(url, {
    signal: opts.signal,
    headers: {
      accept: "application/json,text/plain,*/*",
      ...(opts.headers || {}),
    },
  });

  if (res.status === 404 && opts.allow404) return null;

  if (!res.ok) {
    const body = await safeReadText(res);
    throw new Error(
      `[fetchJsonStrict] ${res.status} ${res.statusText} for ${url}` +
        (body ? `\nBody (first 200): ${body.slice(0, 200)}` : "")
    );
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();

  // If it claims JSON, use res.json()
  if (contentType.includes("application/json") || contentType.includes("json")) {
    return (await res.json()) as T;
  }

  // Otherwise read as text and try to parse; detect HTML clearly.
  const text = await safeReadText(res);

  if (looksLikeHtml(text)) {
    throw new Error(
      `[fetchJsonStrict] Expected JSON but got HTML at ${url} (likely 404 fallback or wrong R2 path).`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `[fetchJsonStrict] Expected JSON but got non-JSON content at ${url} (content-type: ${contentType || "unknown"}).`
    );
  }
}


