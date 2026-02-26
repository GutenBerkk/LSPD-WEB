import json, os
from pathlib import Path

# Folders to check and what category/title they map to in data.json
folder_mapping = {
    "otisky":       ("CRIMINAL MATERIÁLY", "kriminalistické-obory"),
    "PD stanice":   ("POKROČILÉ MATERIÁLY", "pd-stanice"),
    "PD vybavení":  ("POKROČILÉ MATERIÁLY", "služební-vybavení")
}

DATA_JSON = Path("data.json")

def word_to_num(word):
    w = str(word).lower().strip()
    mapping = {
        "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
        "sixth": 6, "seventh": 7, "eighth": 8, "eight": 8, "ninth": 9, "nineth": 9, 
        "tenth": 10, "eleventh": 11, "twelfth": 12, "tvelveth": 12, "twelveth": 12,
        "thirteenth": 13, "thirth": 13, "13": 13, "14": 14, "15": 15, "16": 16,
        "17": 17, "18": 18, "19": 19, "20": 20, "21": 21, "22": 22
    }
    if w.isdigit(): return int(w)
    return mapping.get(w, 999)

def main():
    if not DATA_JSON.exists(): return
    data = json.loads(DATA_JSON.read_text("utf-8"))
    
    for folder_name, (cat, title) in folder_mapping.items():
        folder_path = Path(folder_name)
        if not folder_path.exists():
            print(f"Directory {folder_name} missing.")
            continue
            
        # Get files and sort them based on name (first, second...)
        files = list(folder_path.glob("*.png")) + list(folder_path.glob("*.jpg"))
        files.sort(key=lambda f: word_to_num(f.stem))
        
        # Now find the category & module in data
        for item in data:
            if item["category"] == cat and item["title"] == title:
                # We want to replace or add to the existing messages.
                # The user says "first is on top, second is below that". 
                # We can just iterate through messages and attach images in order.
                msg_list = item["messages"]
                
                img_idx = 0
                for f in files:
                    path_str = f"{folder_name}/{f.name}"
                    
                    found_empty = False
                    for m in msg_list:
                        if not m.get("attachments") and m.get("content", "").strip() != "":
                            m["attachments"] = [path_str]
                            found_empty = True
                            break
                            
                    if not found_empty:
                        # Append to the end if all have attachments or are empty
                        msg_list.append({
                            "author": "LSPD",
                            "timestamp": "",
                            "content": "",
                            "attachments": [path_str]
                        })
                    img_idx += 1
                print(f"Added {img_idx} images from {folder_name} to {cat} / {title}")

    DATA_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False), "utf-8")
    print("Updated data.json with manual images.")

if __name__ == "__main__":
    main()
