# -*- coding: utf-8 -*-
"""
Fix broken image paths in data.json by mapping them to local folder files.
Only fixes modules that have corresponding local folders.
"""
import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data.json', encoding='utf-8') as f:
    data = json.load(f)

# Maps: module title -> list of replacement paths in ORDER
# Each list entry replaces the Nth broken image in that module (in order of appearance)
REPLACEMENTS = {
    "asertivní-techniky": [
        "asertivní techniky/First.png",    # replaces 1st broken image
        "asertivní techniky/second.png",   # replaces 2nd broken image
        "asertivní techniky/thirth.png",   # replaces 3rd broken image
        "asertivní techniky/fourth.png",   # replaces 4th broken image
    ],
    "kriminalistika": [
        "Kriminalistika/First krimi.png",  # 1st
        "Kriminalistika/second krimi.png", # 2nd
        "Kriminalistika/thirt krimi.png",  # 3rd
        "Kriminalistika/fourth krimi.png", # 4th
        "Kriminalistika/fifth.png",        # 5th
        "Kriminalistika/sixht krimi.png",  # 6th
        "Kriminalistika/seventh krimi.png",# 7th
    ],
    "law-enforcement": [
        "Law enforcment/first.png",    # 1st
        "Law enforcment/second.png",   # 2nd
        "Law enforcment/thirth.png",   # 3rd
    ],
    "department-policy": [
        "Department policy/first.png", # 1st
    ],
}

import os

def is_broken(path):
    """Return True if the path does not exist on disk."""
    return not os.path.exists(path.replace('/', os.sep))

changes = 0
for item in data:
    title = item['title']
    if title not in REPLACEMENTS:
        continue
    replacements = REPLACEMENTS[title]
    replacement_idx = 0
    for msg in item['messages']:
        if not msg.get('attachments'):
            continue
        new_atts = []
        for att in msg['attachments']:
            if is_broken(att) and replacement_idx < len(replacements):
                new_path = replacements[replacement_idx]
                print(f"[{title}] Replacing {att} -> {new_path}")
                new_atts.append(new_path)
                replacement_idx += 1
                changes += 1
            else:
                new_atts.append(att)
        msg['attachments'] = new_atts

print(f"\nTotal replacements made: {changes}")

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("data.json updated successfully.")
