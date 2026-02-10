// src/pdp/ProductPdpContext.tsx

export const R2_PUBLIC_BASE = "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev";
export const INDEX_URL = `${R2_PUBLIC_BASE}/indexes/_index.json.gz`;

let cachedIndex: any[] | null = null;

export async function loadIndex() {
  if (cachedIndex) return cachedIndex;

  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error("Failed to load _index.json.gz");

  const text = await res.text(); // browser auto-gunzips
  const json = JSON.parse(text);

  if (!Array.isArray(json)) {
    throw new Error("Index is not an array");
  }

  cachedIndex = json;
  return cachedIndex;
}

export async function fetchProductBySlug(slug: string) {
  const index = await loadIndex();
  const item = index.find((i) => i.slug === slug);

  if (!item?.path) {
    throw new Error(`Product not found in index: ${slug}`);
  }

  const url = `${R2_PUBLIC_BASE}/${item.path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed PDP fetch: ${url}`);

  return await res.json();
}














 













 





