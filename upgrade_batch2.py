import os
import re
import colorsys
import json
import sqlite3

base_path = "C:\\00_Active_Projects\\App - Pallates\\Palattes by # of Colors"

# Extract foundational colors
foundational_files = {
    "primary": "10 Color Palette\\Founder OS Primary Brand Swatches.scss",
    "neutral": "10 Color Palette\\Founder OS Neutral Slate Swatches.scss",
    "success": "10 Color Palette\\Founder OS Success Brand Swatches.scss",
    "warning": "10 Color Palette\\Founder OS Accent Brand Swatches.scss",
    "danger": "10 Color Palette\\Founder OS Danger Brand Swatches.scss",
    "info": "10 Color Palette\\Founder OS Info Brand Swatches.scss",
}

foundational_colors = {}
for key, rel_path in foundational_files.items():
    fpath = os.path.join(base_path, rel_path)
    if not os.path.exists(fpath): continue
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

def generate_scss_content(pal_id, pal_name, intent, category_type, colors):
    count = len(colors)
    lines = []
    lines.append(f"/*---")
    lines.append(f"id: {pal_id}")
    lines.append(f"name: {pal_name}")
    lines.append(f"author: JaZeR-444")
    lines.append(f"version: 2.0.0")
    lines.append(f"category: Web Development System")
    lines.append(f"count: {count}")
    lines.append(f"tags:")
    lines.append(f"  project:")
    lines.append(f"  - Founder OS")
    lines.append(f"  swatchType:")
    lines.append(f"  - {category_type}")
    lines.append(f"  aesthetic:")
    lines.append(f"  - UI")
    lines.append(f"  - Enterprise")
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
        if hex_val.endswith("00") and len(hex_val) == 9:
             lines.append(f"--{name}: hsla(0, 0%, 0%, 0);")
             continue
        h, s, l = hex_to_hsl(hex_val)
        alpha = 1.0
        if len(hex_val) == 9:
            alpha = round(int(hex_val[7:9], 16) / 255.0, 2)
        lines.append(f"--{name}: hsla({h}, {s}%, {l}%, {alpha});")
    lines.append("}\n")
    
    lines.append("/* SCSS HEX */")
    for name, hex_val in colors:
        lines.append(f"${name}: {hex_val};")
        
    lines.append("\n/* SCSS Map */")
    lines.append(f"${pal_id}-map: (")
    map_lines = []
    for name, hex_val in colors:
        map_lines.append(f'    "{name}": {hex_val}')
    lines.append(",\n".join(map_lines))
    lines.append(");")
    
    return "\n".join(lines)


# 1. Gradient Brand Swatch (24 colors)
# We will provide explicit color stops (start, mid, end) for powerful gradients
gradient_colors = [
    ("gradient-primary-start", foundational_colors['primary']['400']),
    ("gradient-primary-end", foundational_colors['primary']['700']),
    ("gradient-success-start", foundational_colors['success']['300']),
    ("gradient-success-end", foundational_colors['success']['600']),
    ("gradient-warning-start", foundational_colors['warning']['300']),
    ("gradient-warning-end", foundational_colors['warning']['600']),
    ("gradient-danger-start", foundational_colors['danger']['400']),
    ("gradient-danger-end", foundational_colors['danger']['700']),
    ("gradient-info-start", foundational_colors['info']['300']),
    ("gradient-info-end", foundational_colors['info']['600']),
    ("gradient-neutral-start", foundational_colors['neutral']['100']),
    ("gradient-neutral-end", foundational_colors['neutral']['400']),
    
    # 3-stop complex gradients for marketing
    ("gradient-hero-start", foundational_colors['primary']['300']),
    ("gradient-hero-mid", foundational_colors['info']['500']),
    ("gradient-hero-end", foundational_colors['danger']['500']),
    
    ("gradient-mesh-1", foundational_colors['primary']['900']),
    ("gradient-mesh-2", foundational_colors['neutral']['900']),
    ("gradient-mesh-3", foundational_colors['primary']['800']),
    
    ("gradient-border-start", "#ffffff4d"), # 30% white
    ("gradient-border-mid", "#ffffff1a"),   # 10% white
    ("gradient-border-end", "#ffffff00"),   # 0% white
    
    ("gradient-skeleton-start", foundational_colors['neutral']['900']),
    ("gradient-skeleton-mid", foundational_colors['neutral']['800']),
    ("gradient-skeleton-end", foundational_colors['neutral']['900']),
]

# 2. Data Viz Diverging (22 colors)
# Diverging scales are mathematically stepped from extreme A -> neutral -> extreme B
data_viz_colors = [
    # Scale A: Danger (Red) to Success (Green)
    ("data-div-a-1", foundational_colors['danger']['700']),
    ("data-div-a-2", foundational_colors['danger']['500']),
    ("data-div-a-3", foundational_colors['danger']['300']),
    ("data-div-a-4", foundational_colors['danger']['100']),
    ("data-div-a-5", foundational_colors['neutral']['50']),   # Neutral midpoint
    ("data-div-a-6", foundational_colors['success']['100']),
    ("data-div-a-7", foundational_colors['success']['300']),
    ("data-div-a-8", foundational_colors['success']['500']),
    ("data-div-a-9", foundational_colors['success']['700']),
    
    # Scale B: Primary (Cyan) to Warning (Amber)
    ("data-div-b-1", foundational_colors['primary']['700']),
    ("data-div-b-2", foundational_colors['primary']['500']),
    ("data-div-b-3", foundational_colors['primary']['300']),
    ("data-div-b-4", foundational_colors['primary']['100']),
    ("data-div-b-5", foundational_colors['neutral']['50']),   # Neutral midpoint
    ("data-div-b-6", foundational_colors['warning']['100']),
    ("data-div-b-7", foundational_colors['warning']['300']),
    ("data-div-b-8", foundational_colors['warning']['500']),
    ("data-div-b-9", foundational_colors['warning']['700']),
    
    # Scale C: Extremes for heatmap edges
    ("data-div-extreme-low", foundational_colors['danger']['900']),
    ("data-div-extreme-mid", foundational_colors['neutral']['100']),
    ("data-div-extreme-high", foundational_colors['success']['900']),
    ("data-div-no-data", foundational_colors['neutral']['800']),
]

# 3. UI Background Swatch (20 colors)
# Focuses on layout canvas, structural fills, and app-level patterns
ui_bg_colors = [
    ("bg-canvas-base", foundational_colors['neutral']['900']),
    ("bg-canvas-subtle", foundational_colors['neutral']['900']),
    ("bg-canvas-inset", foundational_colors['neutral']['900']),
    ("bg-layout-header", foundational_colors['neutral']['900']),
    ("bg-layout-sidebar", foundational_colors['neutral']['900']),
    ("bg-layout-footer", foundational_colors['neutral']['900']),
    
    # Special Structural Backgrounds
    ("bg-dashed-fill", "#00000033"),
    ("bg-code-block", foundational_colors['neutral']['900']),
    ("bg-empty-state", foundational_colors['neutral']['900']),
    ("bg-well", foundational_colors['neutral']['900']),
    
    # Pattern & Grid Colors
    ("bg-pattern-grid", "#ffffff0a"), # 4% white grid lines
    ("bg-pattern-dots", "#ffffff14"), # 8% white dots
    ("bg-pattern-waves", "#ffffff05"),
    
    # App-level Glows
    ("bg-glow-spotlight", foundational_colors['primary']['900']),
    ("bg-glow-ambient", foundational_colors['neutral']['900']),
    
    # Image placeholders & media
    ("bg-media-placeholder", foundational_colors['neutral']['800']),
    ("bg-video-overlay", "#000000b3"), # 70% black
    
    # Utility
    ("bg-transparent", "#00000000"),
    ("bg-black-solid", "#000000ff"),
    ("bg-white-solid", "#ffffffff"),
]


comps = [
    ("founder-os-gradient-brand-swatches", "Founder OS Gradient Brand Swatches", "Individual color stops (start, mid, end) for complex linear, radial, and mesh gradients.", "gradients", gradient_colors),
    ("founder-os-data-viz-diverging", "Founder OS Data Viz Diverging", "Perfectly mathematically stepped diverging scales for complex charts and heatmaps.", "data", data_viz_colors),
    ("founder-os-ui-background-swatches", "Founder OS UI Background Swatches", "App-level canvas colors, layout backgrounds, structural fills, and pattern grids.", "surfaces", ui_bg_colors),
]

for pal_id, pal_name, intent, cat, cols in comps:
    count = len(cols)
    folder = f"{count} Color Palette"
    path = f"{folder}\\{pal_name}.scss"
    fpath = os.path.join(base_path, path)
    os.makedirs(os.path.dirname(fpath), exist_ok=True)
    
    content = generate_scss_content(pal_id, pal_name, intent, cat, cols)
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {path}")

# Purge from DB and JSON explicitly by ID (covering both name variations)
base_dir = "C:\\00_Active_Projects\\App - Pallates"
json_path = os.path.join(base_dir, "generated", "palettes.json")
db_path = os.path.join(base_dir, "generated", "palettes.db")

with open(json_path, "r", encoding="utf-8") as f:
    palettes = json.load(f)

ids_to_remove = [c[0] for c in comps] + [
    "founder-os-gradient-brand-swatches",
    "founder-os-data-viz-diverging",
    "founder-os-ui-background-swatches"
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
print("Purged old swatches from JSON and DB.")
