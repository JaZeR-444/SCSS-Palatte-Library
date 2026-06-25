import os
import json
import re
import yaml
import sqlite3
import csv

# --- Configuration ---
PALETTES_BASE_DIR = "Palattes by # of Colors"
FOLDERS = [f"{count} Color Palette" for count in range(3, 36)]

def extract_metadata(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract YAML front matter
    yaml_match = re.search(r'/\*---\n(.*?)\n---\*/', content, re.DOTALL)
    metadata = {}
    if yaml_match:
        try:
            metadata = yaml.safe_load(yaml_match.group(1))
        except Exception as e:
            print(f"Error parsing YAML in {path}: {e}")
    
    # Extract colors from CSS HEX section
    var_hex_pattern = r'--([\w-]+):\s*#([a-fA-F0-9]{6}|[a-fA-F0-9]{8});'
    color_matches = re.findall(var_hex_pattern, content)
    
    color_data = []
    seen_vars = set()
    for var_name, hex_val in color_matches:
        if var_name not in seen_vars:
            pretty_name = var_name.replace('-', ' ').title()
            color_data.append({
                "name": pretty_name,
                "hex": f"#{hex_val}"
            })
            seen_vars.add(var_name)
    
    return metadata, color_data

def build_indices():
    all_palettes = []
    print("[START] Starting Master Index synchronization...")

    for folder in FOLDERS:
        folder_path = os.path.join(PALETTES_BASE_DIR, folder)
        if not os.path.exists(folder_path):
            continue
            
        color_count = int(folder.split(' ')[0])
        for filename in os.listdir(folder_path):
            if filename.endswith(".scss"):
                path = os.path.join(folder_path, filename).replace("\\", "/")
                meta, colors = extract_metadata(path)
                
                palette_id = filename.replace(".scss", "").lower().replace(" ", "-")
                all_palettes.append({
                    "id": palette_id,
                    "name": meta.get('name', filename.replace(".scss", "")),
                    "description": meta.get('intent', f"A vibrant {color_count}-color palette."),
                    "author": meta.get('author', 'JaZeR-444'),
                    "version": meta.get('version', '1.0.0'),
                    "category": meta.get('category', 'Collection'),
                    "count": color_count,
                    "colors": colors,
                    "path": path,
                    "folder": folder,
                    "tags": meta.get('tags', {}),
                    "created": meta.get('created', ''),
                    "updated": meta.get('updated', '')
                })

    # Sort for consistency
    all_palettes.sort(key=lambda x: (x['count'], x['name']))

    # --- 1. Generate JSON (for Showcase) ---
    os.makedirs("showcase", exist_ok=True)
    with open("showcase/palettes.json", "w", encoding='utf-8') as f:
        json.dump(all_palettes, f, indent=4)
    print("[OK] Generated showcase/palettes.json")

    # --- 2. Generate CSV (for Spreadsheet) ---
    with open("master_index.csv", "w", encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Name", "Category", "Count", "Colors (HEX)", "Moods", "Aesthetics"])
        for p in all_palettes:
            hex_list = ", ".join([c['hex'] for c in p['colors']])
            moods = ", ".join(p['tags'].get('mood', [])) if isinstance(p['tags'], dict) else ""
            aesthetics = ", ".join(p['tags'].get('aesthetic', [])) if isinstance(p['tags'], dict) else ""
            writer.writerow([p['id'], p['name'], p['category'], p['count'], hex_list, moods, aesthetics])
    print("[OK] Generated master_index.csv")

    # --- 3. Generate Markdown (for GitHub) ---
    with open("PALETTES.md", "w", encoding='utf-8', newline='\n') as f:
        f.write("# Palette Library Master Manifest\n\n")
        f.write(f"*Total Palettes: {len(all_palettes)}*\n\n")
        f.write("| ID | Palette Name | Category | Count | Colors Preview |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for p in all_palettes:
            # Create small visual blocks using Unicode squares or HTML spans
            swatches = "".join([f'<span title="{c["name"]}: {c["hex"]}"><img src="https://placehold.co/12x12/{c["hex"].replace("#","")}/{c["hex"].replace("#","")}.png" /></span>' for c in p['colors']])
            f.write(f"| `{p['id']}` | **{p['name']}** | {p['category']} | {p['count']} | {swatches} |\n")
    print("[OK] Generated PALETTES.md")

    # --- 4. Generate SQLite (for Querying) ---
    db_path = "palettes.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create Table
    cursor.execute('''
        CREATE TABLE palettes (
            id TEXT PRIMARY KEY,
            name TEXT,
            category TEXT,
            color_count INTEGER,
            description TEXT,
            author TEXT,
            version TEXT,
            path TEXT,
            colors_json TEXT,
            tags_json TEXT
        )
    ''')
    
    for p in all_palettes:
        cursor.execute('''
            INSERT INTO palettes (id, name, category, color_count, description, author, version, path, colors_json, tags_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            p['id'], p['name'], p['category'], p['count'], p['description'], 
            p['author'], p['version'], p['path'], json.dumps(p['colors']), json.dumps(p['tags'])
        ))
    
    conn.commit()
    conn.close()
    print("[OK] Generated palettes.db")

if __name__ == "__main__":
    build_indices()
