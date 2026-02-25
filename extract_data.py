import os
import re
import json
import html
import hashlib

root_dir = r"c:\Users\guten\LSPD\LSPD Valtor"
output_file = r"c:\Users\guten\LSPD\training_data.js"

data = []

source_text = "LEO & PRÁVNÍ PŘÍRUČKA (CALIFORNIA) - Valtor (https://discord.gg/JaSEDd5N6E)"

def generate_id(text):
    return hashlib.md5(text.encode('utf-8')).hexdigest()[:12]

def clean_html_tags(text):
    # Basic cleaning of Discord HTML export tags
    text = text.replace('<br>', '\n').replace('<br />', '\n')
    text = re.sub(r'<ul>', '\n', text)
    text = re.sub(r'</ul>', '\n', text)
    text = re.sub(r'<li>(.*?)</li>', r'• \1\n', text, flags=re.DOTALL)
    text = re.sub(r'<.*?>', '', text)
    text = html.unescape(text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

def process_directory(directory, base_category=None):
    items = []
    current_category = base_category if base_category else os.path.basename(directory)
    
    print(f"Checking directory: {directory}")
    for entry in os.listdir(directory):
        full_path = os.path.join(directory, entry)
        if os.path.isdir(full_path):
            # Recursively process subdirectories
            items.extend(process_directory(full_path, current_category))
        elif entry.endswith(".html"):
            print(f"  Processing file: {entry}")
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                with open(full_path, 'r', encoding='cp1250') as f:
                    content = f.read()
            
            # Find all message contents - be more flexible with class names and attributes
            messages = re.findall(r'<div class="chatlog__content.*?>(.*?)</div>', content, flags=re.DOTALL)
            
            if not messages:
                # Try another common pattern
                messages = re.findall(r'<div class=chatlog__content.*?>(.*?)</div>', content, flags=re.DOTALL)
            
            if not messages:
                print(f"    SKIPPED: No messages found in {entry}")
                continue
            
            full_meaning = ""
            title = ""
            
            for msg in messages:
                # Extract potential titles from H1, H2, or bold text at start
                h1_match = re.search(r'<h[12]>(.*?)</h[12]>', msg)
                if h1_match and not title:
                    title = clean_html_tags(h1_match.group(1))
                
                cleaned_msg = clean_html_tags(msg)
                if not cleaned_msg:
                    continue
                    
                full_meaning += cleaned_msg + "\n\n"
            
            if not title:
                # If no H1/H2, try looking for the first bolded line in the content
                bold_match = re.search(r'\*\*(.*?)\*\*', full_meaning)
                if bold_match:
                    title = bold_match.group(1).split('\n')[0].strip()
            
            if not title:
                # Fallback title from filename
                title = entry.split('[')[0].split('┃')[-1].strip() if '┃' in entry else entry.split('[')[0].strip()
            
            # Final cleaning of the meaning (remove source mentions if they crept in)
            full_meaning = re.sub(r'Zdroj:.*', '', full_meaning, flags=re.IGNORECASE).strip()
            
            item_id = generate_id(f"{current_category}_{entry}") # Use filename in ID for better uniqueness
            
            items.append({
                "id": item_id,
                "title": title,
                "content": full_meaning if full_meaning else "Obsah nenalezen (pouze obrázky?)",
                "category": current_category,
                "source": source_text
            })
    return items

extracted_data = process_directory(root_dir)

# Save as JS array
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("const trainingDataRaw = ")
    json.dump(extracted_data, f, ensure_ascii=False, indent=2)
    f.write(";")

print(f"Extracted {len(extracted_data)} items to {output_file}")
