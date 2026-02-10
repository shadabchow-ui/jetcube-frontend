import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

// Base URL for PDP shard indexes (kept here for visibility; actual loading happens via ProductPdpContext)
const PDP_INDEX_BASE_URL =
  (import.meta as any).env?.VITE_PDP_INDEX_BASE_URL ||
  "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev/indexes/pdp2/";

// Prevent TypeScript noUnusedLocals from failing builds in strict configs.
void PDP_INDEX_BASE_URL;

type ProductJson = any;

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function fetchGzipJson(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();

  const buf = await res.arrayBuffer();
  try {
    const text = new TextDecoder("utf-8").decode(buf);
    const parsed = safeParseJson(text);
    if (parsed) return parsed;
  } catch {}

  if (typeof (window as any).DecompressionStream === "function") {
    const ds = new (window as any).DecompressionStream("gzip");
    const stream = new Blob([buf]).stream().pipeThrough(ds);
    const decompressed = await new Response(stream).arrayBuffer();
    const text = new TextDecoder("utf-8").decode(decompressed);
    return JSON.parse(text);
  }

  throw new Error("Unable to parse JSON (gzip bytes without decompression support).");
}

import { useProductPdp } from "../../pdp/ProductPdpContext";

export default function SingleProduct() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { preloadShardForSlug, getUrlForSlug } = useProductPdp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductJson | null>(null);

  const normalizedSlug = useMemo(() => (slug || "").trim(), [slug]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!normalizedSlug) return;

      setLoading(true);
      setError(null);
      setProduct(null);

      try {
        await preloadShardForSlug(normalizedSlug);

        const url = await getUrlForSlug(normalizedSlug);
        if (!url) {
          throw new Error("Product not found");
        }

        const json = await fetchGzipJson(url);
        if (cancelled) return;

        setProduct(json);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Product failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [normalizedSlug, preloadShardForSlug, getUrlForSlug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "24px" }}>
        <div style={{ opacity: 0.8 }}>Loading product…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: "24px" }}>
        <div
          style={{
            background: "rgba(255, 0, 0, 0.08)",
            border: "1px solid rgba(255, 0, 0, 0.25)",
            padding: "12px 14px",
            borderRadius: "10px",
            marginBottom: "14px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Product failed to load</div>
          <div style={{ opacity: 0.9 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: "24px" }}>
        <div
          style={{
            background: "rgba(255, 0, 0, 0.08)",
            border: "1px solid rgba(255, 0, 0, 0.25)",
            padding: "12px 14px",
            borderRadius: "10px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Product failed to load</div>
          <div style={{ opacity: 0.9 }}>Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "24px" }}>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}



















