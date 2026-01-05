import json
import re
import sys
from pathlib import Path

# Auto-detect: this file lives in .../static/indexes/
BASE_DIR = Path(__file__).resolve().parents[1]  # .../static
INDEXES_DIR = BASE_DIR / "indexes"
PRODUCT_INDEX = INDEXES_DIR / "_index.json"
OUTPUT_PATH = INDEXES_DIR / "_category_urls.json"

def _as_str(x) -> str:
    try:
        if x is None:
            return ""
        return str(x).strip()
    except Exception:
        return ""

def slugify(s: str, max_len: int = 80) -> str:
    s = _as_str(s).lower()
    if not s:
        return "other"
    s = s.replace("&", " and ")
    s = s.replace("’", "").replace("'", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    if not s:
        s = "other"
    return s[:max_len].strip("-")

def rebuild():
    if not PRODUCT_INDEX.exists():
        print(f"❌ Product index not found: {PRODUCT_INDEX}")
        sys.exit(1)

    print(f"📦 Using product index: {PRODUCT_INDEX}")
    with open(PRODUCT_INDEX, "r", encoding="utf-8") as f:
        products = json.load(f)

    # Collect unique category keys from products
    unique_keys = set()
    for p in products:
        keys = p.get("category_keys", [])
        if isinstance(keys, list):
            for k in keys:
                k = _as_str(k)
                if k:
                    unique_keys.add(k)

    items = []
    for key in sorted(unique_keys):
        parts = [x.strip() for x in key.split(" > ") if x.strip()]
        if not parts:
            continue

        top = parts[0]               # e.g. "Clothing, Shoes & Jewelry"
        leaf = parts[-1]             # e.g. "Boots"
        dept_slug = slugify(top, 60) # -> "clothing-shoes-and-jewelry"
        leaf_slug = slugify(leaf, 60)

        # IMPORTANT: NavigationSection groups by /c/{dept}/...
        url = f"/c/{dept_slug}/{leaf_slug}"

        items.append({
            "category_key": key,
            "category": leaf,
            "dept": top,
            "url": url,
            "depth": len(parts),
            # count gets filled by rebuild_category_counts.py
            "count": 0
        })

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

    print("✅ Created _category_urls.json")
    print(f"📄 Categories written: {len(items)}")
    print(f"📁 Output: {OUTPUT_PATH}")

if __name__ == "__main__":
    rebuild()

