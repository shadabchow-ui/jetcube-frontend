// src/r2.ts
export const R2_BASE =
  (import.meta as any).env?.VITE_R2_BASE ||
  (import.meta as any).env?.R2_BASE ||
  "https://r2.ventari.net"; // <-- set to your public R2 domain

export function joinUrl(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

async function readTextSafe(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function looksLikeHtml(body: string) {
  const s = body.trim().slice(0, 200).toLowerCase();
  return s.includes("<!doctype html") || s.includes("<html");
}

export async function fetchJsonStrict(url: string) {
  // Try .json.gz first, then .json
  const u = new URL(url);
  const tryUrls: string[] = [];

  if (u.pathname.endsWith(".json")) {
    const gz = new URL(u.toString());
    gz.pathname = gz.pathname.replace(/\.json$/i, ".json.gz");
    tryUrls.push(gz.toString());
    tryUrls.push(u.toString());
  } else {
    tryUrls.push(u.toString());
  }

  let lastErr = "";

  for (const candidate of tryUrls) {
    const res = await fetch(candidate, { cache: "no-store" });

    if (!res.ok) {
      lastErr = `${res.status} ${res.statusText} for ${candidate}`;
      continue;
    }

    const ct = (res.headers.get("content-type") || "").toLowerCase();

    // If it’s gz, parse as JSON from text (Cloudflare may not set JSON content-type)
    const body = await readTextSafe(res);

    if (looksLikeHtml(body)) {
      lastErr = `Got HTML from ${candidate} (likely wrong base/origin or missing object)`;
      continue;
    }

    try {
      return JSON.parse(body);
    } catch (e: any) {
      lastErr = `JSON parse failed for ${candidate}: ${e?.message || String(e)} (ct=${ct})`;
      continue;
    }
  }

  throw new Error(`[fetchJsonStrict] Failed. ${lastErr || `Tried: ${tryUrls.join(", ")}`}`);
}



