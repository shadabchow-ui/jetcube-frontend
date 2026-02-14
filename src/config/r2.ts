export const R2_BASE =
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";

/**
 * Join a base URL (absolute or relative) with a relative path.
 * - Keeps absolute `path` values unchanged.
 * - Avoids duplicate slashes.
 */
export function joinUrl(base: string, path: string): string {
  const p = (path ?? "").toString();

  // If `path` is already absolute, keep it.
  if (/^https?:\/\//i.test(p)) return p;

  const b = (base ?? "").toString();

  // If there's no base, return a root-relative path when possible.
  if (!b) return p.startsWith("/") ? p : `/${p}`;

  const baseTrimmed = b.endsWith("/") ? b.slice(0, -1) : b;
  const pathTrimmed = p.startsWith("/") ? p.slice(1) : p;
  return `${baseTrimmed}/${pathTrimmed}`;
}

function looksLikeHtml(bodyText: string): boolean {
  const t = (bodyText ?? "").trim().toLowerCase();
  return (
    t.startsWith("<!doctype html") ||
    t.startsWith("<html") ||
    t.startsWith("<head") ||
    t.startsWith("<body")
  );
}

function isLikelyGzip(u8: Uint8Array): boolean {
  // GZIP magic number: 1F 8B
  return u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b;
}

async function maybeGunzipToText(u8: Uint8Array): Promise<string> {
  if (!isLikelyGzip(u8)) {
    return new TextDecoder("utf-8", { fatal: false }).decode(u8);
  }

  // If the object was uploaded as .json.gz without setting `Content-Encoding: gzip`,
  // browsers won't auto-decompress. Handle that case here.
  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS) {
    throw new Error(
      "Received gzipped JSON bytes, but DecompressionStream is not available in this browser."
    );
  }

  const stream = new Blob([u8]).stream().pipeThrough(new DS("gzip"));
  const ab = await new Response(stream).arrayBuffer();
  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(ab));
}

/**
 * Fetch JSON with strict safety checks:
 * - Rejects HTML fallbacks (content-type or body sniff).
 * - Supports .json.gz even when Content-Encoding is missing.
 * - Throws readable errors (no white-screen JSON parsing crashes).
 */
export async function fetchJsonStrict<T>(
  url: string,
  init?: (RequestInit & { label?: string }) | undefined
): Promise<T> {
  const { label, ...fetchInit } = init ?? {};
  const headers = new Headers(fetchInit.headers ?? undefined);

  // Prefer JSON, but allow any content-type since some R2 objects
  // may be served as application/octet-stream.
  if (!headers.has("accept")) {
    headers.set("accept", "application/json,*/*;q=0.9");
  }

  const res = await fetch(url, { ...fetchInit, headers });

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const statusLabel = `${res.status} ${res.statusText}`.trim();
  const sourceLabel = label || url;

  const ab = await res.arrayBuffer();
  let text = "";
  try {
    text = await maybeGunzipToText(new Uint8Array(ab));
  } catch (e: any) {
    throw new Error(
      `Failed to decode response body from ${sourceLabel} (${statusLabel}): ${
        e?.message || String(e)
      }`
    );
  }

  // Content-type guard (reject HTML fallbacks).
  if (
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml") ||
    looksLikeHtml(text)
  ) {
    const preview = text.trim().slice(0, 160).replace(/\s+/g, " ");
    throw new Error(
      `Expected JSON but received HTML from ${sourceLabel} (${statusLabel}). ` +
        `This usually means a 404 or SPA fallback. Preview: ${preview}`
    );
  }

  if (!res.ok) {
    const preview = text.trim().slice(0, 160).replace(/\s+/g, " ");
    throw new Error(
      `Request failed for ${sourceLabel} (${statusLabel}). Preview: ${preview}`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    const preview = text.trim().slice(0, 160).replace(/\s+/g, " ");
    throw new Error(
      `Failed to parse JSON from ${sourceLabel} (${statusLabel}). Preview: ${preview}`
    );
  }
}
