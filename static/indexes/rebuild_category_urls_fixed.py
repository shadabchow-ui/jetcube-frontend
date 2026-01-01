import json
import re
from pathlib import Path
from collections import OrderedDict

BASE_DIR = Path("/Applications/product/static/indexes")
PRODUCT_INDEX = BASE_DIR / "_index.json"
OUTPUT_PATH = BASE_DIR / "_category_urls.json"

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("&", "and")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")

def build_url(category_key: str) -> str:
    parts = [p.strip() for p in category_key.split(" > ")]
    dept = parts[0]
    return "/c/" + "/".join(slugify(p) for p in parts)

def rebuild():
    if not PRODUCT_INDEX.exists():
        raise FileNotFoundError(f"Missing product index: {PRODUCT_INDEX}")

    with open(PRODUCT_INDEX, "r", encoding="utf-8") as f:
        products = json.load(f)

    category_map = OrderedDict()

    for product in products:
        keys = product.get("category_keys", [])
        if not isinstance(keys, list):
            continue

        for key in keys:
            key = key.strip()
            if not key or key in category_map:
                continue

            parts = [p.strip() for p in key.split(" > ")]

            category_map[key] = {
                "category_key": key,
                "category": parts[-1],
                "dept": parts[0],
                "url": build_url(key),
                "depth": len(parts),
                "count": 0
            }

    categories = list(category_map.values())
    categories.sort(key=lambda x: (x["dept"], x["depth"], x["category_key"]))

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)

    print(f"✅ Created _category_urls.json")
    print(f"📄 Categories written: {len(categories)}")
    print(f"📁 Output: {OUTPUT_PATH}")

if __name__ == "__main__":
    rebuild()
