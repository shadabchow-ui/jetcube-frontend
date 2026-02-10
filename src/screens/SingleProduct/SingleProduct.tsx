import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { R2_PUBLIC_BASE, useProductPdpContext } from "../../pdp/ProductPdpContext";

export default function SingleProduct() {
  const { slug } = useParams();
  const { loadIndexOnce, loadPdpShard, fetchJson } = useProductPdpContext();

  const [product, setProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!slug) return;
        setError(null);
        setProduct(null);

        const handle = slug.trim();
        console.log("[SingleProduct] Loading handle:", handle);

        let path: string | null = null;

        // 1. Try Shard Lookup (Fast path)
        const shardKey = handle.slice(0, 2).toLowerCase();
        // Regex validation ensures we don't request invalid keys
        if (/^[a-z0-9_-]{2}$/.test(shardKey)) {
          const shard = await loadPdpShard(shardKey);
          if (shard && shard[handle]) {
            path = shard[handle];
            console.log("[SingleProduct] Found path in shard:", path);
          }
        }

        // 2. Fallback to Global Index (Slow path)
        if (!path) {
          console.log("[SingleProduct] Shard miss, checking global index...");
          const index = await loadIndexOnce();
          const item = index.find((i: any) => i.slug === handle);
          if (item && item.path) {
            path = item.path;
            console.log("[SingleProduct] Found path in global index:", path);
          }
        }

        if (!path) {
          throw new Error(`Product "${handle}" not found in shard or index.`);
        }

        // 3. Fetch Product JSON
        // Robust path joining to prevent double slashes
        const baseUrl = R2_PUBLIC_BASE.replace(/\/+$/, "");
        const relativePath = path.replace(/^\/+/, "");
        const url = `${baseUrl}/${relativePath}`;
        
        console.log("[SingleProduct] Fetching JSON:", url);
        const data = await fetchJson(url);

        if (!cancelled) {
          setProduct(data);
          console.log("[SingleProduct] Product loaded successfully");
        }
      } catch (e: any) {
        console.error("[SingleProduct] Error:", e);
        if (!cancelled) setError(e.message || "Failed to load product");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, loadIndexOnce, loadPdpShard, fetchJson]);

  if (error) return <div style={{ padding: 40, color: "red" }}>{error}</div>;
  if (!product) return <div style={{ padding: 40 }}>Loading…</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>{product.title}</h1>
      <pre style={{ maxWidth: 900, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}






























