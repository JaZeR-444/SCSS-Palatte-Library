import os
import json
import sqlite3
import datetime
from build_index import extract_metadata

def rgb_to_hsl(r, g, b):
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    mx = max(r, g, b)
    mn = min(r, g, b)
    df = mx - mn
    if mx == mn:
        h = 0
    elif mx == r:
        h = (60 * ((g - b) / df) + 360) % 360
    elif mx == g:
        h = (60 * ((b - r) / df) + 120) % 360
    elif mx == b:
        h = (60 * ((r - g) / df) + 240) % 360
    l = (mx + mn) / 2
    if mx == mn:
        s = 0
    elif l <= 0.5:
        s = df / (mx + mn)
    else:
        s = df / (2 - mx - mn)
    return round(h), round(s * 100), round(l * 100)

base_dir = r"C:\Users\JaZeR\OneDrive\Desktop\Projects\App - Pallates"
palettes_dir = os.path.join(base_dir, "Palattes by # of Colors")

new_palettes = []
for i in range(20, 36):
    folder_name = f"{i} Color Palette"
    folder_path = os.path.join(palettes_dir, folder_name)
    if os.path.exists(folder_path):
        for f in os.listdir(folder_path):
            if f.endswith(".scss"):
                path = os.path.join(folder_path, f).replace("\\", "/")
                meta, colors = extract_metadata(path)
                palette_id = f.replace(".scss", "").lower().replace(" ", "-")
                
                # Check if it was created today to only process new ones
                if meta.get("created") != datetime.date.today().strftime("%Y-%m-%d"):
                    continue
                
                # Populate color HSL/RGB from HEX
                enhanced_colors = []
                for idx, c in enumerate(colors):
                    hex_val = c["hex"]
                    hx = hex_val.lstrip('#')
                    if len(hx) == 8: hx = hx[:6]
                    r, g, b = tuple(int(hx[i:i+2], 16) for i in (0, 2, 4))
                    h, s, l = rgb_to_hsl(r, g, b)
                    enhanced_colors.append({
                        "name": c["name"],
                        "hex": hex_val,
                        "r": r, "g": g, "b": b,
                        "h": h, "s": s, "l": l
                    })

                new_palettes.append({
                    "id": palette_id,
                    "name": meta.get('name', f.replace(".scss", "")),
                    "description": meta.get('intent', f"A vibrant {i}-color palette."),
                    "author": meta.get('author', 'JaZeR-444'),
                    "version": meta.get('version', '1.0.0'),
                    "category": meta.get('category', 'Collection'),
                    "count": i,
                    "colors": enhanced_colors,
                    "path": path,
                    "folder": folder_name,
                    "tags": meta.get('tags', {}),
                    "created": meta.get('created', ''),
                    "updated": meta.get('updated', '')
                })

# Append to generated/palettes.json
json_path = os.path.join(base_dir, "generated", "palettes.json")
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Filter out if they already exist
existing_ids = {p["id"] for p in data}
added_count = 0
for p in new_palettes:
    if p["id"] not in existing_ids:
        data.append(p)
        added_count += 1

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4)

print(f"Added {added_count} palettes to palettes.json")

# Insert into generated/palettes.db
db_path = os.path.join(base_dir, "generated", "palettes.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

for p in new_palettes:
    if p["id"] in existing_ids:
        continue
    # palettes
    cursor.execute('''
        INSERT OR IGNORE INTO palettes (id, name, category, color_count, description, author, version, path, created, updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (p["id"], p["name"], p["category"], p["count"], p["description"], p["author"], p["version"], p["path"], p["created"], p["updated"]))
    
    # palette_colors
    for i, c in enumerate(p["colors"]):
        cursor.execute('''
            INSERT OR IGNORE INTO palette_colors (palette_id, color_index, name, hex, r, g, b, h, s, l)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (p["id"], i, c["name"], c["hex"], c["r"], c["g"], c["b"], c["h"], c["s"], c["l"]))
        
    # palette_tags
    tags = p["tags"]
    for tag_type, values in tags.items():
        if isinstance(values, list):
            for v in values:
                cursor.execute('''
                    INSERT OR IGNORE INTO palette_tags (palette_id, tag_type, tag_value)
                    VALUES (?, ?, ?)
                ''', (p["id"], tag_type, v))
                
    # palette_stats
    avg_l = sum(c["l"] for c in p["colors"]) / len(p["colors"]) if p["colors"] else 0
    contrast = (max(c["l"] for c in p["colors"]) - min(c["l"] for c in p["colors"])) if p["colors"] else 0
    hues = [c["h"] for c in p["colors"]]
    dom_h = max(set(hues), key=hues.count) if hues else 0
    vibrancy = sum(c["s"] for c in p["colors"]) / len(p["colors"]) if p["colors"] else 0
    cursor.execute('''
        INSERT OR IGNORE INTO palette_stats (palette_id, average_luminance, contrast_range, dominant_hue, vibrancy_score)
        VALUES (?, ?, ?, ?, ?)
    ''', (p["id"], avg_l, contrast, dom_h, vibrancy))

conn.commit()
conn.close()
print("Database update complete.")
