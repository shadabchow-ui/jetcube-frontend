import json
from pathlib import Path

PDP_DIR = Path("/Applications/product/static/products")

def extract_category_keys(pdp):
    # 1️⃣ Already normalized
    if isinstance(pdp.get("category_keys"), list):
        return pdp["category_keys"]

    # 2️⃣ Breadcrumb array
    bc = pdp.get("breadcrumb")
    if isinstance(bc, list) and len(bc) >= 2:
        return [" > ".join(bc)]

    # 3️⃣ Single category string
    cat = pdp.get("category")
    if isinstance(cat, str) and ">" in cat:
        return [cat.strip()]

    # 4️⃣ Categories list
    cats = pdp.get("categories")
    if isinstance(cats, list) and cats:
        return [c.strip() for c in cats if isinstance(c, str)]

    return None

def normalize():
    updated = 0
    skipped = 0

    for pdp_file in PDP_DIR.glob("*.json"):
        try:
            with open(pdp_file, "r", encoding="utf-8") as f:
                raw = json.load(f)
        except Exception:
            skipped += 1
            continue

        # Handle list-wrapped PDPs
        if isinstance(raw, list) and raw:
            pdp = raw[0]
        elif isinstance(raw, dict):
            pdp = raw
        else:
            skipped += 1
            continue

        keys = extract_category_keys(pdp)
        if not keys:
            skipped += 1
            continue

        pdp["category_keys"] = keys

        with open(pdp_file, "w", encoding="utf-8") as f:
            json.dump(raw, f, indent=2, ensure_ascii=False)

        updated += 1

    print(f"✅ PDPs updated with category_keys: {updated}")
    print(f"⚠️ PDPs skipped: {skipped}")

if __name__ == "__main__":
    normalize()
