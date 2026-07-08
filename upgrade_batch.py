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
        if hex_val.endswith("00") and len(hex_val) == 9: # Fully transparent hack
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


# 1. Typography Swatch (16 colors)
typography_colors = [
    ("text-display", foundational_colors['neutral']['50']),
    ("text-heading", foundational_colors['neutral']['100']),
    ("text-primary", foundational_colors['neutral']['200']),
    ("text-secondary", foundational_colors['neutral']['400']),
    ("text-tertiary", foundational_colors['neutral']['500']),
    ("text-placeholder", foundational_colors['neutral']['600']),
    ("text-disabled", foundational_colors['neutral']['700']),
    ("text-inverse", foundational_colors['neutral']['900']),
    ("text-link", foundational_colors['primary']['400']),
    ("text-link-hover", foundational_colors['primary']['300']),
    ("text-brand", foundational_colors['primary']['500']),
    ("text-success", foundational_colors['success']['400']),
    ("text-warning", foundational_colors['warning']['400']),
    ("text-danger", foundational_colors['danger']['400']),
    ("text-code", foundational_colors['neutral']['300']),
    ("text-highlight", "#ffffff1a"),
]

# 2. Text On Brand Swatch (20 colors)
text_on_brand_colors = [
    ("text-on-primary", foundational_colors['primary']['900']),
    ("text-on-primary-subtle", foundational_colors['primary']['800']),
    ("text-on-primary-icon", foundational_colors['primary']['900']),
    ("text-on-neutral", foundational_colors['neutral']['900']),
    ("text-on-neutral-subtle", foundational_colors['neutral']['700']),
    ("text-on-success", foundational_colors['success']['900']),
    ("text-on-success-subtle", foundational_colors['success']['900']),
    ("text-on-warning", foundational_colors['warning']['900']),
    ("text-on-warning-subtle", foundational_colors['warning']['900']),
    ("text-on-danger", foundational_colors['danger']['900']),
    ("text-on-danger-subtle", foundational_colors['danger']['900']),
    ("text-on-inverse", foundational_colors['neutral']['50']),
    ("text-on-glass", "#ffffffff"),
    ("text-on-glass-subtle", "#ffffffb3"), # 70% white
    ("text-on-brand-accent", foundational_colors['primary']['50']),
    ("text-on-marketing-glow", foundational_colors['neutral']['900']),
    ("text-on-tooltip", foundational_colors['neutral']['900']),
    ("text-on-badge-strong", "#ffffffff"),
    ("text-on-badge-subtle", foundational_colors['neutral']['200']),
    ("text-on-black", foundational_colors['neutral']['300']),
]

# 3. Avatar & Presence Swatch (16 colors)
avatar_colors = [
    ("avatar-bg-1", foundational_colors['primary']['800']),
    ("avatar-bg-2", foundational_colors['success']['800']),
    ("avatar-bg-3", foundational_colors['warning']['800']),
    ("avatar-bg-4", foundational_colors['danger']['800']),
    ("avatar-text-1", foundational_colors['primary']['200']),
    ("avatar-text-2", foundational_colors['success']['200']),
    ("avatar-text-3", foundational_colors['warning']['200']),
    ("avatar-text-4", foundational_colors['danger']['200']),
    ("avatar-fallback-bg", foundational_colors['neutral']['800']),
    ("avatar-fallback-text", foundational_colors['neutral']['400']),
    ("presence-online", foundational_colors['success']['500']),
    ("presence-offline", foundational_colors['neutral']['500']),
    ("presence-busy", foundational_colors['danger']['500']),
    ("presence-away", foundational_colors['warning']['500']),
    ("presence-border", foundational_colors['neutral']['900']),
    ("avatar-ring", foundational_colors['primary']['500']),
]

# 4. Light Surface Swatch (24 colors)
surface_colors = [
    ("surface-page-bg", foundational_colors['neutral']['50']),
    ("surface-panel-bg", "#ffffffff"),
    ("surface-card-bg", "#ffffffff"),
    ("surface-card-hover", foundational_colors['neutral']['50']),
    ("surface-card-active", foundational_colors['neutral']['100']),
    ("surface-nested-bg", foundational_colors['neutral']['50']),
    ("surface-popover-bg", "#ffffffff"),
    ("surface-tooltip-bg", foundational_colors['neutral']['900']),
    ("surface-sidebar-bg", foundational_colors['neutral']['50']),
    ("surface-header-bg", "#ffffffff"),
    ("surface-modal-bg", "#ffffffff"),
    ("surface-backdrop", "#00000099"),
    ("surface-border-subtle", foundational_colors['neutral']['200']),
    ("surface-border-strong", foundational_colors['neutral']['300']),
    ("surface-divider", foundational_colors['neutral']['200']),
    ("surface-hover-overlay", "#0000000a"), # 4% black
    ("surface-active-overlay", "#00000014"), # 8% black
    ("surface-selected-bg", foundational_colors['primary']['50']),
    ("surface-selected-border", foundational_colors['primary']['200']),
    ("surface-brand-subtle", foundational_colors['primary']['50']),
    ("surface-success-subtle", foundational_colors['success']['50']),
    ("surface-warning-subtle", foundational_colors['warning']['50']),
    ("surface-danger-subtle", foundational_colors['danger']['50']),
    ("surface-skeleton", foundational_colors['neutral']['200']),
]

# 5. Glassmorphism Overlay Swatch (16 colors)
glass_colors = [
    ("glass-overlay-light", "#ffffff1a"),
    ("glass-overlay-mid", "#ffffff33"),
    ("glass-overlay-heavy", "#ffffff4d"),
    ("glass-overlay-dark", "#00000033"),
    ("glass-overlay-darker", "#00000066"),
    ("glass-panel-bg", "#090b10b3"), # Dark slate 70%
    ("glass-panel-border", "#ffffff1a"),
    ("glass-tooltip-bg", "#07090de6"), # Dark 90%
    ("glass-dropdown-bg", "#090b10cc"), # Dark 80%
    ("glass-scrim", "#00000099"),
    ("glass-tint-primary", "#00f0ff1a"),
    ("glass-tint-success", "#34d3991a"),
    ("glass-tint-danger", "#fb71851a"),
    ("glass-tint-warning", "#ffb8001a"),
    ("glass-shimmer", "#ffffff26"),
    ("glass-highlight", "#ffffff80"),
]

# 6. Brand Marketing Swatch (20 colors)
marketing_colors = [
    ("marketing-hero-bg", foundational_colors['neutral']['900']),
    ("marketing-hero-text", foundational_colors['neutral']['50']),
    ("marketing-primary-cta", foundational_colors['primary']['500']),
    ("marketing-primary-cta-hover", foundational_colors['primary']['400']),
    ("marketing-secondary-cta", foundational_colors['neutral']['800']),
    ("marketing-accent-1", foundational_colors['primary']['400']),
    ("marketing-accent-2", foundational_colors['warning']['500']), # Amber
    ("marketing-accent-3", foundational_colors['danger']['400']), # Magenta
    ("marketing-gradient-start", foundational_colors['primary']['500']),
    ("marketing-gradient-end", foundational_colors['danger']['500']),
    ("marketing-badge-bg", foundational_colors['primary']['900']),
    ("marketing-badge-text", foundational_colors['primary']['300']),
    ("marketing-feature-icon", foundational_colors['primary']['400']),
    ("marketing-feature-bg", foundational_colors['neutral']['900']),
    ("marketing-border-glow", foundational_colors['primary']['500']),
    ("marketing-footer-bg", foundational_colors['neutral']['900']),
    ("marketing-footer-text", foundational_colors['neutral']['400']),
    ("marketing-pricing-card", foundational_colors['neutral']['900']),
    ("marketing-pricing-popular", foundational_colors['primary']['900']),
    ("marketing-highlight-text", foundational_colors['primary']['300']),
]


comps = [
    ("founder-os-typography-swatches", "Founder OS Typography Swatches", "Comprehensive typography token system.", "component-states", typography_colors),
    ("founder-os-text-on-brand-swatches", "Founder OS Text On Brand Swatches", "Perfectly contrasted text-on-brand mapping.", "brand-scale", text_on_brand_colors),
    ("founder-os-avatar-presence-swatches", "Founder OS Avatar Presence Swatches", "Avatar backgrounds and semantic presence indicators.", "component-states", avatar_colors),
    ("founder-os-light-surface-swatches", "Founder OS Light Surface Swatches", "Enterprise light surface and layout backgrounds.", "surfaces", surface_colors),
    ("founder-os-glassmorphism-overlay-swatches", "Founder OS Glassmorphism Overlay Swatches", "Advanced translucent, tinted, and blur-ready glass overlays.", "surfaces", glass_colors),
    ("founder-os-brand-marketing-swatches", "Founder OS Brand Marketing Swatches", "High-conversion marketing tokens and gradients.", "marketing", marketing_colors),
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
    "founder-os-light-surface-swatches",
    "founder-os-text-on-brand-swatches",
    "founder-os-typography-swatches",
    "founder-os-brand-marketing-swatches",
    "founder-os-avatar-&-presence-swatches",
    "founder-os-avatar-presence-swatches",
    "founder-os-glassmorphism-overlay-swatches"
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
