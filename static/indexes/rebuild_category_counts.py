import json
from pathlib import Path
from collections import defaultdict
import sys

BASE_DIR = Path("/Applications/product/static")

def find_category_urls():
    matches = list(BASE_DIR.rglob("_category_urls.json"))
    if matches:
        return matches[0]

    print("❌ _category_urls.json not found.")
    print("🔍 Searched under:", BASE_DIR)
    print("\n📁 Files found in indexes/:")
    indexes_dir = BASE_DIR / "indexes"
    if indexes_dir.exists():
        for p in sorted(indexes_dir.iterdir()):
            print("   -", p.name)
    sys.exit(1)

def rebuild():
    CATEGORY_URLS_PATH = find_category_urls()
    PRODUCT_INDEX_PATH = BASE_DIR / "indexes" / "_index.json"

    if not PRODUCT_INDEX_PATH.exists():
        print(f"❌ Product index not found: {PRODUCT_INDEX_PATH}")
        sys.exit(1)

    print(f"📄 Using category file: {CATEGORY_URLS_PATH}")
    print(f"📦 Using product index: {PRODUCT_INDEX_PATH}")

    with open(CATEGORY_URLS_PATH, "r", encoding="utf-8") as f:
        categories = json.load(f)

    with open(PRODUCT_INDEX_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    counts = defaultdict(int)

    for product in products:
        keys = product.get("category_keys", [])
        if not isinstance(keys, list):
            continue
        for key in set(keys):
            counts[key] += 1

    for cat in categories:
        key = cat.get("category_key")
        cat["count"] = counts.get(key, 0)

    categories.sort(key=lambda x: (x.get("dept", ""), x.get("depth", 0), x.get("category_key", "")))

    with open(CATEGORY_URLS_PATH, "w", encoding="utf-8") as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)

    print("\n✅ Category counts rebuilt successfully")
    print(f"📄 Categories updated: {len(categories)}")
    print(f"📦 Products scanned: {len(products)}")

if __name__ == "__main__":
    rebuild()

