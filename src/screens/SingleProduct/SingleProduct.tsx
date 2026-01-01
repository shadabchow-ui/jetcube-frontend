import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { ProductPdpProvider } from "../../pdp/ProductPdpContext";

// Rufus assistant (LEFT drawer + launcher)
import {
  AssistantContextProvider,
  AssistantDrawer,
  AssistantLauncher,
} from "../../components/RufusAssistant";

// Import whole modules so we can support BOTH default + named exports safely
import * as HeroModule from "./sections/ProductHeroSection";
import * as DetailsModule from "./sections/ProductDetailsSection";
import * as BreadcrumbModule from "./sections/ProductBreadcrumb";

type AnyComponent = React.ComponentType<any>;

function pickComponent(mod: any, preferredName: string): AnyComponent | null {
  const named = mod?.[preferredName];
  const def = mod?.default;
  return (named || def || null) as AnyComponent | null;
}

function normalizeId(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return "";
  return s.endsWith(".json") ? s.slice(0, -5) : s;
}

// Support /p/<id>, /products/<id>.json, and accidental /products<id>
function getIdFromPathname(pathname: string): string {
  const p = pathname || "";

  let m = p.match(/^\/p\/([^/?#]+)/);
  if (m?.[1]) return decodeURIComponent(normalizeId(m[1]));

  m = p.match(/^\/products\/([^/?#]+)/);
  if (m?.[1]) return decodeURIComponent(normalizeId(m[1]));

  m = p.match(/^\/products([^/?#]+)/);
  if (m?.[1]) return decodeURIComponent(normalizeId(m[1]).replace(/^\/+/, ""));

  return "";
}

function isLikelyAsin(id: string) {
  return /^[A-Za-z0-9]{10}$/.test(id || "");
}

function isBlockedId(id: string) {
  const s = (id || "").trim().toLowerCase();
  return (
    s === "unknownasin" ||
    s === "product" ||
    s === "_index" ||
    s === "_asin_map"
  );
}

function buildProductsBaseUrl(): string {
  return new URL(`/products/`, window.location.origin).toString();
}

function buildProductJsonUrl(productId: string): string {
  return new URL(`${productId}.json`, buildProductsBaseUrl()).toString();
}

function buildAsinMapUrl(): string {
  return new URL(`_asin_map.json`, buildProductsBaseUrl()).toString();
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return { ok: false as const, status: res.status, data: null, text: "" };
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const preview = (await res.text()).slice(0, 180);
    return { ok: false as const, status: 200, data: null, text: preview };
  }

  const data = await res.json();
  return { ok: true as const, status: 200, data, text: "" };
}

export const SingleProduct = (): JSX.Element => {
  const params = useParams();
  const paramId =
    typeof (params as any)?.id === "string" ? (params as any).id : "";

  const pathId = useMemo(
    () => getIdFromPathname(window.location.pathname),
    []
  );
  const productId = useMemo(
    () => normalizeId(paramId || pathId),
    [paramId, pathId]
  );

  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const ProductHeroSection = useMemo(
    () => pickComponent(HeroModule, "ProductHeroSection"),
    []
  );
  const ProductDetailsSection = useMemo(
    () => pickComponent(DetailsModule, "ProductDetailsSection"),
    []
  );
  const ProductBreadcrumb = useMemo(
    () => pickComponent(BreadcrumbModule, "ProductBreadcrumb"),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      setProduct(null);

      if (!productId) {
        setError("Missing product id in URL.");
        return;
      }

      if (isBlockedId(productId)) {
        setError("Invalid product id.");
        return;
      }

      const candidates: string[] = [productId];
      if (isLikelyAsin(productId)) {
        const up = productId.toUpperCase();
        if (up !== productId) candidates.push(up);
      }

      try {
        // 1) Try direct JSON by id / asin first
        for (const id of candidates) {
          const r = await fetchJson(buildProductJsonUrl(id));
          if (r.ok) {
            if (!cancelled) setProduct(r.data);
            return;
          }

          const preview = r.text || "";
          const looksLikeSpaHtml =
            preview.includes("<!DOCTYPE html") ||
            preview.includes("<html") ||
            preview.includes("@react-refresh") ||
            preview.includes("RefreshRuntime");

          if (r.status !== 404 && preview && !looksLikeSpaHtml) {
            if (!cancelled)
              setError(`Expected JSON but got non-JSON: ${preview}`);
            return;
          }

          // If it's SPA HTML fallback, treat it like "not found" and keep trying
        }

        // 2) Fallback: try ASIN -> filename map
        const mapRes = await fetchJson(buildAsinMapUrl());
        if (mapRes.ok && mapRes.data && typeof mapRes.data === "object") {
          const map = mapRes.data as Record<string, string>;

          const mapped =
            map[productId] ||
            map[productId.toUpperCase()] ||
            map[productId.toLowerCase()];

          if (mapped && !isBlockedId(mapped)) {
            // Try mapped id in a few forms (some maps store base filenames, some store asins, etc.)
            const mappedCandidates: string[] = [mapped];

            const mNorm = normalizeId(mapped);
            if (mNorm && mNorm !== mapped) mappedCandidates.unshift(mNorm);

            const mLower = mNorm.toLowerCase();
            const mUpper = mNorm.toUpperCase();
            if (mLower && !mappedCandidates.includes(mLower))
              mappedCandidates.push(mLower);
            if (mUpper && !mappedCandidates.includes(mUpper))
              mappedCandidates.push(mUpper);

            for (const mid of mappedCandidates) {
              if (!mid || isBlockedId(mid)) continue;

              const r2 = await fetchJson(buildProductJsonUrl(mid));
              if (r2.ok) {
                if (!cancelled) setProduct(r2.data);
                return;
              }

              const preview2 = r2.text || "";
              const looksLikeSpaHtml2 =
                preview2.includes("<!DOCTYPE html") ||
                preview2.includes("<html") ||
                preview2.includes("@react-refresh") ||
                preview2.includes("RefreshRuntime");

              if (r2.status !== 404 && preview2 && !looksLikeSpaHtml2) {
                if (!cancelled)
                  setError(`Expected JSON but got non-JSON: ${preview2}`);
                return;
              }
              // Otherwise: treat as not found and try next mapped candidate
            }
          }
        }

        if (!cancelled) setError("Failed to load product (404).");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Unknown error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <AssistantContextProvider>
      <div className="bg-white text-black">
        {!product && !error && (
          <div className="w-full px-6 py-10">Loading product…</div>
        )}

        {!!error && (
          <div className="w-full px-6 py-10 text-red-600">{error}</div>
        )}

        {product && (
          <ProductPdpProvider product={product}>
            {ProductBreadcrumb ? <ProductBreadcrumb /> : null}
            {ProductHeroSection ? <ProductHeroSection /> : null}
            {ProductDetailsSection ? <ProductDetailsSection /> : null}
          </ProductPdpProvider>
        )}

        {/* Rufus UI */}
        <AssistantDrawer />
        <AssistantLauncher label="Ask" />
      </div>
    </AssistantContextProvider>
  );
};

export default SingleProduct;


