import json
from pathlib import Path
import re

# PATHS
PDP_DIR = Path("/Applications/product/static/products")
OUTPUT_PATH = Path("/Applications/product/static/indexes/_index.json")

IMG_RE = re.compile(r"https?://[^\s\"']+\.(?:jpg|jpeg|png|webp)(?:\?[^\s\"']+)?", re.IGNORECASE)

def _as_str(x):
  try:
    if x is None:
      return ""
    return str(x).strip()
  except Exception:
    return ""

def _normalize_url(u: str) -> str:
  u = _as_str(u)
  if not u:
    return ""
  if u.startswith("//"):
    return "https:" + u
  return u

def _first_nonempty(*vals):
  for v in vals:
    s = _as_str(v)
    if s:
      return s
  return ""

def find_first_image_url_anywhere(obj, depth=0, max_depth=6):
  """
  Walk the PDP and grab the first real image URL we can find.
  This survives different scraper schemas.
  """
  if depth > max_depth:
    return ""

  if isinstance(obj, str):
    s = obj.strip()
    if not s:
      return ""
    s = _normalize_url(s)
    m = IMG_RE.search(s)
    return m.group(0) if m else ""

  if isinstance(obj, list):
    for it in obj:
      found = find_first_image_url_anywhere(it, depth + 1, max_depth)
      if found:
        return found
    return ""

  if isinstance(obj, dict):
    # try common fast paths first
    for k in [
      "image", "image_url", "imageUrl", "main_image", "mainImage",
      "thumbnail", "thumb", "primary_image", "hiRes", "large"
    ]:
      v = obj.get(k)
      found = find_first_image_url_anywhere(v, depth + 1, max_depth)
      if found:
        return found

    for k in ["images", "image_urls", "imageUrls", "gallery", "media", "assets"]:
      v = obj.get(k)
      found = find_first_image_url_anywhere(v, depth + 1, max_depth)
      if found:
        return found

    # fallback: scan everything
    for _, v in obj.items():
      found = find_first_image_url_anywhere(v, depth + 1, max_depth)
      if found:
        return found

  return ""

def extract_price_text(pdp: dict) -> str:
  # Keep as text; UI can parse if it wants
  for k in ["price", "price_text", "priceText", "current_price", "currentPrice", "sale_price", "salePrice"]:
    v = pdp.get(k)
    if isinstance(v, str) and v.strip():
      return v.strip()
    if isinstance(v, (int, float)):
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

  out = []
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
      asin = _first_nonempty(pdp.get("asin"), pdp.get("ASIN"))
      brand = _first_nonempty(pdp.get("brand"), pdp.get("byline"), pdp.get("manufacturer"))

      category_keys = pdp.get("category_keys")
      if not isinstance(category_keys, list):
        category_keys = []

      category = pdp.get("category")
      if isinstance(category, list):
        category = " > ".join([_as_str(x) for x in category if _as_str(x)])
      else:
        category = _as_str(category)

      image = find_first_image_url_anywhere(pdp)
      price_text = extract_price_text(pdp)

      item = {
        "slug": slug,
        "title": title,
        "asin": asin,
        "brand": brand,
        "category": category,
        "category_keys": category_keys,
        "price": price_text,

        # IMPORTANT: image aliases so UI always finds one
        "image": image,
        "image_url": image,
        "thumbnail": image,
        "img": image,
      }

      out.append(item)

    except Exception:
      skipped += 1
      continue

  OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
  with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

  print(f"✅ Rebuilt _index.json")
  print(f"📦 Products indexed: {len(out)}")
  print(f"⚠️ PDPs skipped: {skipped}")
  print(f"📄 Output: {OUTPUT_PATH}")

if __name__ == "__main__":
  rebuild()

