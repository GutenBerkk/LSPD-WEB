# -*- coding: utf-8 -*-
import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data.json', encoding='utf-8') as f:
    data = json.load(f)

missing = []
for item in data:
    for msg in item['messages']:
        for att in msg.get('attachments', []):
            path = att.replace('/', os.sep)
            if not os.path.exists(path):
                missing.append((item['title'], att))

print(f'Total missing: {len(missing)}')
for title, att in missing:
    print(f'  [{title}] {att}')
