/* src/config/r2.ts
   R2 helper utilities (Cloudflare Pages-safe)
   - Exports: R2_BASE, joinUrl, fetchJsonStrict
   - fetchJsonStrict supports BOTH signatures:
       fetchJsonStrict(url, opts)
       fetchJsonStrict(url, label, opts)
*/

export const DEFAULT_R2_BASE = "https://r2.ventari.net";

export function getR2BaseUrl() {
  const base =
    (import.meta as any)?.env?.VITE_R2_BASE ||
    (globalThis as any)?.VITE_R2_BASE ||
    DEFAULT_R2_BASE;

  return String(base).replace(/\/+$/, "");
}

export const R2_BASE = getR2BaseUrl();

export function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

type FetchJsonStrictOpts = {
  /** If true, return null instead of throwing on 404 */
  allow404?: boolean;

  /** Optional RequestInit to pass to fetch() */
  init?: RequestInit;

  /** Optional label for error messages */
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
    // Read a small snippet to help debugging (often HTML error pages)
    let snippet = "";
    try {
      const text = await res.text();
      snippet = text.slice(0, 220).replace(/\s+/g, " ").trim();
    } catch {
      // ignore
    }
    throw new Error(
      `[${tag}] HTTP ${res.status} for ${url}` +
        (snippet ? ` (body: ${snippet})` : ""),
    );
  }

  // Try to parse JSON even if content-type is wrong (some CDNs mislabel)
  const ct = res.headers.get("content-type") || "";
  const looksJson =
    ct.includes("application/json") ||
    /\.json(\.gz)?$/i.test(url) ||
    ct.includes("+json");

  if (looksJson) {
    try {
      return (await res.json()) as T;
    } catch (e: any) {
      // fall through to text parse
    }
  }

  const raw = await res.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    const snippet = raw.slice(0, 220).replace(/\s+/g, " ").trim();
    throw new Error(
      `[${tag}] Expected JSON but got non-JSON from ${url}` +
        (snippet ? ` (body: ${snippet})` : ""),
    );
  }
}


 
