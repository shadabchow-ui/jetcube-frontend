#!/usr/bin/env python3

import json
from pathlib import Path

# ---------------- CONFIG ----------------

PRODUCTS_ROOT = Path("/Users/sha/Documents/Jetcube/static/products")
OUTPUT_PATH = Path("/Users/sha/Documents/Jetcube/static/indexes/_index.json")

# ---------------------------------------

def rebuild():
    out = []
    indexed = 0
    skipped = 0

    # walk *everything* under products (batch, part, future-proof)
    for json_path in PRODUCTS_ROOT.rglob("*.json"):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                pdp = json.load(f)
        except Exception:
            skipped += 1
            continue

        slug = pdp.get("slug")
        if not slug:
            skipped += 1
            continue

        # build URL path exactly as it exists on disk
        rel_path = json_path.relative_to(PRODUCTS_ROOT)
        url_path = f"/products/{rel_path.as_posix()}"

        out.append({
            "slug": slug,
            "path": url_path,
            "title": pdp.get("title", ""),
            "asin": pdp.get("asin", ""),
            "brand": pdp.get("brand", ""),
            "category": pdp.get("category", ""),
            "category_keys": pdp.get("category_keys", []),
            "price": pdp.get("price", ""),
            "image": pdp.get("image") or pdp.get("image_url") or pdp.get("img", ""),
            "image_url": pdp.get("image_url") or pdp.get("image") or pdp.get("img", ""),
            "thumbnail": pdp.get("thumbnail") or pdp.get("image") or "",
            "img": pdp.get("img") or pdp.get("image") or "",
        })

        indexed += 1

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    print("✅ Rebuilt _index.json")
    print(f"📦 Products indexed: {indexed}")
    print(f"⚠️ PDPs skipped: {skipped}")
    print(f"📄 Output: {OUTPUT_PATH}")

if __name__ == "__main__":
    rebuild()




