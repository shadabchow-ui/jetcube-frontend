import json
import sys
from pathlib import Path

# Auto-detect: this file lives in .../static/indexes/
BASE_DIR = Path(__file__).resolve().parents[1]  # .../static
PDP_ROOT = BASE_DIR / "products"

def _as_str(x) -> str:
    try:
        if x is None:
            return ""
        return str(x).strip()
    except Exception:
        return ""

def normalize():
    if not PDP_ROOT.exists():
        raise SystemExit(f"❌ PDP_ROOT not found: {PDP_ROOT}")

    changed = 0
    scanned = 0
    skipped = 0

    # scan recursively (batch folders)
    for fp in sorted(PDP_ROOT.rglob("*.json")):
        # skip maps/index-like json files if present
        name = fp.name.lower()
        if name in ("_asin_map.json", "asin_map.json", "_index.json", "search_index.enriched.json"):
            continue

        scanned += 1
        try:
            with open(fp, "r", encoding="utf-8") as f:
                pdp = json.load(f)

            if not isinstance(pdp, dict):
                skipped += 1
                continue

            before_cat = pdp.get("category")
            before_keys = pdp.get("category_keys")

            # normalize category to "A > B > C" string
            cat = pdp.get("category")
            if isinstance(cat, list):
                cat_str = " > ".join([_as_str(x) for x in cat if _as_str(x)])
            else:
                cat_str = _as_str(cat)

            if cat_str:
                pdp["category"] = cat_str

            # normalize category_keys to list[str]
            keys = pdp.get("category_keys")
            if not isinstance(keys, list):
                keys = []
            keys = [_as_str(k) for k in keys if _as_str(k)]

            # if missing keys but we have a category string, use it as a key
            if not keys and cat_str:
                keys = [cat_str]

            pdp["category_keys"] = keys

            if pdp.get("category") != before_cat or pdp.get("category_keys") != before_keys:
                with open(fp, "w", encoding="utf-8") as f:
                    json.dump(pdp, f, ensure_ascii=False)
                changed += 1

        except Exception:
            skipped += 1
            continue

    print("✅ normalize_pdp_categories complete")
    print(f"📦 Files scanned: {scanned}")
    print(f"✏️ Files changed: {changed}")
    print(f"⚠️ Files skipped: {skipped}")
    print(f"📁 Root: {PDP_ROOT}")

if __name__ == "__main__":
    normalize()



