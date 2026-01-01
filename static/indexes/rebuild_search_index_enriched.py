import json
from pathlib import Path

# PATHS
PDP_DIR = Path("/Applications/product/static/products")
OUTPUT_PATH = Path("/Applications/product/static/indexes/search_index.enriched.json")

def _as_str(x):
  try:
    if x is None:
      return ""
    return str(x).strip()
  except Exception:
    return ""

def _first_nonempty(*vals):
  for v in vals:
    s = _as_str(v)
    if s:
      return s
  return ""

def _normalize_url(u: str) -> str:
  u = _as_str(u)
  if not u:
    return ""
  if u.startswith("//"):
    return "https:" + u
  return u

def extract_first_image(pdp: dict) -> str:
  # Common single fields
  for k in ["image", "image_url", "imageUrl", "main_image", "mainImage", "thumbnail", "thumb", "primary_image"]:
    v = pdp.get(k)
    if isinstance(v, str) and v.strip():
      return _normalize_url(v)

  # images could be list[str] or list[dict]
  imgs = pdp.get("images") or pdp.get("image_urls") or pdp.get("imageUrls") or pdp.get("gallery")
  if isinstance(imgs, list):
    for it in imgs:
      if isinstance(it, str) and it.strip():
        return _normalize_url(it)
      if isinstance(it, dict):
        for kk in ["url", "src", "href", "image", "image_url", "hiRes", "large", "main"]:
          v = it.get(kk)
          if isinstance(v, str) and v.strip():
            return _normalize_url(v)

  # Sometimes nested structures
  media = pdp.get("media") or pdp.get("assets") or {}
  if isinstance(media, dict):
    for kk in ["main", "primary", "image", "thumbnail"]:
      v = media.get(kk)
      if isinstance(v, str) and v.strip():
        return _normalize_url(v)
      if isinstance(v, dict):
        for kkk in ["url", "src"]:
          vv = v.get(kkk)
          if isinstance(vv, str) and vv.strip():
            return _normalize_url(vv)

  return ""

def extract_price_text(pdp: dict) -> str:
  # Keep as text; your UI can parse if it wants
  for k in ["price", "price_text", "priceText", "current_price", "currentPrice", "sale_price", "salePrice"]:
    v = pdp.get(k)
    if isinstance(v, str) and v.strip():
      return v.strip()
    if isinstance(v, (int, float)):
      # store numeric as string
      return str(v)

  pricing = pdp.get("pricing") or {}
  if isinstance(pricing, dict):
    for k in ["price", "price_text", "current", "current_price"]:
      v = pricing.get(k)
      if isinstance(v, str) and v.strip():
        return v.strip()
      if isinstance(v, (int, float)):
        return str(v)

  return ""

def rebuild():
  if not PDP_DIR.exists():
    raise SystemExit(f"❌ PDP_DIR not found: {PDP_DIR}")

  products = []
  scanned = 0
  skipped = 0

  for fp in sorted(PDP_DIR.glob("*.json")):
    scanned += 1
    try:
      with open(fp, "r", encoding="utf-8") as f:
        pdp = json.load(f)

      if not isinstance(pdp, dict):
        skipped += 1
        continue

      slug = _first_nonempty(pdp.get("slug"), pdp.get("handle"), fp.stem)
      title = _first_nonempty(pdp.get("title"), pdp.get("product_title"), pdp.get("name"))
      brand = _first_nonempty(pdp.get("brand"), pdp.get("byline"), pdp.get("manufacturer"))
      asin = _first_nonempty(pdp.get("asin"), pdp.get("ASIN"))
      price_text = extract_price_text(pdp)
      image = extract_first_image(pdp)

      category = pdp.get("category")
      if isinstance(category, list):
        category = " > ".join([_as_str(x) for x in category if _as_str(x)])
      else:
        category = _as_str(category)

      category_keys = pdp.get("category_keys")
      if not isinstance(category_keys, list):
        category_keys = []

      searchable_bits = [
        slug, title, brand, asin, price_text, category,
        " ".join([_as_str(x) for x in category_keys if _as_str(x)]),
      ]
      searchable = " ".join([b for b in searchable_bits if b]).strip().lower()

      # IMPORTANT: include multiple aliases so your grid never misses
      out = {
        "slug": slug,
        "title": title,
        "brand": brand,
        "asin": asin,
        "category": category,
        "category_keys": category_keys,
        "price": price_text,

        # image fields (aliases)
        "image": image,
        "image_url": image,
        "thumbnail": image,
        "img": image,

        "searchable": searchable,
      }

      products.append(out)

    except Exception:
      skipped += 1
      continue

  OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, separators=(",", ":"))

  print(f"✅ Search index rebuilt: {len(products)} products")
  print(f"⚠️ PDPs skipped: {skipped}")
  print(f"📄 Written to {OUTPUT_PATH}")

if __name__ == "__main__":
  rebuild()

