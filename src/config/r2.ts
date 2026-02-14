export const R2_BASE =
  'https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev';

export function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

export async function fetchJsonStrict<T>(url: string, context = "Fetch"): Promise<T> {
  const res = await fetch(url, { cache: "default" });
  
  // Guard: Reject HTML (Cloudflare SPA fallback)
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html")) {
    throw new Error(`[${context}] Expected JSON but got HTML at ${url} (Likely 404)`);
  }

  if (!res.ok) {
    throw new Error(`[${context}] HTTP ${res.status} at ${url}`);
  }

  try {
    return await res.json();
  } catch (e) {
    throw new Error(`[${context}] JSON parse failed at ${url}`);
  }
}
