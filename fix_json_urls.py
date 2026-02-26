#!/usr/bin/env python3
import json, re
from pathlib import Path

DATA_JSON = Path("data.json")

def url_to_local(url):
    # Convert Discord CDN url to our local images/xxx format
    m = re.search(r'/attachments/(\d+)/(\d+)/([^?]+)', url)
    if m:
        return f"images/{m.group(1)}_{m.group(2)}_{m.group(3)}"
    return url

def main():
    if not DATA_JSON.exists(): return
    data = json.loads(DATA_JSON.read_text("utf-8"))
    
    replaced_count = 0
    clean_count = 0
    
    for item in data:
        for msg in item["messages"]:
            if "attachments" in msg:
                new_attachments = []
                for att in msg["attachments"]:
                    if "discordapp.com" in att or "discord.com" in att:
                        local_path = url_to_local(att)
                        new_attachments.append(local_path)
                        replaced_count += 1
                    else:
                        new_attachments.append(att)
                        clean_count += 1
                msg["attachments"] = new_attachments
                
    DATA_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False), "utf-8")
    print(f"Replaced {replaced_count} Discord Links with local paths.")
    print(f"Kept {clean_count} already local links.")

if __name__ == "__main__":
    main()
