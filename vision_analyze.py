#!/usr/bin/env python3
"""
vision_analyze.py  –  Extract text from downloaded images using Gemini Vision
and update data.json with the extracted content.

Usage:
    set GEMINI_API_KEY=YOUR_KEY_HERE
    python vision_analyze.py

Requires:
    pip install google-generativeai pillow
"""
import json, os, re, sys, time
import google.generativeai as genai
import PIL.Image
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAtLl9gtF95bLS42sv1b5Z9V1a4HGqedWI")
if not API_KEY:
    print("ERROR: Set GEMINI_API_KEY environment variable first.")
    sys.exit(1)

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

DATA_JSON  = Path("data.json")
IMAGES_DIR = Path("images")

PROMPT = (
    "Tenhle obrázek pochází z Discord kanálu českého LSPD tréninkového systému (FiveM). "
    "Extrahuj VEŠKERÝ viditelný text přesně tak, jak se zobrazuje, v češtině. "
    "Zachovej nadpisy, odrážky, číslování i strukturu. "
    "Vrať POUZE extrahovaný text, bez komentářů. "
    "Pokud obrázek neobsahuje žádný čitelný text, vrať: ŽÁDNÝ TEXT"
)

def url_to_local(url):
    m = re.search(r'/attachments/(\d+)/(\d+)/([^?]+)', url)
    if m:
        return IMAGES_DIR / f"{m.group(1)}_{m.group(2)}_{m.group(3)}"
    return None

data = json.loads(DATA_JSON.read_text(encoding="utf-8"))

analyzed = 0
skipped  = 0
errors   = 0

for item in data:
    for msg in item["messages"]:
        # Only process messages that have attachments and empty/junk content
        if not msg.get("attachments"):
            continue
        cur = msg.get("content", "").strip()
        if cur and cur not in ("", "xxx", "[Příloha]"):
            skipped += 1
            continue   # already has real text

        url   = msg["attachments"][0]
        local = url_to_local(url)
        if not local or not local.exists():
            continue   # not downloaded (expired)

        sys.stdout.buffer.write(f"[{item['title']}] {local.name[:50]}\n".encode("utf-8"))
        try:
            img  = PIL.Image.open(local)
            resp = model.generate_content([PROMPT, img])
            text = resp.text.strip()
            if text and text != "ŽÁDNÝ TEXT":
                msg["content"] = text
                analyzed += 1
                preview = text[:80].replace('\n', ' ')
                sys.stdout.buffer.write(f"  -> {preview}...\n".encode("utf-8"))
            else:
                skipped += 1
        except Exception as e:
            errors += 1
            sys.stdout.buffer.write(f"  ERR: {e}\n".encode("utf-8"))

        time.sleep(1.2)   # rate limit

sys.stdout.buffer.write(f"\nAnalyzed: {analyzed}  Skipped: {skipped}  Errors: {errors}\n".encode("utf-8"))
DATA_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
sys.stdout.buffer.write("data.json updated!\n".encode("utf-8"))
