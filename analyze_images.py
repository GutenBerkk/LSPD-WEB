#!/usr/bin/env python3
"""
analyze_images.py
-----------------
1. Downloads all Discord CDN images from data.json to images/ folder
2. Analyzes each image with Gemini Vision to extract Czech text content
3. Updates data.json with the extracted content

Requirements:
  pip install google-generativeai requests pillow
  GEMINI_API_KEY environment variable must be set (or hardcode below)
"""

import json, os, re, sys, hashlib, time
import requests
from pathlib import Path

# ── CONFIG ────────────────────────────────────────────────────
DATA_JSON   = Path("data.json")
IMAGES_DIR  = Path("images")
OUTPUT_JSON = Path("data.json")  # overwrite in place
DELAY_SEC   = 1.5                # polite delay between API calls

# Set your Gemini API key here OR via env variable GEMINI_API_KEY
API_KEY = os.environ.get("GEMINI_API_KEY", "")

MODEL_NAME = "gemini-1.5-flash"


PROMPT = """This image is from a Czech law enforcement Discord training channel (LSPD FiveM).
Please extract ALL visible text from this image exactly as it appears, in Czech.
Format it clearly. If there are headers, bullet points, tables or numbered lists, preserve them.
If the image is a screenshot of a chat message or document, extract all text content.
Return ONLY the extracted text, nothing else. If no text is visible, return 'ŽÁDNÝ TEXT'."""

# ── SETUP ─────────────────────────────────────────────────────
IMAGES_DIR.mkdir(exist_ok=True)

def url_to_filename(url: str) -> str:
    """Convert a Discord CDN URL to a stable local filename."""
    # Extract the attachment ID from the path
    m = re.search(r'/attachments/(\d+)/(\d+)/([^?]+)', url)
    if m:
        channel_id, msg_id, name = m.group(1), m.group(2), m.group(3)
        return f"{channel_id}_{msg_id}_{name}"
    # Fallback: hash the URL
    return hashlib.md5(url.encode()).hexdigest() + ".png"

def download_image(url: str) -> Path | None:
    """Download image to local file. Returns path or None on error."""
    fname = IMAGES_DIR / url_to_filename(url)
    if fname.exists():
        sys.stdout.buffer.write(f"  [SKIP] {fname.name} (already downloaded)\n".encode('utf-8'))
        return fname
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        fname.write_bytes(r.content)
        sys.stdout.buffer.write(f"  [DL]   {fname.name}\n".encode('utf-8'))
        return fname
    except Exception as e:
        sys.stdout.buffer.write(f"  [ERR]  {url[:60]}... {e}\n".encode('utf-8'))
        return None

def analyze_image(img_path: Path, genai_module) -> str:
    """Use Gemini Vision to extract text from an image."""
    import PIL.Image
    try:
        img = PIL.Image.open(img_path)
        model = genai_module.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content([PROMPT, img])
        text = response.text.strip()
        if text == "ŽÁDNÝ TEXT":
            return ""
        return text
    except Exception as e:
        sys.stdout.buffer.write(f"  [VISION ERR] {img_path.name}: {e}\n".encode('utf-8'))
        return ""

# ── MAIN ──────────────────────────────────────────────────────
def main():
    if not API_KEY:
        print("ERROR: GEMINI_API_KEY not set. Set it in environment or edit this script.")
        sys.exit(1)

    import google.generativeai as genai
    genai.configure(api_key=API_KEY)

    # Load data.json
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))

    # Phase 1: Download all images
    sys.stdout.buffer.write("\n=== PHASE 1: Downloading images ===\n".encode('utf-8'))
    url_to_local: dict[str, Path] = {}
    for item in data:
        for msg in item["messages"]:
            for url in msg.get("attachments", []):
                if url not in url_to_local:
                    local = download_image(url)
                    url_to_local[url] = local

    downloaded = sum(1 for v in url_to_local.values() if v)
    sys.stdout.buffer.write(f"\nDownloaded: {downloaded}/{len(url_to_local)}\n".encode('utf-8'))

    # Phase 2: Analyze with Gemini Vision and update data
    sys.stdout.buffer.write("\n=== PHASE 2: Analyzing images with Gemini Vision ===\n".encode('utf-8'))
    analyzed = 0
    for item in data:
        for msg in item["messages"]:
            attachments = msg.get("attachments", [])
            if not attachments:
                continue
            if msg.get("content", "").strip() not in ("", "xxx"):
                continue  # already has text content, skip

            # Analyze the first image (usually one per message)
            url = attachments[0]
            local = url_to_local.get(url)
            if not local:
                continue

            sys.stdout.buffer.write(f"  Analyzing {local.name} ({item['title']})...\n".encode('utf-8'))
            extracted = analyze_image(local, genai)

            if extracted:
                msg["content"] = extracted
                analyzed += 1
                sys.stdout.buffer.write(f"    -> {extracted[:80].replace(chr(10), ' ')}...\n".encode('utf-8'))
            
            time.sleep(DELAY_SEC)

    sys.stdout.buffer.write(f"\nAnalyzed: {analyzed} images\n".encode('utf-8'))

    # Phase 3: Save updated data.json
    OUTPUT_JSON.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    sys.stdout.buffer.write("data.json updated!\n".encode('utf-8'))

if __name__ == "__main__":
    main()
