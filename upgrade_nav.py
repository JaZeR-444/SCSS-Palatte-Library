import os
import re
import colorsys
import json
import sqlite3

base_path = "C:\\00_Active_Projects\\App - Pallates\\Palattes by # of Colors"

# 1. Delete old file
old_f = "12 Color Palette\\Founder OS Navigation Sidebar Swatches.scss"
fpath = os.path.join(base_path, old_f)
if os.path.exists(fpath):
    os.remove(fpath)
    print(f"Removed old file: {old_f}")

# 2. Extract foundational colors
foundational_files = {
    "primary": "10 Color Palette\\Founder OS Primary Brand Swatches.scss",
    "neutral": "10 Color Palette\\Founder OS Neutral Slate Swatches.scss",
}

foundational_colors = {}
for key, rel_path in foundational_files.items():
    fpath = os.path.join(base_path, rel_path)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    hex_block = re.search(r'/\* CSS HEX \*/(.*?)/\* CSS HSL \*/', content, re.DOTALL).group(1)
    color_map = {}
    for match in re.finditer(r'--.*?([0-9]{2,3}).*?:\s*(#[0-9a-fA-F]{8});', hex_block):
        color_map[match.group(1)] = match.group(2)
    foundational_colors[key] = color_map

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def hex_to_hsl(hex_color):
    r, g, b = hex_to_rgb(hex_color[:7])
    h, l, s = colorsys.rgb_to_hls(r/255.0, g/255.0, b/255.0)
    return round(h*360), round(s*100), round(l*100)

def generate_scss_content(pal_id, pal_name, count, intent, category_type, colors):
    lines = []
    lines.append(f"/*---")
    lines.append(f"id: {pal_id}")
    lines.append(f"name: {pal_name}")
    lines.append(f"author: JaZeR-444")
    lines.append(f"version: 1.1.0")
    lines.append(f"category: Web Development System")
    lines.append(f"count: {count}")
    lines.append(f"tags:")
    lines.append(f"  project:")
    lines.append(f"  - Founder OS")
    lines.append(f"  swatchType:")
    lines.append(f"  - {category_type}")
    lines.append(f"  mood:")
    lines.append(f"  - dark")
    lines.append(f"  - functional")
    lines.append(f"  aesthetic:")
    lines.append(f"  - UI")
    lines.append(f"  - Web Design")
    lines.append(f"intent: {intent}")
    lines.append(f"url: https://founder.os/")
    lines.append(f"created: '2026-07-08'")
    lines.append(f"updated: '2026-07-08'")
    lines.append(f"---*/\n")
    
    lines.append(":root {")
    lines.append("/* CSS HEX */")
    for name, hex_val in colors:
        lines.append(f"--{name}: {hex_val};")
        
    lines.append("\n/* CSS HSL */")
    for name, hex_val in colors:
        h, s, l = hex_to_hsl(hex_val)
        lines.append(f"--{name}: hsla({h}, {s}%, {l}%, 1);")
    lines.append("}\n")
    
    lines.append("/* SCSS HEX */")
    for name, hex_val in colors:
        lines.append(f"${name}: {hex_val};")
        
    lines.append("\n/* SCSS HSL */")
    for name, hex_val in colors:
        h, s, l = hex_to_hsl(hex_val)
        lines.append(f"${name}: hsla({h}, {s}%, {l}%, 1);")
        
    lines.append("\n/* SCSS RGB */")
    for name, hex_val in colors:
        r, g, b = hex_to_rgb(hex_val[:7])
        lines.append(f"${name}: rgba({r}, {g}, {b}, 1);")
        
    lines.append("\n/* SCSS Gradient */")
    hex_list = ", ".join(c[1] for c in colors)
    lines.append(f"$gradient-top: linear-gradient(0deg, {hex_list});")
    lines.append(f"$gradient-right: linear-gradient(90deg, {hex_list});")
    lines.append(f"$gradient-bottom: linear-gradient(180deg, {hex_list});")
    lines.append(f"$gradient-left: linear-gradient(270deg, {hex_list});")
    lines.append(f"$gradient-top-right: linear-gradient(45deg, {hex_list});")
    lines.append(f"$gradient-bottom-right: linear-gradient(135deg, {hex_list});")
    lines.append(f"$gradient-top-left: linear-gradient(225deg, {hex_list});")
    lines.append(f"$gradient-bottom-left: linear-gradient(315deg, {hex_list});")
    lines.append(f"$gradient-radial: radial-gradient({hex_list});\n")
    
    lines.append("/* SCSS Map */")
    lines.append(f"${pal_id}-map: (")
    map_lines = []
    for name, hex_val in colors:
        map_lines.append(f'    "{name}": {hex_val}')
    lines.append(",\n".join(map_lines))
    lines.append(");")
    
    return "\n".join(lines)


# 3. Define and save the new 20-token component
comp = {
    "id": "founder-os-navigation-sidebar-swatches",
    "name": "Founder OS Navigation Sidebar Swatches",
    "path": "20 Color Palette\\Founder OS Navigation Sidebar Swatches.scss",
    "count": 20,
    "type": "component-states",
    "intent": "Advanced Navigation & Sidebar token system perfectly mapped to foundations. Includes sub-navigation states, topbar borders, active icons, and mobile scrims.",
    "colors": [
        ("nav-sidebar-bg", foundational_colors['neutral']['900']),
        ("nav-sidebar-border", foundational_colors['neutral']['800']),
        ("nav-item-default-text", foundational_colors['neutral']['400']),
        ("nav-item-hover-bg", foundational_colors['neutral']['800']),
        ("nav-item-hover-text", foundational_colors['neutral']['200']),
        
        ("nav-item-active-bg", foundational_colors['primary']['900']),
        ("nav-item-active-text", foundational_colors['primary']['400']),
        ("nav-item-active-indicator", foundational_colors['primary']['500']),
        
        ("nav-icon-default", foundational_colors['neutral']['500']),
        ("nav-icon-active", foundational_colors['primary']['400']),
        
        ("nav-subitem-hover-bg", foundational_colors['neutral']['800']),
        ("nav-subitem-active-text", foundational_colors['primary']['300']),
        
        ("nav-section-label-text", foundational_colors['neutral']['500']),
        
        ("nav-topbar-bg", foundational_colors['neutral']['900']),
        ("nav-topbar-border", foundational_colors['neutral']['800']),
        
        ("nav-breadcrumb-text", foundational_colors['neutral']['500']),
        ("nav-breadcrumb-hover-text", foundational_colors['neutral']['200']),
        
        ("nav-tab-indicator", foundational_colors['primary']['500']),
        ("nav-tab-text", foundational_colors['neutral']['400']),
        
        ("nav-mobile-backdrop", "#00000099")
    ]
}

d = os.path.dirname(os.path.join(base_path, comp["path"]))
os.makedirs(d, exist_ok=True)
fpath = os.path.join(base_path, comp["path"])
content = generate_scss_content(comp["id"], comp["name"], comp["count"], comp["intent"], comp["type"], comp["colors"])
with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Created upgraded file: {comp['path']}")

# 4. Purge from DB and JSON explicitly by ID (covering both name variations)
base_dir = "C:\\00_Active_Projects\\App - Pallates"
json_path = os.path.join(base_dir, "generated", "palettes.json")
db_path = os.path.join(base_dir, "generated", "palettes.db")

with open(json_path, "r", encoding="utf-8") as f:
    palettes = json.load(f)

ids_to_remove = [
    "founder-os-navigation-sidebar-swatches",
    "founder-os-navigation-&-sidebar-swatches"
]

palettes = [p for p in palettes if p["id"] not in ids_to_remove]

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(palettes, f, indent=4)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

for pid in ids_to_remove:
    cursor.execute("DELETE FROM palettes WHERE id = ?", (pid,))
    cursor.execute("DELETE FROM palette_colors WHERE palette_id = ?", (pid,))
    cursor.execute("DELETE FROM palette_tags WHERE palette_id = ?", (pid,))
    cursor.execute("DELETE FROM palette_stats WHERE palette_id = ?", (pid,))
    
conn.commit()
conn.close()
print("Purged old Navigation swatches from JSON and DB.")
