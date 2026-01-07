#!/usr/bin/env python3

import json
from pathlib import Path

# ---------------- CONFIG ----------------

PRODUCTS_ROOT = Path("/Users/sha/Documents/Jetcube/static/products")
OUTPUT_PATH = Path("/Users/sha/Documents/Jetcube/static/indexes/_index.json")

# Cloudflare R2 public base URL
R2_BASE_URL = "https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev"

# Write shard maps here (slug -> full R2 URL)
PDP_SHARDS_DIR = Path("/Users/sha/Documents/Jetcube/static/indexes/pdp_paths")

# ---------------------------------------

def _clean_char(c: str) -> str:
    c = (c or "").lower()
    return c if (c.isalnum()) else "_"

def _shard_key(slug: str) -> str:
    slug = slug or ""
    a = _clean_char(slug[0]) if len(slug) > 0 else "_"
    b = _clean_char(slug[1]) if len(slug) > 1 else "_"
    return f"{a}{b}"

def rebuild():
    out = []
    indexed = 0
    skipped = 0

    # key -> { slug: full_url }
    shards = {}

    for json_path in PRODUCTS_ROOT.rglob("*.json"):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                pdp = json.load(f)
        except Exception:
            skipped += 1
            continue

        # skip non-PDP JSONs
        if not isinstance(pdp, dict):
            skipped += 1
            continue

        # canonical slug
        slug = pdp.get("handle")
        if not slug:
            skipped += 1
            continue

        # build PUBLIC R2 URL
        rel_path = json_path.relative_to(PRODUCTS_ROOT)

        # ✅ FIX: normalize "part 01" → "part_01" in URL paths
        rel_path_posix = rel_path.as_posix().replace("part ", "part_")

        url_path = f"{R2_BASE_URL}/products/{rel_path_posix}"

        # ---- image normalization (robust) ----
        images = pdp.get("images")
        image_url = ""

        if isinstance(images, list) and images:
            first = images[0]
            if isinstance(first, dict):
                image_url = first.get("src", "")
        elif isinstance(images, str):
            image_url = images
        # -------------------------------------

        out.append({
            "slug": slug,
            "path": url_path,
            "title": pdp.get("title", ""),
            "asin": pdp.get("asin", ""),
            "brand": pdp.get("brand", ""),
            "category": pdp.get("category", ""),
            "category_keys": pdp.get("category_keys", []),
            "price": pdp.get("price", ""),
            "image": image_url,
        })

        k = _shard_key(slug)
        if k not in shards:
            shards[k] = {}
        shards[k][slug] = url_path

        indexed += 1

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    # Write shards
    PDP_SHARDS_DIR.mkdir(parents=True, exist_ok=True)
    shard_files = 0
    for k, mapping in shards.items():
        shard_path = PDP_SHARDS_DIR / f"{k}.json"
        with open(shard_path, "w", encoding="utf-8") as f:
            json.dump(mapping, f, ensure_ascii=False)
        shard_files += 1

    print("✅ Rebuilt _index.json")
    print(f"📦 Products indexed: {indexed}")
    print(f"⚠️ PDPs skipped: {skipped}")
    print(f"📄 Output: {OUTPUT_PATH}")
    print(f"✅ Wrote PDP shards: {shard_files}")
    print(f"📄 Shards dir: {PDP_SHARDS_DIR}")

if __name__ == "__main__":
    rebuild()








