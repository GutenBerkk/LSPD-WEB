#!/usr/bin/env python3
import json, os, unicodedata, sys
from pathlib import Path

# Fix terminal unicode errors
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

DATA_JSON = Path("data.json")

def word_to_num(word):
    w = str(word).lower().strip()
    mapping = {
        "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
        "sixth": 6, "seventh": 7, "eighth": 8, "eight": 8, "ninth": 9, "nineth": 9, 
        "tenth": 10, "eleventh": 11, "twelfth": 12, "tvelveth": 12, "twelveth": 12,
        "thirteenth": 13, "thirth": 13.5, "13": 13, "14": 14, "15": 15, "16": 16,
        "17": 17, "18": 18, "19": 19, "20": 20, "21": 21, "22": 22
    }
    if w.isdigit(): return int(w)
    return mapping.get(w, 999)

def normalize(t):
    # remove diacritics and make lowercase for easy matching
    t = unicodedata.normalize('NFKD', t).encode('ASCII', 'ignore').decode('utf-8')
    t = t.lower().replace("-", "").replace("_", "").replace(" ", "")
    return t

def main():
    if not DATA_JSON.exists(): return
    data = json.loads(DATA_JSON.read_text("utf-8"))
    
    # User folders exactly as requested
    user_folders = [
        "otisky", "PD stanice", "PD vybavení", "Průzkum střely", 
        "rádiové kódy", "služební slib", "typy omezeni", 
        "vstup kancelář", "Vybavení vozidla", "Zajištění totožnosti"
    ]
    
    all_modules = [(item["category"], item["title"]) for item in data]

    # Custom mapping logic since exact names differ
    for folder_name in user_folders:
        folder_path = Path(folder_name)
        if not folder_path.exists():
            print(f"Skipping {folder_name}: folder not found on disk.")
            continue
            
        norm_folder = normalize(folder_name)
        
        # Determine the target module title
        target_cat, target_title = None, None
        
        # Hardcoded specific matches based on user context
        if folder_name == "otisky": target_title = "kriminalistické-obory"
        elif folder_name == "PD stanice": target_title = "pd-stanice"
        elif folder_name == "PD vybavení": target_title = "služební-vybavení"
        elif folder_name == "Vybavení vozidla": target_title = "vybavení-vozidla"
        elif folder_name == "Průzkum střely": target_title = "průzkum-střely"
        else:
            # Dynamic matching for the rest
            for c, t in all_modules:
                nt = normalize(t)
                if norm_folder in nt or nt in norm_folder:
                    target_cat, target_title = c, t
                    break
            # Fallback for slight mismatches
            if not target_title:
                if folder_name == "Průzkum střely": target_title = "průběh-střelby"
                if folder_name == "vstup kancelář": target_title = "vstup-do-kanceláře"
                if folder_name == "Zajištění totožnosti": target_title = "zjištění-totožnosti"
                if folder_name == "typy omezeni": target_title = "typy-omezení"
                if folder_name == "rádiové kódy": target_title = "radiové-kódy"
                if folder_name == "služební slib": target_title = "služební-přísaha"

        # Find category if we only set title
        if target_title and not target_cat:
            for c, t in all_modules:
                if t == target_title or normalize(t) == normalize(target_title):
                    target_cat, target_title = c, t
                    break

        if not target_title:
            print(f"Failed to find mapping for {folder_name}")
            continue

        files = list(folder_path.glob("*.png")) + list(folder_path.glob("*.jpg")) + list(folder_path.glob("*.jpeg"))
        files.sort(key=lambda f: word_to_num(f.stem))
        
        for item in data:
            if item["category"] == target_cat and item["title"] == target_title:
                msg_list = item["messages"]
                
                # We inject images sequentially into empty/existing messages
                # Find messages that either have NO attachments, or just append new ones.
                # First, clear any previously injected manual images from this folder to avoid duplicates if rerunning
                for m in msg_list:
                    if "attachments" in m:
                        m["attachments"] = [a for a in m["attachments"] if not a.startswith(f"{folder_name}/")]
                
                # Now inject
                img_idx = 0
                for f in files:
                    path_str = f"{folder_name}/{f.name}"
                    
                    # find first message with no attachments
                    found_slot = False
                    for m in msg_list:
                        # Only inject into msg if it has actual text content, and no attachments
                        if not m.get("attachments") and m.get("content", "").strip() != "":
                            if "attachments" not in m: m["attachments"] = []
                            m["attachments"].append(path_str)
                            found_slot = True
                            break
                            
                    if not found_slot:
                        # No empty slot found, append a new message structure
                        msg_list.append({
                            "author": "Valtor",
                            "timestamp": "",
                            "content": "",
                            "attachments": [path_str]
                        })
                    img_idx += 1
                
                print(f"Mapped: '{folder_name}' -> {target_title} ({img_idx} images)")

    DATA_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False), "utf-8")
    print("Done merging all.")

if __name__ == "__main__":
    main()
