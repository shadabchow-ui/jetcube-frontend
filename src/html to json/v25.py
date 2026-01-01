#!/usr/bin/env python3
from __future__ import annotations

import html as _html
import json
import math
import random
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from bs4 import BeautifulSoup


# -----------------------------
# Small utils
# -----------------------------
def clean_ws(s: str) -> str:
  return re.sub(r"\s+", " ", (s or "")).strip()

def uniq_keep_order(xs: List[str]) -> List[str]:
  out=[]
  seen=set()
  for x in xs:
    if not x: continue
    if x in seen: continue
    seen.add(x)
    out.append(x)
  return out

def upgrade_images_to_hd(images: List[str], hd_pool: List[str]) -> List[str]:
  """Replace any image in `images` with the HD variant from `hd_pool` if they match by normalized key."""
  if not images or not hd_pool:
    return images

  hd_map: Dict[str,str] = {}
  for u in hd_pool:
    k = normalize_image_url(u)
    if k:
      hd_map[k] = u

  out: List[str] = []
  for u in images:
    k = normalize_image_url(u)
    if k and k in hd_map:
      out.append(hd_map[k])
    else:
      out.append(u)

  return uniq_keep_order(out)

def stable_int(s: str) -> int:
  h=0
  for ch in s:
    h=(h*131+ord(ch)) & 0xFFFFFFFF
  return h

def trim_to_words(text: str, max_words: int) -> str:
  words=re.split(r"\s+", (text or "").strip())
  if len(words) <= max_words: return (text or "").strip()
  return " ".join(words[:max_words]).strip()

def text_or_none(el) -> Optional[str]:
  if not el: return None
  t=el.get_text(" ", strip=True)
  t=clean_ws(t)
  return t or None

def word_count(s: str) -> int:
  return len(re.findall(r"\b\w+\b", (s or "").strip()))

def ensure_word_range(seed: str, text: str, min_words: int, max_words: int) -> str:
  """Ensure text ends up between min_words and max_words by padding with safe, non-Amazon copy."""
  t = (text or "").strip()
  rng = random.Random(stable_int("wr:"+seed))

  fillers = [
    "The design is easy to style with simple accessories and works well in photos thanks to clean lines and a balanced silhouette.",
    "If you are between sizes, choose based on how close you like the fit through the waist and hips, then adjust with your usual layering choices.",
    "For the best look, smooth the fabric, check the neckline placement, and pair it with shoes that match the occasion and the hem length.",
    "Comfort comes from both the cut and the fabric, so selecting your preferred fit makes a noticeable difference over a full day of wear.",
    "This piece transitions well from daytime plans to evening events with a quick change of shoes and a small bag or clutch.",
    "To keep it looking sharp, follow the care label first and avoid high heat when drying or steaming if the material is sensitive."
  ]

  paras = [p.strip() for p in re.split(r"\n{2,}", t) if p.strip()]
  if not paras and t:
    paras = [t]
  if not paras:
    paras = [""]

  while word_count("\n\n".join(paras)) < min_words:
    paras.append(fillers[rng.randrange(0, len(fillers))])
    if len(paras) > 9:
      break

  out = "\n\n".join([p for p in paras if p.strip()]).strip()

  if word_count(out) > max_words:
    words = out.split()
    out = " ".join(words[:max_words]).strip()
    if "\n\n" not in out and len(words) > 90:
      a = " ".join(words[:70]).strip()
      b = " ".join(words[70:140]).strip()
      c = " ".join(words[140:]).strip()
      out = "\n\n".join([p for p in [a, b, c] if p])

  return out.strip()


# -----------------------------
# Amazon string cleanup (very light)
# -----------------------------
def strip_amazon_words(s: str) -> str:
  s=clean_ws(s or "")
  if not s:
    return s
  s=re.sub(r"\bAmazon\s+Customer\b", "Customer", s, flags=re.I)
  s=re.sub(r"\bVerified\s+Purchase\b", "", s, flags=re.I)
  s=re.sub(r"\bAI\s*[- ]?\s*Generated\s+from\s+the\s+text\s+of\s+customer\s+reviews\b\.?","", s, flags=re.I)
  s=re.sub(r"\bAI\s*[- ]?\s*Generated\b\.?","", s, flags=re.I)
  s=clean_ws(s)
  return s


# -----------------------------
# URL / image helpers
# -----------------------------
def normalize_image_url(u: str) -> str:
  # strip query + convert protocol-relative + remove amazon size modifiers safely
  u = (u or "").strip()
  if not u:
    return u
  u = u.split("?", 1)[0]
  if u.startswith("//"):
    u = "https:" + u

  # Remove amazon modifiers like ._SL1500_, ._AC_SX679_, ._SS64_ right before extension.
  # NOTE: do NOT replace with "." (that can create "..jpg"); remove the modifier token instead.
  u = re.sub(r"\._[A-Z0-9,]+_(?=\.[a-zA-Z0-9]+$)", "", u, flags=re.I)
  return u

def upscale_amazon_sr_url(url: str, target_w: int = 1200, target_h: int = 1200) -> str:
  """If url is an Amazon resized thumbnail (__AC_SRw,h__), bump to a larger size."""
  u = normalize_image_url(url)
  if not u:
    return ""
  m = re.search(r"__AC_SR(\d+),(\d+)__", u)
  if m:
    try:
      w = int(m.group(1)); h = int(m.group(2))
      if w < 300 or h < 300:
        u = re.sub(r"__AC_SR\d+,\d+__", f"__AC_SR{target_w},{target_h}__", u)
    except Exception:
      pass
  return u

def force_hd_amazon_image_url(url: str) -> str:
  u = normalize_image_url(url)
  if not u: return ""
  if "/images/I/" not in u:
    return u
  base = re.sub(r"\._[^.]+_\.(jpg|jpeg|png|webp)$", r".\1", u, flags=re.I)
  base = re.sub(r"\.(jpg|jpeg|png|webp)$", r"._SL1500_.\1", base, flags=re.I)
  return base

def amazon_image_key(url: str) -> str:
  u = str(url or "")
  m = re.search(r"/images/I/([^._/?]+)", u, flags=re.I)
  return m.group(1) if m else u

def is_relevant_product_image(url: str) -> bool:
  u = (url or "").lower()
  if not u: return False
  if "/images/g/" in u: return False
  if "media-amazon.com/images" not in u: return False
  if "/images/i/" not in u: return False
  if any(k in u for k in ["sprite","icon","logo","badge","prime","nav","button","star","rating","cm_cr","coupon","banner","ads","promo","promotion"]):
    return False
  return True


# -----------------------------
# JSON blob helpers for ImageBlockATF/BTF
# -----------------------------
def extract_json_array_after_marker(html_text: str, marker: str, max_scan: int = 400_000) -> Optional[Any]:
  idx = html_text.find(marker)
  if idx == -1:
    return None
  lb = html_text.find("[", idx)
  if lb == -1:
    return None

  depth = 0
  in_str = False
  esc = False
  for i in range(lb, min(len(html_text), lb + max_scan)):
    ch = html_text[i]
    if in_str:
      if esc:
        esc = False
      elif ch == "\\":
        esc = True
      elif ch == '"':
        in_str = False
      continue
    else:
      if ch == '"':
        in_str = True
        continue
      if ch == "[":
        depth += 1
      elif ch == "]":
        depth -= 1
        if depth == 0:
          blob = html_text[lb : i + 1]
          try:
            return json.loads(blob)
          except Exception:
            try:
              return json.loads(_html.unescape(blob))
            except Exception:
              return None
  return None

def extract_imageblock_atf_items(html_text: str) -> List[Dict[str,Any]]:
  arr = extract_json_array_after_marker(html_text, "'colorImages': { 'initial':")
  if isinstance(arr, list):
    return [x for x in arr if isinstance(x, dict)]
  return []

def pick_best_amazon_image(item: Dict[str,Any]) -> str:
  for k in ["hiRes", "large", "lowRes"]:
    u = item.get(k)
    if isinstance(u, str) and u.strip():
      return u.strip()
  main = item.get("main")
  if isinstance(main, dict) and main:
    best = None
    best_w = -1
    for ku, vv in main.items():
      try:
        w = int(str(ku))
      except Exception:
        continue
      if isinstance(vv, list) and vv:
        u = vv[0]
      else:
        u = vv
      if isinstance(u, str) and u and w > best_w:
        best_w = w
        best = u
    if best:
      return best
  return ""

def extract_parsejson_payload(html_text: str, start_from: int = 0) -> Optional[str]:
  i = html_text.find("jQuery.parseJSON('", start_from)
  if i == -1:
    return None
  j = i + len("jQuery.parseJSON('")
  out = []
  esc = False
  while j < len(html_text):
    ch = html_text[j]
    if esc:
      out.append(ch)
      esc = False
    else:
      if ch == "\\":
        esc = True
      elif ch == "'":
        return "".join(out)
      else:
        out.append(ch)
    j += 1
  return None

def extract_imageblock_btf_data(html_text: str) -> Optional[Dict[str,Any]]:
  payload = extract_parsejson_payload(html_text)
  if not payload:
    return None
  try:
    return json.loads(payload)
  except Exception:
    try:
      return json.loads(_html.unescape(payload))
    except Exception:
      return None

def extract_color_media_from_btf(btf: Dict[str,Any]) -> Tuple[Dict[str,str], Dict[str,List[str]], Dict[str,str]]:
  swatches: Dict[str,str] = {}
  color_images: Dict[str,List[str]] = {}
  color_image_key: Dict[str,str] = {}

  ci = btf.get("colorImages")
  if not isinstance(ci, dict):
    return swatches, color_images, color_image_key

  for color, arr in ci.items():
    if not isinstance(color, str) or not isinstance(arr, list) or not arr:
      continue
    imgs=[]
    for it in arr:
      if not isinstance(it, dict):
        continue
      best = pick_best_amazon_image(it)
      best_hd = force_hd_amazon_image_url(best)
      if best_hd:
        imgs.append(best_hd)
      if color not in swatches:
        th = it.get("thumb") or it.get("large") or best
        th = normalize_image_url(str(th or ""))
        if th:
          swatches[color] = th
    imgs = uniq_keep_order(imgs)
    if imgs:
      color_images[color] = imgs
      color_image_key[color] = amazon_image_key(imgs[0])

  return swatches, color_images, color_image_key


# -----------------------------
# A+ / description images (STRICT)
# -----------------------------
def extract_aplus_images(soup: BeautifulSoup) -> List[str]:
  """
  A+ content comes in multiple wrappers depending on Amazon template.
  We deliberately DO NOT scan all <img> globally to avoid gallery bleed.

  FIX: allow aplus-media URLs under /images/S/aplus-media/ (not just /images/I/).
  """
  urls=[]

  selectors = [
    "#aplus_feature_div img",
    "#aplus3p_feature_div img",
    "#aplusBrandStory_feature_div img",
    "#aplus img",
    "div[id^='aplus'] img",
    ".aplus-v2 img",
    ".aplus-module img",
    ".aplus-module-wrapper img",
    "#productDescription img",
  ]

  def is_good_aplus_url(src: str) -> bool:
    s = (src or "").lower()
    if not s:
      return False
    if "media-amazon.com/images" not in s:
      return False
    if any(k in s for k in ["sprite","icon","logo","badge","prime","nav","button","star","rating","cm_cr","coupon","banner","ads","promo","promotion"]):
      return False
    # allow classic product images and A+ media
    if "/images/i/" in s:
      return True
    if "/images/s/" in s and ("aplus" in s or "aplus-media" in s):
      return True
    return False

  for sel in selectors:
    for img in soup.select(sel):
      src = img.get("data-src") or img.get("data-lazy-src") or img.get("src") or ""
      src = normalize_image_url(str(src))
      src = upscale_amazon_sr_url(src)
      if not src:
        continue
      if not is_good_aplus_url(src):
        continue
      # only force-HD for /images/I/ style urls
      if "/images/I/" in src:
        urls.append(force_hd_amazon_image_url(src))
      else:
        urls.append(src)

  return uniq_keep_order(urls)[:80]


# -----------------------------
# Review summary + customers say
# -----------------------------
def extract_review_summary(soup: BeautifulSoup) -> Tuple[float,int]:
  avg = 0.0
  count = 0
  el = soup.select_one("#acrPopover span.a-icon-alt, i.a-icon-star span.a-icon-alt")
  if el:
    t = clean_ws(el.get_text(" ", strip=True))
    m = re.search(r"([0-9](?:\.[0-9])?)", t)
    if m:
      try: avg = float(m.group(1))
      except: pass
  el2 = soup.select_one("#acrCustomerReviewText, [data-hook='total-review-count']")
  if el2:
    t = clean_ws(el2.get_text(" ", strip=True)).replace(",", "")
    m2 = re.search(r"(\d+)", t)
    if m2:
      try: count = int(m2.group(1))
      except: pass
  return avg, count

def extract_customers_say(soup: BeautifulSoup) -> Optional[str]:
  """Return ONE short paragraph (no counts/tags/blobs)."""
  # 1) Known summary widgets (older layouts)
  candidates = soup.select(
    "#cr-lighthouse-terms, #cr-summarization-attributes, #cr-summarization-attributes-v2, "
    "[data-hook='cr-insights-widget'], [data-hook='cr-summarization-widget'], [data-hook='cr-insights-widget-summary']"
  )
  for el in candidates:
    t = clean_ws(el.get_text(" ", strip=True))
    if not t:
      continue
    if re.search(r"customers\s+say", t, flags=re.I):
      t = re.sub(r"(?i)\bcustomers\s+say\b\s*", "", t).strip()
      t = strip_amazon_words(t)
      t = clean_ws(t)
      if 40 <= len(t) <= 500:
        return t[:420].rstrip()

  # 2) Newer "Customers say" insight card (common in saved HTML)
  needle = soup.find(string=re.compile(r"^\s*Customers\s+say\s*$", re.I))
  if needle:
    heading = needle.parent

    overall = None
    try:
      overall = heading.find_next(attrs={"data-testid": "overall-summary"})
    except Exception:
      overall = None

    scope = overall or heading.parent
    if scope:
      raw = clean_ws(scope.get_text(" ", strip=True))
      raw = strip_amazon_words(raw)

      # Drop junk/count lines
      raw = re.sub(r"(?i)\bAI\s+Generated\b[^.]*\.?\s*", "", raw).strip()
      raw = re.sub(r"(?i)\bGenerated\s+from\s+the\s+text\s+of\s+customer\s+reviews\b\.?\s*", "", raw).strip()
      raw = re.sub(r"(?i)\b\d+\s+customers\s+mention[^.]*\.?\s*", "", raw).strip()
      raw = clean_ws(raw)

      # Extract 1–3 short sentences starting with "Customers ..."
      sentences = re.findall(r"(Customers[^.]{20,260}\.)", raw)
      seen=set(); ded=[]
      for s in sentences:
        s = clean_ws(s)
        if not s:
          continue
        k = s.lower()
        if k in seen:
          continue
        seen.add(k); ded.append(s)
      if ded:
        out = clean_ws(" ".join(ded[:3]))
        if 40 <= len(out) <= 420:
          return out

      raw = re.sub(r"(?i)\bcustomers\s+say\b\s*", "", raw).strip()
      if 40 <= len(raw) <= 420:
        return raw

  return None

def extract_size_chart(soup: BeautifulSoup) -> Optional[Dict[str,Any]]:
  # common case: Amazon preloads the popover HTML in the page (not necessarily linked by href)
  pop = soup.select_one("#a-popover-sizeGuide") or soup.select_one("div#a-popover-sizeGuide")
  if pop:
    tbl = pop.select_one("table") or pop.select_one("div.sizing-chart")
    if tbl:
      html = str(tbl)
      if html:
        return {"label": "Size chart", "href": "javascript:void(0)", "html": html}
    img = pop.select_one("img")
    if img:
      src = normalize_image_url(img.get("src") or img.get("data-src") or "")
      if src:
        return {"label": "Size chart", "href": src, "html": None}

  link=None
  for a in soup.find_all("a"):
    t = clean_ws(a.get_text(" ", strip=True)).lower()
    if "size chart" in t:
      link=a
      break
  if not link:
    return None

  href = (link.get("href") or "").strip()
  if href and href.startswith("/"):
    href = "https://www.amazon.com" + href

  html=None
  pop = link.get("data-a-popover") or link.get("data-action") or ""
  pop = str(pop) if pop else ""
  content_id=None
  if pop and pop.strip().startswith("{"):
    try:
      pj = json.loads(pop)
      content_id = pj.get("content") or pj.get("contentId") or pj.get("content_id")
    except Exception:
      content_id=None

  if not content_id:
    content_id = link.get("data-a-popover-content") or link.get("data-popover-content") or None

  candidates=[]
  if content_id:
    candidates += [f"#{content_id}", f"#a-popover-content-{content_id}"]
  candidates += ["#size-chart", "#sizeChart", "#sizechart", "#size_chart", "#sizeChartModal"]
  for sel in candidates:
    el = soup.select_one(sel)
    if el:
      html = str(el)
      break

  if not href and not html:
    return None

  return {"label":"Size chart","href": href or None, "html": html or None}


# -----------------------------
# Videos (VSE + mp4 fallback)
# -----------------------------
def extract_videos_vse(html_text: str) -> List[Dict[str,Any]]:
  unesc = _html.unescape(html_text)
  by_id: Dict[str,Dict[str,Any]] = {}

  def _vid_id(u: str) -> str:
    m = re.search(r"/vse-vms-transcoding-artifact[^/]+/([^/]+)/", u)
    if m: return m.group(1)
    return u

  for u in re.findall(r'"videoURL"\s*:\s*"([^"]+)"', unesc):
    if "vse-vms-transcoding-artifact" not in u:
      continue
    vid = _vid_id(u)
    d = by_id.setdefault(vid, {"id": vid, "sources": []})
    d["sources"].append({"type": "application/x-mpegURL", "src": u})

  for u in re.findall(r'(https?://m\.media-amazon\.com/images/S/[^,"\s]+\.mp4[^,"\s]*)', unesc, flags=re.I):
    if "vse-vms-transcoding-artifact" not in u:
      continue
    vid = _vid_id(u)
    d = by_id.setdefault(vid, {"id": vid, "sources": []})
    d["sources"].append({"type": "video/mp4", "src": u})

  m = re.search(r'"videoPreviewImageSrc"\s*:\s*"([^"]+)"', unesc)
  poster = normalize_image_url(m.group(1)) if m else ""

  out=[]
  seen=set()
  for vid, d in by_id.items():
    srcs=[]
    sseen=set()
    for s in d.get("sources", []):
      st = s.get("type"); su = s.get("src")
      if not st or not su:
        continue
      key=(st, su)
      if key in sseen:
        continue
      sseen.add(key)
      srcs.append({"type": st, "src": su})
    if not srcs:
      continue
    mp4 = next((x["src"] for x in srcs if x["type"]=="video/mp4"), "")
    hls = next((x["src"] for x in srcs if "mpegURL" in x["type"]), "")
    default_src = mp4 or hls
    if not default_src or default_src in seen:
      continue
    seen.add(default_src)
    item = {"id": vid, "src": default_src, "sources": srcs}
    if poster:
      item["poster"] = poster
    out.append(item)

  return out[:12]

def extract_videos(html: str) -> List[Dict[str,Any]]:
  vids = extract_videos_vse(html)
  if not vids:
    extra=[]
    for m in re.finditer(r"https?://[^\"'\s]+\.mp4", html, flags=re.I):
      url=m.group(0)
      if "media-amazon.com" not in url and "amazon" not in url:
        continue
      extra.append({"src": url, "sources": [{"type":"video/mp4","src": url}]})
    seen=set()
    for v in extra:
      u=v.get("src","")
      if not u or u in seen:
        continue
      seen.add(u)
      vids.append(v)

  out=[]
  seen=set()
  for v in vids:
    src=v.get("src","")
    if not src or src in seen:
      continue
    seen.add(src)
    out.append(v)
  return out[:12]


# -----------------------------
# Extractors: title, brand, price, etc.
# -----------------------------
def extract_asin_from_filename(path: Path) -> str:
  m=re.search(r"\b([A-Z0-9]{10})\b", path.name)
  return m.group(1) if m else ""

def extract_title(soup: BeautifulSoup) -> str:
  el=soup.select_one("#productTitle")
  if el:
    t=clean_ws(el.get_text(" ", strip=True))
    return t
  og=soup.find("meta", attrs={"property":"og:title"})
  if og and og.get("content"):
    return clean_ws(str(og["content"]))
  return ""

def extract_brand(soup: BeautifulSoup) -> str:
  el = soup.select_one("#bylineInfo, #brand, #bylineInfo_feature_div #bylineInfo")
  if not el:
    return ""
  t = clean_ws(el.get_text(" ", strip=True))
  t = re.sub(r"^Brand:\s*", "", t, flags=re.I).strip()

  # Common Amazon byline patterns:
  # "Visit the SAMPEEL Store" -> "SAMPEEL"
  t = re.sub(r"(?i)^visit\s+the\s+", "", t).strip()
  t = re.sub(r"(?i)\s+store\s*$", "", t).strip()

  return clean_ws(t)


def extract_price(soup: BeautifulSoup) -> Optional[float]:
  for sel in ["#priceToPay span.a-offscreen", "span.a-price span.a-offscreen", "#corePrice_feature_div span.a-offscreen"]:
    el=soup.select_one(sel)
    if el:
      txt=clean_ws(el.get_text(" ", strip=True))
      m=re.search(r"([0-9]+(?:\.[0-9]{1,2})?)", txt.replace(",",""))
      if m:
        try: return float(m.group(1))
        except: pass
  return None

def extract_bullets(soup: BeautifulSoup) -> List[str]:
  out=[]
  for li in soup.select("#feature-bullets ul li span"):
    t=text_or_none(li)
    if not t: continue
    if len(t) < 4: continue
    out.append(t)
  return uniq_keep_order(out)[:24]

def extract_specs(soup: BeautifulSoup) -> Dict[str,str]:
  out={}
  for tr in soup.select("#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr"):
    th=tr.find("th"); td=tr.find("td")
    k=text_or_none(th) or ""
    v=text_or_none(td) or ""
    if k and v:
      out[k]=v
  for li in soup.select("#detailBullets_feature_div li"):
    t=text_or_none(li)
    if not t or ":" not in t: continue
    k,v=t.split(":",1)
    k=clean_ws(k); v=clean_ws(v)
    if k and v and k not in out:
      out[k]=v
  return out




# -----------------------------
# Images extraction (GALLERY ONLY)
# -----------------------------
def extract_dynamic_image_urls(soup: BeautifulSoup) -> List[str]:
  urls=[]
  for tag in soup.select("img"):
    dyn=tag.get("data-a-dynamic-image")
    if dyn:
      try:
        data=json.loads(dyn)
        if isinstance(data, dict):
          for u in data.keys():
            urls.append(u)
      except Exception:
        pass
    src=tag.get("src") or tag.get("data-src")
    if src:
      urls.append(str(src))
  return urls

def extract_script_image_urls(html: str) -> List[str]:
  urls=[]
  for m in re.finditer(r"https?://m\.media-amazon\.com/images/I/[A-Za-z0-9%._-]+\.(?:jpg|jpeg|png|webp)", html, flags=re.I):
    urls.append(m.group(0))
  return urls

def extract_images(soup: BeautifulSoup, html_text: Optional[str]=None) -> List[str]:
  if html_text:
    items = extract_imageblock_atf_items(html_text)
    if items:
      hd=[]
      for it in items:
        best = pick_best_amazon_image(it)
        best_hd = force_hd_amazon_image_url(best)
        if best_hd:
          hd.append(best_hd)
      hd = uniq_keep_order(hd)
      if hd:
        return hd

  html=str(soup)
  raw=extract_dynamic_image_urls(soup)+extract_script_image_urls(html)

  norm=[]
  for u in raw:
    u2=force_hd_amazon_image_url(u)
    if not u2: continue
    if not is_relevant_product_image(u2): continue
    norm.append(u2)

  norm=uniq_keep_order(norm)
  if not norm:
    og=soup.find("meta", attrs={"property":"og:image"})
    if og and og.get("content"):
      u=force_hd_amazon_image_url(str(og["content"]))
      if u and is_relevant_product_image(u): norm=[u]
  return norm


# -----------------------------
# Variations extraction
# -----------------------------
def extract_json_object_after_marker(html_text: str, marker: str) -> Optional[Any]:
  idx = html_text.find(marker)
  if idx == -1:
    return None
  brace = html_text.find("{", idx)
  if brace == -1:
    return None

  depth = 0
  in_str = False
  esc = False
  for i in range(brace, min(len(html_text), brace + 400_000)):
    ch = html_text[i]
    if in_str:
      if esc:
        esc = False
      elif ch == "\\":
        esc = True
      elif ch == '"':
        in_str = False
      continue
    else:
      if ch == '"':
        in_str = True
        continue
      if ch == "{":
        depth += 1
      elif ch == "}":
        depth -= 1
        if depth == 0:
          blob = html_text[brace : i + 1]
          try:
            return json.loads(blob)
          except Exception:
            try:
              return json.loads(_html.unescape(blob))
            except Exception:
              return None
  return None

def extract_variations(soup: BeautifulSoup) -> Tuple[List[str], List[str]]:
  sizes=[]; colors=[]

  for li in soup.select("[id*='variation_color_name'] li, [id*='variation_color'] li"):
    label = li.get("title") or li.get("aria-label") or ""
    label = clean_ws(str(label))
    label = re.sub(r"^click to select\s*", "", label, flags=re.I).strip()
    if not label:
      t=text_or_none(li)
      label=t or ""
    if label and len(label)<=40:
      colors.append(label)

  for li in soup.select("[id*='variation_size_name'] li, [id*='variation_size'] li"):
    t=text_or_none(li)
    if t and len(t)<=30:
      sizes.append(t)

  for opt in soup.select("select#native_dropdown_selected_size_name option"):
    t=clean_ws(opt.get_text(" ", strip=True))
    if t and "select" not in t.lower() and len(t)<=30:
      sizes.append(t)

  for opt in soup.select("select#native_dropdown_selected_color_name option"):
    t=clean_ws(opt.get_text(" ", strip=True))
    if t and "select" not in t.lower() and len(t)<=40:
      colors.append(t)

  html = str(soup)
  dvdd = extract_json_object_after_marker(html, '"dimensionValuesDisplayData"')
  if isinstance(dvdd, dict):
    for k, arr in dvdd.items():
      if not isinstance(arr, list): continue
      k2 = str(k).lower()
      if "size" in k2:
        for v in arr:
          vv = clean_ws(str(v))
          if vv and len(vv)<=30: sizes.append(vv)
      if "color" in k2:
        for v in arr:
          vv = clean_ws(str(v))
          if vv and len(vv)<=40: colors.append(vv)

  return uniq_keep_order(sizes)[:40], uniq_keep_order(colors)[:60]

def extract_color_swatches(soup: BeautifulSoup) -> Dict[str, str]:
  out: Dict[str, str] = {}
  for li in soup.select("[id*='variation_color_name'] li, [id*='variation_color'] li"):
    label = li.get("title") or li.get("aria-label") or ""
    label = clean_ws(str(label))
    label = re.sub(r"^click to select\s*", "", label, flags=re.I).strip()

    img = li.select_one("img")
    if img:
      if not label:
        label = clean_ws(str(img.get("alt") or ""))
      src = img.get("src") or img.get("data-src") or ""
      src = normalize_image_url(str(src))
      if label and src and "media-amazon.com/images" in src:
        out[label] = src
      continue

    t = text_or_none(li)
    if not label and t:
      label = t

  cleaned: Dict[str, str] = {}
  for k, v in out.items():
    kk = clean_ws(k)
    vv = normalize_image_url(v)
    if not kk or not vv: continue
    cleaned[kk] = vv
  return cleaned


# -----------------------------
# Reviews extraction
# -----------------------------
def extract_reviews(soup: BeautifulSoup) -> List[Dict[str,Any]]:
  out=[]
  blocks = soup.select('div[data-hook="review"], div[id^="customer_review-"]')
  for r in blocks:
    title = (
      text_or_none(r.select_one('[data-hook="review-title"]'))
      or text_or_none(r.select_one('a[data-hook="review-title"]'))
      or text_or_none(r.select_one('span[data-hook="review-title"]'))
      or "Review"
    )

    body = (
      text_or_none(r.select_one('[data-hook="review-body"]'))
      or text_or_none(r.select_one('span[data-hook="review-body"]'))
      or ""
    )

    author = text_or_none(r.select_one(".a-profile-name")) or ""

    rating_txt = (
      text_or_none(r.select_one('[data-hook="review-star-rating"]'))
      or text_or_none(r.select_one('[data-hook="cmps-review-star-rating"]'))
      or text_or_none(r.select_one("i.a-icon-star span.a-icon-alt"))
      or ""
    )

    date_txt = text_or_none(r.select_one('[data-hook="review-date"]')) or ""

    verified = bool(
      r.select_one('[data-hook="avp-badge"], [data-hook="verified-purchase-badge"], span[data-hook="avp-badge"]')
    )

    review_images=[]
    for im in r.select('[data-hook="review-image-tile"] img, img[data-hook="review-image-tile"], .review-image-tile img, .review-image-container img'):
      src = im.get("data-src") or im.get("src") or ""
      src = normalize_image_url(str(src))
      if not src:
        continue
      if "/images/I/" not in src:
        continue
      review_images.append(force_hd_amazon_image_url(src))
    review_images = uniq_keep_order(review_images)[:12]

    m=re.search(r"([0-9](?:\.[0-9])?)", rating_txt)
    rating=float(m.group(1)) if m else 0.0

    title=strip_amazon_words(title)
    body=strip_amazon_words(body)
    author=strip_amazon_words(author)

    if not author or author.lower()=="amazon customer":
      author="Verified customer" if verified else "Customer"

    date=""
    if date_txt:
      m2=re.search(r"\bon\b\s*(.+)$", date_txt)
      date=strip_amazon_words(clean_ws(m2.group(1) if m2 else date_txt))

    if not (title or body):
      continue

    out.append({
      "title": title,
      "body": body,
      "author": author,
      "rating": rating,
      "date": date,
      "verified": verified,
      "images": review_images,
    })

  seen=set(); ded=[]
  for r in out:
    key=(r.get("title",""), r.get("body",""), tuple(r.get("images") or []))
    if key in seen:
      continue
    seen.add(key); ded.append(r)
  return ded[:12]

# -----------------------------
# Category (very light heuristic)
# -----------------------------
def extract_category(soup: BeautifulSoup) -> str:
  bc=soup.select_one("#wayfinding-breadcrumbs_feature_div, #wayfinding-breadcrumbs_container")
  if bc:
    t=clean_ws(bc.get_text(" ", strip=True))
    t=re.sub(r"\s*›\s*", " > ", t)
    if t: return t
  return ""


def parse_category_path(category: str) -> List[str]:
  if not category:
    return []
  t = category.replace("›", ">")
  parts = [clean_ws(p) for p in re.split(r"\s*>\s*", t) if clean_ws(p)]
  out=[]
  for p in parts:
    if out and out[-1].lower() == p.lower():
      continue
    out.append(p)
  return out

def category_slug_from_path(parts: List[str]) -> str:
  if not parts:
    return ""
  return "/".join([slugify(p) for p in parts])

# -------------------------------
# Handle de-duplication registry
# -------------------------------
seen_handles = {}

def uniquify_handle(base_handle: str) -> str:
    """
    Ensures handle uniqueness by appending -1, -2, -3 if needed.
    womens-dress
    womens-dress-1
    womens-dress-2
    """
    if base_handle not in seen_handles:
        seen_handles[base_handle] = 0
        return base_handle

    seen_handles[base_handle] += 1
    return f"{base_handle}-{seen_handles[base_handle]}"


# -----------------------------
# Title + social proof
# -----------------------------
def _stable_rng(seed: str) -> random.Random:
  return random.Random(stable_int(seed))

def _remove_brand_from_title(title: str, brand: str) -> str:
  t = clean_ws(title)
  b = clean_ws(brand)
  if not b:
    return t
  t = re.sub(rf"(?i)^\s*{re.escape(b)}\s*[-–|:]\s*", "", t).strip()
  t = re.sub(rf"(?i)\b{re.escape(b)}\b", "", t).strip()
  t = clean_ws(t)
  return t

def sanitize_title_regex(title: str) -> str:
  """Enforce: ^[A-Za-z0-9][A-Za-z0-9 -]*$"""
  t = clean_ws(title or "")
  if not t:
    return "Product"

  t = t.replace("—", " ").replace(",", " ")
  t = t.replace("Women'S", "Womens").replace("Women's", "Womens").replace("women's", "Womens").replace("Women’s", "Womens").replace("women’s", "Womens")
  t = t.replace("'", "").replace("’", "").replace('"', "")

  t = re.sub(r"[^A-Za-z0-9 -]", " ", t)
  t = clean_ws(t)
  t = re.sub(r"^[^A-Za-z0-9]+", "", t)
  t = clean_ws(t)
  t = re.sub(r"\s{2,}", " ", t)
  t = re.sub(r"-{2,}", "-", t)

  if not t:
    return "Product"

  words = t.split()
  if len(words) > 18:
    t = " ".join(words[:18]).strip()

  t = re.sub(r"[^A-Za-z0-9 -]", "", t)
  t = clean_ws(t)
  if not re.match(r"^[A-Za-z0-9][A-Za-z0-9 -]*$", t):
    t = re.sub(r"[^A-Za-z0-9 -]", " ", t)
    t = clean_ws(t) or "Product"
  return t

def _norm_text_blob(parts: List[str]) -> str:
  return clean_ws(" ".join([p for p in parts if p])).lower()

def _first_fiber(specs: Dict[str,str]) -> str:
  raw = clean_ws(specs.get("Fabric type") or specs.get("Material") or specs.get("Fabric") or "")
  s = raw.lower()
  # remove percentages and punctuation
  s = re.sub(r"\b\d+\s*%\b", " ", s)
  s = re.sub(r"[^a-z\s]", " ", s)
  s = clean_ws(s)
  fibers = [
    "acrylic","cotton","wool","cashmere","polyester","nylon","spandex","elastane",
    "rayon","viscose","linen","silk","denim","leather","suede","modal"
  ]
  for f in fibers:
    if re.search(rf"\b{re.escape(f)}\b", s):
      return f.title()
  return ""

def _cap_chars(title: str, max_chars: int = 120) -> str:
  t = clean_ws(title)
  if len(t) <= max_chars:
    return t
  toks = t.split()
  while toks and len(" ".join(toks)) > max_chars:
    toks.pop()
  return " ".join(toks).strip() or t[:max_chars].rsplit(" ", 1)[0].strip()

def infer_descriptor_from_text(seed: str, category: str, bullets: List[str], specs: Dict[str,str]) -> str:
  """Pick one high-signal descriptor term to reduce generic titles/handles."""
  blob = _norm_text_blob([category, " ".join(bullets or []), " ".join([str(v) for v in (specs or {}).values()])])

  # common apparel descriptors
  pairs = [
    ("wide leg", "Wide Leg"),
    ("straight leg", "Straight Leg"),
    ("flare", "Flare Leg"),
    ("bootcut", "Bootcut"),
    ("cargo", "Cargo"),
    ("harem", "Harem"),
    ("high waist", "High Waist"),
    ("elastic waist", "Elastic Waist"),
    ("drawstring", "Drawstring"),
    ("pull on", "Pull On"),
    ("oversized", "Oversized"),
    ("bodycon", "Bodycon"),
    ("maxi", "Maxi"),
    ("midi", "Midi"),
    ("mini", "Mini"),
    ("cable knit", "Cable Knit"),
    ("rib knit", "Rib Knit"),
    ("knit", "Knit"),
    ("long sleeve", "Long Sleeve"),
    ("short sleeve", "Short Sleeve"),
    ("sleeveless", "Sleeveless"),
    ("v neck", "V Neck"),
    ("crew neck", "Crew Neck"),
    ("off shoulder", "Off Shoulder"),
    ("casual", "Casual"),
    ("work", "Work"),
    ("office", "Office"),
    ("lounge", "Lounge"),
    ("athletic", "Athletic"),
  ]

  hits=[]
  for k, v in pairs:
    if k in blob:
      hits.append(v)

  # deterministic pick so the same product stays stable across runs
  hits = uniq_keep_order(hits)
  if not hits:
    return ""

  r = _stable_rng("desc:"+seed+":"+("|".join(hits)))
  return hits[r.randrange(0, min(len(hits), 6))]



def build_seo_title_v5(seed: str, category: str, bullets: List[str], specs: Dict[str,str]) -> str:
  """
  Build a clean, SEO-safe title WITHOUT falling back to Amazon titles.
  Inputs: category breadcrumb + bullets + specs.
  Output: regex-safe, <= ~120 chars.
  """
  blob = _norm_text_blob([category, " ".join(bullets or []), " ".join([f"{k} {v}" for k,v in (specs or {}).items()])])

  # strip years (avoid 2025/2026 etc. in titles)
  blob = re.sub(r"\b20\d{2}\b", " ", blob)
  blob = clean_ws(blob)

  # gender (default to Womens for apparel unless clearly mens/kids)
  gender = ""
  if re.search(r"\bmen\b|\bmens\b|\bman\b", blob):
    gender = "Mens"
  elif re.search(r"\bgirl\b|\bgirls\b|\bboy\b|\bboys\b|\bkids\b", blob):
    gender = ""  # keep neutral for kids unless you later want "Kids"
  else:
    # womens if we see it; otherwise, if it looks like apparel, default to Womens (your catalog is primarily womens fashion)
    if re.search(r"\bwomen\b|\bwomens\b|\bladies\b", blob):
      gender = "Womens"
    elif any(k in blob for k in ["dress","pants","socks","shirt","sweater","hoodie","jumpsuit","skirt","shoes","sandals","heels","leggings","shorts","clothing","fashion"]):
      gender = "Womens"
    else:
      gender = ""

  # core product type (prefer category words)
  core = "Product"
  if "sweater dress" in blob or ("dress" in blob and any(k in blob for k in ["sweater","knit","cable"])):
    core = "Sweater Dress"
  elif "dress" in blob or "gown" in blob:
    core = "Dress"
  elif any(k in blob for k in ["pants","trousers","slacks","jeans","joggers","jogger","cargo"]):
    core = "Pants"
  elif any(k in blob for k in ["leggings","legging","tights"]):
    core = "Leggings"
  elif "shorts" in blob or "short" in blob:
    core = "Shorts"
  elif "socks" in blob or "sock" in blob:
    core = "Socks"
  elif any(k in blob for k in ["hoodie"]):
    core = "Hoodie"
  elif any(k in blob for k in ["sweatshirt"]):
    core = "Sweatshirt"
  elif any(k in blob for k in ["sweater","pullover","cardigan"]):
    core = "Sweater"
  elif any(k in blob for k in ["shirt","t-shirt","tee","top","blouse"]):
    core = "Shirt"
  elif "jumpsuit" in blob:
    core = "Jumpsuit"
  elif "skirt" in blob:
    core = "Skirt"
  elif any(k in blob for k in ["sandal","sandals","heels","heel","pump","pumps","stiletto","platform","shoe","shoes","footwear"]):
    # light footwear handling
    if "pump" in blob:
      core = "Pumps"
    elif "sandal" in blob:
      core = "Sandals"
    else:
      core = "Shoes"

  # If type is still unknown, avoid 'Product' (bad SEO + causes product-*.json handles)
  if core == "Product":
    core = "Apparel" if gender else "Item"

  # attribute extraction (high-signal only)
  attrs: List[str] = []

  # fit / cut
  if "oversized" in blob:
    attrs.append("Oversized")
  elif "wide leg" in blob or "wide-leg" in blob:
    attrs.append("Wide Leg")
  elif "straight leg" in blob:
    attrs.append("Straight Leg")
  elif "slim" in blob:
    attrs.append("Slim Fit")
  elif "relaxed" in blob or "loose" in blob:
    attrs.append("Relaxed Fit")

  # knit / texture
  if "cable knit" in blob or "cable-knit" in blob:
    attrs.append("Cable Knit")
  elif "ribbed" in blob:
    attrs.append("Rib Knit")
  elif "knit" in blob:
    attrs.append("Knit")

  # key features (apparel)
  if "elastic waist" in blob:
    attrs.append("Elastic Waist")
  elif "high waist" in blob:
    attrs.append("High Waist")
  elif "drawstring" in blob:
    attrs.append("Drawstring")
  elif "pull on" in blob or "pull-on" in blob:
    attrs.append("Pull On")

  # extra shape / use-case signals
  if "cargo" in blob:
    attrs.append("Cargo")
  elif "flare" in blob or "flared" in blob:
    attrs.append("Flare Leg")
  elif "bootcut" in blob:
    attrs.append("Bootcut")
  elif "harem" in blob:
    attrs.append("Harem")

  if "work" in blob or "office" in blob:
    attrs.append("Work")
  elif "lounge" in blob:
    attrs.append("Lounge")
  elif "casual" in blob:
    attrs.append("Casual")

  # sleeves / length
  if "long sleeve" in blob or "long sleeves" in blob:
    attrs.append("Long Sleeve")
  elif "short sleeve" in blob or "short sleeves" in blob:
    attrs.append("Short Sleeve")
  elif "sleeveless" in blob:
    attrs.append("Sleeveless")

  # neckline
  if "crew neck" in blob or "crew neckline" in blob:
    attrs.append("Crew Neck")
  elif "v neck" in blob or "v-neck" in blob:
    attrs.append("V Neck")
  elif "off shoulder" in blob or "off-shoulder" in blob:
    attrs.append("Off Shoulder")
  elif "one shoulder" in blob:
    attrs.append("One Shoulder")

  # socks lengths
  if core == "Socks":
    if "no show" in blob or "no-show" in blob:
      attrs.append("No Show")
    elif "ankle" in blob:
      attrs.append("Ankle")
    elif "crew" in blob:
      attrs.append("Crew")
    elif "knee high" in blob or "knee-high" in blob:
      attrs.append("Knee High")
    if "compression" in blob:
      attrs.append("Compression")
    if "athletic" in blob or "running" in blob:
      attrs.append("Athletic")

  # If we still have nothing, pick one descriptor term (keeps titles/handles from collapsing to generic)
  if not attrs:
    d = infer_descriptor_from_text(seed, category, bullets, specs)
    if d:
      attrs.append(d)

  # material (from specs)
  fiber = _first_fiber(specs or {})
  if fiber:
    # keep material later (after type) to avoid spammy prefixes
    attrs.append(fiber)

  # de-dupe attributes while preserving order
  attrs = uniq_keep_order(attrs)[:8]

  # build
  base = f"{gender} {core}".strip() if gender else core
  title = (base + (" " + " ".join(attrs) if attrs else "")).strip()

  # sanitize + cap
  title = sanitize_title_regex(title)
  title = _cap_chars(title, 120)
  title = sanitize_title_regex(title)

  if not title:
    title = "Apparel" if gender else "Item"
  return title

def rewrite_title_v4(seed: str, original_title: str, brand: str, category: str) -> str:
  """
  SEO-safe rewrite with strict regex compliance:
  - No commas, em dash, apostrophes
  - Brand removed
  - Avoid filler
  """
  base = _remove_brand_from_title(original_title, brand)
  low = base.lower()
  rng = _stable_rng("title4:"+seed+":"+base+":"+category)

  # Determine core
  cat_low = (category or "").lower()

  def _infer_type(t: str) -> str:
    s = (t or "").lower()

    if any(k in s for k in ["sandal","sandals","heel","heels","pump","pumps","stiletto","platform"]):
      return "apparel"
    if "jumpsuit" in s:
      return "apparel"

    if any(k in s for k in ["dress","gown"]):
      return "dress"
    if any(k in s for k in ["leggings","legging","tights"]):
      return "leggings"
    if any(k in s for k in ["shorts","short"]):
      return "shorts"
    if any(k in s for k in ["pants","pant","trousers","trouser","slacks","jeans","jogger","joggers","cargo"]):
      return "pants"
    if any(k in s for k in ["sock","socks"]):
      return "socks"
    if any(k in s for k in ["sweater","pullover","cardigan","hoodie","sweatshirt"]):
      return "sweater"
    if any(k in s for k in ["shirt","t-shirt","tee","top","blouse"]):
      return "shirts"
    if any(k in s for k in ["swim","swimsuit","bikini","tankini","one piece","one-piece","beachwear","cover up","cover-up"]):
      return "swimwear"
    if any(k in s for k in ["2 piece","two piece","matching set","coord","co-ord","outfit set","tracksuit","loungewear set","set"]):
      return "sets"

    return "apparel"

  core = "Product"
  if any(k in low for k in ["sandal","sandals","heel","heels","pump","pumps","stiletto","platform"]):
    core = "Heels"
    if "sandal" in low:
      core = "Heeled Sandals"
    if "pump" in low:
      core = "Pumps"
  elif "jumpsuit" in low:
    core = "Jumpsuit"
  else:
    typ = _infer_type(low + " " + cat_low)
    core_map = {
      "pants": "Pants",
      "leggings": "Leggings",
      "shorts": "Shorts",
      "shirts": "Shirt",
      "sweater": "Sweater",
      "sets": "Set",
      "swimwear": "Swimwear",
      "dress": "Dress",
      "socks": "Socks",
    }
    core = core_map.get(typ, "Product")

  candidates = []
  for kw in [
    "maxi","formal","evening","cocktail","casual","work","office","lounge",
    "boat neck","v neck","off shoulder","off-shoulder","one shoulder",
    "sleeveless","short sleeve","long sleeve",
    "ruched","high split","split","bodycon","mermaid",
    "wide leg","wide-leg","straight leg","elastic waist","high waist","drawstring","pull on","pull-on",
    "open toe","cross strap","cross-strap","platform","stiletto",
    "crew","ankle","knee high","knee-high","compression","athletic",
    "suede"
  ]:
    if kw in low:
      candidates.append(kw)

  map_kw = {
    "off shoulder": "Off Shoulder",
    "off-shoulder": "Off Shoulder",
    "boat neck": "Boat Neck",
    "v neck": "V Neck",
    "one shoulder": "One Shoulder",
    "short sleeve": "Short Sleeve",
    "long sleeve": "Long Sleeve",
    "wide leg": "Wide Leg",
    "wide-leg": "Wide Leg",
    "high split": "High Split",
    "straight leg": "Straight Leg",
    "elastic waist": "Elastic Waist",
    "high waist": "High Waist",
    "drawstring": "Drawstring",
    "pull on": "Pull On",
    "pull-on": "Pull On",
    "knee high": "Knee High",
    "knee-high": "Knee High",
    "cross strap": "Cross Strap",
    "cross-strap": "Cross Strap",
    "open toe": "Open Toe",
  }

  norm=[]
  for k in candidates:
    tok = map_kw.get(k, k.title())
    if tok not in norm:
      norm.append(tok)

  rng.shuffle(norm)
  norm = norm[:6]

  if core in ["Heeled Sandals", "Pumps", "Heels"]:
    title = "Womens " + core
  elif core == "Jumpsuit":
    title = "Womens Jumpsuit"
  elif core == "Pants":
    title = "Womens Pants"
  elif core == "Leggings":
    title = "Womens Leggings"
  elif core == "Shorts":
    title = "Womens Shorts"
  elif core == "Shirt":
    title = "Womens Shirt"
  elif core == "Sweater":
    title = "Womens Sweater"
  elif core == "Set":
    title = "Womens Set"
  elif core == "Swimwear":
    title = "Womens Swimwear"
  elif core == "Socks":
    title = "Womens Socks"
  elif core == "Dress":
    if "maxi" in low or "gown" in low or "long" in low:
      title = "Womens Maxi Dress"
    else:
      title = "Womens Dress"
  else:
    title = "Product"


  if norm:
    title = title + " " + " ".join(norm)

  return sanitize_title_regex(title)

def social_proof_bought_past_month(seed: str) -> int:
  rng = _stable_rng("proof:"+seed)
  x = rng.random() ** 2.4
  n = int(50 + x * (2000 - 50))
  return max(50, min(2000, n))


def _looks_like_shoe_sizes(vals: List[str]) -> bool:
  # Typical US shoe sizes: 4–14 with optional .5, often many values
  nums = []
  for v in vals or []:
    s = str(v).strip()
    if not s:
      continue
    if not re.fullmatch(r"\d{1,2}(?:\.5)?", s):
      return False
    nums.append(float(s))
  if not nums:
    return False
  return (len(nums) >= 6) and all(4.0 <= x <= 14.0 for x in nums)


# -----------------------------
# Sizes inference (so Size section always exists)
# -----------------------------
def infer_sizes(title: str, category: str, specs: Dict[str,str]) -> List[str]:
  """
  FIX: avoid generic breadcrumb "Clothing, Shoes & Jewelry" forcing shoe sizes for dresses.
  Apparel wins when the TITLE indicates apparel. Shoes only when TITLE indicates footwear.
  """
  title_low = (title or "").lower()
  cat_low = (category or "").lower()

  apparel_keys = ["dress","gown","jumpsuit","skirt","top","shirt","blouse","pants","legging","coat","jacket"]
  shoe_keys = ["sandal","sandals","heel","heels","pump","pumps","stiletto","platform","shoe","shoes"]

  # apparel wins if the title looks like apparel
  if any(k in title_low for k in apparel_keys):
    return ["XS","S","M","L","XL"]

  # shoes only if the title looks like shoes
  if any(k in title_low for k in shoe_keys):
    return ["5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","11"]

  # optional category-based shoes, but avoid generic department breadcrumb
  if (("shoe" in cat_low) or ("footwear" in cat_low)) and not re.search(r"clothing\s*,?\s*shoes\s*&\s*jewelry", cat_low):
    return ["5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","11"]

  return ["One Size"]


# -----------------------------
# Description generator
# -----------------------------
def about_this_item_200(seed: str, title: str, bullets: List[str], specs: Dict[str,str]) -> str:
  title_clean = sanitize_title_regex(title)
  fabric = clean_ws(specs.get("Fabric type") or specs.get("Material") or specs.get("Fabric") or "")
  care = clean_ws(specs.get("Care instructions") or specs.get("Care") or "")

  para1 = f"{title_clean} is made for a polished look that still feels comfortable to wear. It is designed to sit cleanly on the body with a flattering shape that works for day plans and dressier moments without feeling overdone."
  para2 = "The fit focuses on balance rather than extremes, so you can move naturally while still getting a defined silhouette. Choose your usual size for a closer look, or size up if you prefer a little more ease through the waist and hips."
  para3 = "Styling is simple: keep accessories minimal for a clean finish, or add a jacket and statement shoes when you want a sharper outfit. This piece photographs well thanks to smooth lines and a structured feel that stays put once you have it adjusted."

  extras = []
  if fabric:
    extras.append(f"The listed fabric is {fabric.lower()}, which helps the garment keep its shape while staying wearable.")
  if care:
    extras.append(f"Care guidance: {care}. Follow the label first to help it stay looking new.")
  para4 = " ".join(extras) if extras else "With the right fit and simple styling, this item becomes an easy go-to when you want something that looks intentional without requiring extra effort."

  txt = "\n\n".join([para1, para2, para3, para4]).strip()
  return ensure_word_range(seed, txt, 180, 220)

def long_desc_2000(seed: str, title: str, bullets: List[str], specs: Dict[str,str], sizes: List[str], colors: List[str]) -> str:
  fabric=specs.get("Fabric type") or specs.get("Material") or specs.get("Fabric") or ""
  care=specs.get("Care instructions") or specs.get("Care") or ""

  intro=(
    f"{sanitize_title_regex(title)} is a versatile piece you can reach for when you want a put-together look that still feels comfortable. "
    "The goal is simple: a silhouette that reads polished, photographs well, and stays wearable for a full day or a long night."
  )

  fit=(
    "Fit is where most outfits win or lose. This design aims for a balanced shape with a defined line through the torso, a clean waist, "
    "and a smooth finish through the hips and legs. If you prefer a more relaxed feel, size up; if you like a closer fit, stay true to size."
  )
  if sizes:
    fit += f" Sizes may include: {', '.join(sizes[:12])}."

  feel=(
    "Comfort is not just about softness. It is also about movement and how the fabric behaves as you walk, sit, and stand. "
    "A fabric blend with a bit of give helps it keep its shape while still feeling wearable."
  )
  if fabric:
    feel += f" The listed fabric is {clean_ws(fabric).lower()}."

  highlights=" ".join([clean_ws(b) for b in bullets[:12] if clean_ws(b)]) or (
    "A clean neckline and a refined silhouette for an elevated look. Designed to layer easily with jackets, wraps, or sweaters. "
    "Works well with both minimal accessories and statement pieces."
  )

  styling=(
    "Styling ideas: keep it minimal with neutral shoes and one standout accessory. For a relaxed daytime look, add a denim jacket or cardigan. "
    "For events, switch to a bolder shoe and a small clutch for a sharper finish."
  )

  color_note="Color options depend on the listing. Pick the shade that matches your wardrobe for the most repeat wear."
  if colors:
    color_note=f"Available colors may include: {', '.join(colors[:14])}. If a shade is sold out, check back as availability can change."

  care_txt="Care guidance matters if you want it to keep its shape and finish. Follow the label first."
  if care:
    care_txt=f"Care instructions listed: {clean_ws(care)}. Follow the label first, and avoid high heat if you want the fabric to stay smooth."

  blocks=[
    intro,
    "Fit and sizing\n"+fit,
    "Fabric and comfort\n"+feel,
    "Highlights\n"+highlights,
    "How to style\n"+styling,
    "Color notes\n"+color_note,
    "Care\n"+care_txt,
  ]

  text="\n\n".join(blocks)
  paras=[p.strip() for p in re.split(r"\n{2,}", text) if p and p.strip()]
  seen=set(); kept=[]
  for p in paras:
    key=re.sub(r"[^a-z0-9]+"," ",p.lower()).strip()
    key=re.sub(r"\s+"," ",key)
    if not key or key in seen: continue
    seen.add(key); kept.append(p)
  text="\n\n".join(kept)
  return trim_to_words(text, 2000)

def build_long_description_blocks(seed: str, title: str, bullets: List[str], specs: Dict[str,str], sizes: List[str], colors: List[str], aplus_images: List[str]) -> List[Dict[str,Any]]:
  # Keep ALL text together first, then place images after (no interleaving).
  txt = long_desc_2000(seed=seed, title=title, bullets=bullets, specs=specs, sizes=sizes, colors=colors)
  paras = [clean_ws(p) for p in re.split(r"\n\s*\n", txt) if clean_ws(p)]
  blocks: List[Dict[str,Any]] = []

  for p in paras:
    blocks.append({"type":"p","text":p})

  imgs = uniq_keep_order([force_hd_amazon_image_url(u) for u in (aplus_images or [])])[:12]
  for i, u in enumerate(imgs):
    if not u:
      continue
    blocks.append({
      "type":"img",
      "src": u,
      "alt": f"{sanitize_title_regex(title)} details image {i+1}",
    })

  return blocks


# -----------------------------
# Cross-sells
# -----------------------------
def lite_card(p: Dict[str,Any]) -> Optional[Dict[str,Any]]:
  pid = p.get("id")
  if not pid: return None
  imgs=p.get("gallery_images") or p.get("images") or []
  imgs2=imgs if isinstance(imgs,list) else []
  if not imgs2: return None
  return {"id":pid,"title":p.get("title"),"price":p.get("price"),"category":p.get("category"),"images":imgs2[:1]}

def attach_cross_sells(products: List[Dict[str,Any]]) -> None:
  cards=[c for c in (lite_card(p) for p in products) if c]
  for p in products:
    pid=str(p.get("id"))
    pool=[c for c in cards if c.get("id")!=pid]
    r=random.Random(stable_int(f"related:{pid}")); rel=pool[:] ; r.shuffle(rel); p["related"]=rel[:5]
    r2=random.Random(stable_int(f"viewed:{pid}")); cav=pool[:] ; r2.shuffle(cav); p["customer_also_viewed"]=cav[:8]


# -----------------------------
# Main parse
# -----------------------------
@dataclass
class Extracted:
  asin: str
  title: str
  brand: str
  price: Optional[float]

  images: List[str]                 # gallery images only
  aplus_images: List[str]           # A+ images only

  bullets: List[str]
  specs: Dict[str,str]

  sizes: List[str]
  colors: List[str]
  color_swatches: Dict[str,str]
  color_image_key: Dict[str,str]
  color_images: Dict[str, List[str]]

  reviews: List[Dict[str,Any]]
  videos: List[Dict[str,Any]]
  category: str

  review_avg: Optional[float] = None
  review_count: Optional[int] = None
  customers_say: Optional[str] = None
  size_chart: Optional[Dict[str,Any]] = None


def extract_btf_swatches_and_media(html: str) -> Tuple[Dict[str,str], Dict[str,List[str]], Dict[str,str]]:
  btf=extract_imageblock_btf_data(html) or {}
  if not btf:
    return {}, {}, {}
  return extract_color_media_from_btf(btf)

def parse_one(path: Path) -> Extracted:
  html = path.read_text(encoding="utf-8", errors="ignore")
  soup = BeautifulSoup(html, "html.parser")

  asin = extract_asin_from_filename(path)
  if not asin:
    m = re.search(r'"asin"\s*:\s*"([A-Z0-9]{10})"', html)
    asin = m.group(1) if m else "UNKNOWNASIN"

  raw_title = extract_title(soup)
  brand = extract_brand(soup)
  price = extract_price(soup)

  # If title missing but ASIN exists, synthesize a stable fallback
  if not raw_title and asin != "UNKNOWNASIN":
    raw_title = f"Product {asin}"

  images = extract_images(soup, html)

  bullets = extract_bullets(soup)
  specs = extract_specs(soup)

  sizes, colors = extract_variations(soup)
  category = extract_category(soup)
  # If variation sizes look like shoe sizes but the title/category look like dresses/apparel,
  # drop them so we fall back to apparel sizes via infer_sizes().
  if sizes and _looks_like_shoe_sizes(sizes):
    tl = (raw_title or "").lower()
    cl = (category or "").lower()
    apparel_hint = any(k in tl for k in ["dress","gown","jumpsuit","skirt","top","shirt","blouse","pants","legging","coat","jacket"]) or ("dress" in cl)
    shoe_hint = any(k in tl for k in ["sandal","sandals","heel","heels","pump","pumps","stiletto","platform","shoe","shoes"])
    if apparel_hint and not shoe_hint:
      sizes = []


  # If sizes missing, infer (so Size section can render)
  if not sizes:
    sizes = infer_sizes(raw_title, category, specs)

  reviews = extract_reviews(soup)
  review_avg, review_count = extract_review_summary(soup)
  customers_say = extract_customers_say(soup)

  size_chart = extract_size_chart(soup)

  # --------------------------------------------------
  # FALLBACK SIZE CHART (OPTION B)
  # --------------------------------------------------
  if not size_chart or not size_chart.get("html"):
    if sizes and any(s in ["XS","S","M","L","XL","XXL","2XL"] for s in sizes):
      size_chart = {
        "label": "Size chart",
        "href": None,
        "html": """
        <table class="size-chart">
          <thead>
            <tr>
              <th>Size</th>
              <th>Bust (in)</th>
              <th>Waist (in)</th>
              <th>Hips (in)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>XS</td><td>31-32</td><td>23-24</td><td>33-34</td></tr>
            <tr><td>S</td><td>33-34</td><td>25-26</td><td>35-36</td></tr>
            <tr><td>M</td><td>35-36</td><td>27-28</td><td>37-38</td></tr>
            <tr><td>L</td><td>37-39</td><td>29-31</td><td>39-41</td></tr>
            <tr><td>XL</td><td>40-42</td><td>32-34</td><td>42-44</td></tr>
          </tbody>
        </table>
        """
      }

  # Color + media from ImageBlock (unchanged)
  btf_swatches, color_images_by_color, btf_color_image_key = extract_btf_swatches_and_media(html)

  if color_images_by_color:
    # Ensure the final gallery contains at least one image per color,
    # otherwise color-click -> gallery mapping breaks when we cap to 80.
    must=[]
    for c, arr in color_images_by_color.items():
      if isinstance(arr, list) and arr:
        must.append(arr[0])

    base = uniq_keep_order(images)

    out=[]
    if base:
      out.append(base[0])  # keep hero first

    for u in must:
      if u and u not in out:
        out.append(u)

    for u in base[1:]:
      if u and u not in out:
        out.append(u)

    for arr in color_images_by_color.values():
      if isinstance(arr, list):
        for u in arr:
          if u and u not in out:
            out.append(u)

    images = out[:80]

  color_swatches = extract_color_swatches(soup)
  if btf_swatches:
    merged = dict(color_swatches)
    merged.update(btf_swatches)
    color_swatches = merged

  if color_swatches:
    colors = uniq_keep_order(colors + list(color_swatches.keys()))

  img_keys = {amazon_image_key(u): u for u in images}
  color_image_key = {}

  if btf_color_image_key:
    for c, k in btf_color_image_key.items():
      if k in img_keys:
        color_image_key[c] = k
  # Prefer mapping each color to its first gallery image (if present).
  if color_images_by_color:
    for c, arr in color_images_by_color.items():
      if c in color_image_key:
        continue
      if isinstance(arr, list) and arr:
        k = amazon_image_key(arr[0])
        if k in img_keys:
          color_image_key[c] = k


  for c, sw in color_swatches.items():
    if c in color_image_key:
      continue
    k = amazon_image_key(sw)
    if k in img_keys:
      color_image_key[c] = k

  aplus_images = extract_aplus_images(soup)
  aplus_images = uniq_keep_order([force_hd_amazon_image_url(u) for u in aplus_images if u])

  gallery_norm = set(normalize_image_url(u) for u in images)
  aplus_images = [u for u in aplus_images if normalize_image_url(u) not in gallery_norm]

  # Ensure A+ images are HD when possible (match against gallery pool)
  aplus_images = upgrade_images_to_hd(aplus_images, images)

  # If no A+ images exist, use HD gallery images as the description/A+ image set
  if not aplus_images:
    aplus_images = images[:]


  videos = extract_videos(html)

  return Extracted(
    asin=asin,
    title=raw_title,
    brand=brand,
    price=price,
    images=images,
    aplus_images=aplus_images,
    bullets=bullets,
    specs=specs,
    sizes=sizes,
    colors=colors,
    color_swatches=color_swatches,
    color_image_key=color_image_key,
    color_images=color_images_by_color,
    reviews=reviews,
    videos=videos,
    category=category,
    review_avg=review_avg,
    review_count=review_count,
    customers_say=customers_say,
    size_chart=size_chart,
  )

def slugify(s: str) -> str:
  s=s.lower()
  s=re.sub(r"[^a-z0-9]+","-",s)
  s=re.sub(r"-+","-",s).strip("-")
  return s or "product"

def parse_out_dir(argv: List[str]) -> Tuple[List[str], Path]:
  out_dir = Path("/Applications/product/static/products")
  args = argv[1:]
  if "--out" in args:
    i = args.index("--out")
    if i + 1 < len(args):
      out_dir = Path(args[i+1])
      args = args[:i] + args[i+2:]
  return args, out_dir

# -----------------------------
# Output batching (avoid huge single directories)
# -----------------------------
BATCH_SIZE = 20000

def get_batch_out_dir(base_out_dir: Path, product_index: int) -> Path:
  batch_num = product_index // BATCH_SIZE + 1
  return base_out_dir / f"batch_{batch_num:03d}"


def sku_from_index(i: int) -> str:
  return f"JC{1000 + i}"

def build_product_from_ex(ex: Extracted, rewritten_title: str, handle: str, sku: str) -> Dict[str,Any]:
  bought = social_proof_bought_past_month(ex.asin)

  about = about_this_item_200(ex.asin, rewritten_title, ex.bullets, ex.specs)

  cat_parts = parse_category_path(ex.category)
  cat_slug = category_slug_from_path(cat_parts)
  cat_leaf = (cat_parts[-1] if cat_parts else "")

  long_blocks = build_long_description_blocks(
    seed=ex.asin,
    title=rewritten_title,
    bullets=ex.bullets,
    specs=ex.specs,
    sizes=ex.sizes,
    colors=ex.colors,
    aplus_images=ex.aplus_images,
  )
  long_description = "\n\n".join([b.get("text","") for b in long_blocks if b.get("type")=="p"]).strip()

  prod = {
    "id": handle,
    "handle": handle,
    "sku": sku,
    "asin": ex.asin,

    "title": rewritten_title,
    "title_original": ex.title,
    "brand": ex.brand,

    "price": ex.price,
    "social_proof": {
      "bought_past_month": bought,
      "text": f"{bought}+ bought in the past month",
    },

    # strict image buckets
    "images": ex.images,                 # backward compat (gallery)
    "gallery_images": ex.images,
    "aplus_images": ex.aplus_images,
    "description_images": ex.aplus_images,

    "bullets": ex.bullets,
    "specs": ex.specs,
    "category": ex.category,
    "category_path": cat_parts,
    "category_slug": cat_slug,
    "category_leaf": cat_leaf,

    "variations": {
      "sizes": ex.sizes,
      "colors": ex.colors,
      "size_chart": ex.size_chart,
    },

    "reviews": {
      "average_rating": ex.review_avg,
      "count": ex.review_count,
      "customers_say": ex.customers_say,
      "items": ex.reviews,
    },

    "short_description": about,
    "about_this_item": about,

    "long_description": long_description,
    "long_description_blocks": long_blocks,

    "videos": ex.videos,

    "color_swatches": ex.color_swatches,
    "color_image_key": ex.color_image_key,
    "color_images": ex.color_images,
  }

  return prod


def main(argv: List[str]) -> int:
  html_files, out_dir = parse_out_dir(argv)
  if not html_files:
    print("Usage: amazon_html_to_pdp_json_v12.py [--out OUT_DIR] <html1> <html2> ...")
    return 2

  out_dir.mkdir(parents=True, exist_ok=True)

  # Allow passing a directory (expand to all .html files)
  expanded=[]
  for fp in html_files:
    p = Path(fp)
    if p.is_dir():
      expanded += [str(x) for x in sorted(p.rglob("*.html"), key=lambda z: str(z))]
    elif p.is_file():
      expanded.append(str(p))
  html_files = expanded
  if not html_files:
    print("No .html files found in inputs.")
    return 2

  products=[]
  asin_map={}
  index=[]

  sku_i = 0  # increments only when we write a product
  seen_asins = set()
  seen_handles = set()

  for fp in html_files:
    path = Path(fp)
    ex = parse_one(path)

    if ex.asin == "UNKNOWNASIN":
        print(f"⚠️ Skipping {path}: missing ASIN")
        continue

    if ex.asin in seen_asins:
        print(f"⚠️ Skipping duplicate ASIN {ex.asin} from {path}")
        continue

    seen_asins.add(ex.asin)


    rewritten_title = build_seo_title_v5(ex.asin, ex.category, ex.bullets, ex.specs)
    rewritten_title = sanitize_title_regex(rewritten_title)

    # stable handle: prefer rewritten title, but ensure not "product"
    base_handle = slugify(rewritten_title)
    if base_handle == "product":
      base_handle = slugify(f"{rewritten_title} {ex.asin}")

    # ensure uniqueness via numeric suffix (-1, -2, ...)
    handle = uniquify_handle(base_handle)

    prod_index = sku_i

    sku = sku_from_index(sku_i)
    sku_i += 1

    prod = build_product_from_ex(ex, rewritten_title, handle, sku)


    # Write product JSON using handle as filename (batched to avoid huge directories)
    prod_out_dir = get_batch_out_dir(out_dir, prod_index)
    prod_out_dir.mkdir(parents=True, exist_ok=True)
    out_path = prod_out_dir / f"{handle}.json"
    out_path.write_text(
      json.dumps(prod, ensure_ascii=False, separators=(",", ":")),
      encoding="utf-8",
    )

    products.append(prod)
    asin_map[ex.asin] = prod["id"]  # ASIN -> handle
    index.append({"id": prod["id"], "asin": ex.asin, "sku": prod["sku"], "title": prod["title"]})


  attach_cross_sells(products)

  # rewrite products after related arrays are attached
  for j, p in enumerate(products):
    prod_id = (p.get("id") or "").strip()
    if not prod_id:
      continue
    prod_out_dir = get_batch_out_dir(out_dir, j)
    prod_out_dir.mkdir(parents=True, exist_ok=True)
    pth = prod_out_dir / f"{prod_id}.json"
    pth.write_text(json.dumps(p, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

  # Build category index
  cat_index: Dict[str, Any] = {}
  for p in products:
    slug = (p.get("category_slug") or "uncategorized").strip() or "uncategorized"
    if slug not in cat_index:
      cat_index[slug] = {
        "slug": slug,
        "leaf": p.get("category_leaf") or "",
        "path": p.get("category_path") or [],
        "count": 0,
        "products": [],
      }
    cat_index[slug]["products"].append({
      "id": p.get("id"),
      "asin": p.get("asin"),
      "sku": p.get("sku"),
      "title": p.get("title"),
      "image": (p.get("images") or [None])[0],
    })
    cat_index[slug]["count"] += 1

  (out_dir / "_category_index.json").write_text(
    json.dumps(cat_index, ensure_ascii=False, separators=(",", ":")),
    encoding="utf-8",
  )
  print(f"✅ Wrote {out_dir / '_category_index.json'}")

  (out_dir / "_index.json").write_text(
    json.dumps(index, ensure_ascii=False, separators=(",", ":")),
    encoding="utf-8",
  )
  print(f"✅ Wrote {out_dir / '_index.json'}")

  (out_dir / "_asin_map.json").write_text(
    json.dumps(asin_map, ensure_ascii=False, separators=(",", ":")),
    encoding="utf-8",
  )
  print(f"✅ Wrote {out_dir / '_asin_map.json'}")

  return 0


if __name__ == "__main__":
  raise SystemExit(main(sys.argv))
