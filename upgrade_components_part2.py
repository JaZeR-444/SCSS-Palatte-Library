import os
import re
import colorsys

base_path = "C:\\00_Active_Projects\\App - Pallates\\Palattes by # of Colors"

# Files to delete (including the one we just made for Tags)
old_files = [
    "12 Color Palette\\Founder OS Form Input State Swatches.scss",
    "10 Color Palette\\Founder OS Light Surface Swatches.scss",
    "10 Color Palette\\Founder OS Elevation Shadow Swatches.scss",
    "28 Color Palette\\Founder OS Tag Label Swatches.scss"
]

for old_f in old_files:
    fpath = os.path.join(base_path, old_f)
    if os.path.exists(fpath):
        os.remove(fpath)
        print(f"Removed old file: {old_f}")

foundational_files = {
    "primary": "10 Color Palette\\Founder OS Primary Brand Swatches.scss",
    "accent": "10 Color Palette\\Founder OS Accent Brand Swatches.scss",
    "success": "10 Color Palette\\Founder OS Success Brand Swatches.scss",
    "danger": "10 Color Palette\\Founder OS Danger Brand Swatches.scss",
    "info": "10 Color Palette\\Founder OS Info Brand Swatches.scss",
    "neutral": "10 Color Palette\\Founder OS Neutral Slate Swatches.scss",
    "tertiary": "10 Color Palette\\Founder OS Tertiary Brand Swatches.scss"
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
    lines.append(f"version: 1.2.0")
    lines.append(f"category: Web Development System")
    lines.append(f"count: {count}")
    lines.append(f"tags:")
    lines.append(f"  project:")
    lines.append(f"  - Founder OS")
    lines.append(f"  swatchType:")
    lines.append(f"  - {category_type}")
    lines.append(f"  mood:")
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


transparent = "#00000000"
white = "#ffffffff"
black_backdrop = "#00000066"

components = [
    {
        "id": "founder-os-form-input-state-swatches",
        "name": "Founder OS Form Input State Swatches",
        "path": "20 Color Palette\\Founder OS Form Input State Swatches.scss",
        "count": 20,
        "type": "component-states",
        "intent": "Comprehensive form input states mapped to foundational scales. Now includes Disabled, Readonly, Placeholder, and Interactive Hover borders.",
        "colors": [
            ("input-neutral-bg", foundational_colors['neutral']['50']),
            ("input-neutral-border", foundational_colors['neutral']['400']),
            ("input-neutral-hover-border", foundational_colors['neutral']['500']),
            ("input-neutral-text", foundational_colors['neutral']['900']),
            ("input-placeholder", foundational_colors['neutral']['400']),
            
            ("input-focus-bg", white),
            ("input-focus-border", foundational_colors['primary']['500']),
            ("input-focus-text", foundational_colors['neutral']['900']),
            
            ("input-valid-bg", foundational_colors['success']['50']),
            ("input-valid-border", foundational_colors['success']['500']),
            ("input-valid-text", foundational_colors['success']['900']),
            
            ("input-error-bg", foundational_colors['danger']['50']),
            ("input-error-border", foundational_colors['danger']['500']),
            ("input-error-text", foundational_colors['danger']['900']),
            
            ("input-disabled-bg", foundational_colors['neutral']['100']),
            ("input-disabled-border", foundational_colors['neutral']['200']),
            ("input-disabled-text", foundational_colors['neutral']['400']),
            
            ("input-readonly-bg", transparent),
            ("input-readonly-border", foundational_colors['neutral']['300']),
            ("input-readonly-text", foundational_colors['neutral']['700']),
        ]
    },
    {
        "id": "founder-os-light-surface-swatches",
        "name": "Founder OS Light Surface Swatches",
        "path": "16 Color Palette\\Founder OS Light Surface Swatches.scss",
        "count": 16,
        "type": "surfaces",
        "intent": "Advanced light surfaces including interactive cards (hover/active), selected table rows, modal backdrops, and inverted tooltip text.",
        "colors": [
            ("surface-app-bg", foundational_colors['neutral']['50']),
            ("surface-panel-bg", white),
            ("surface-card-bg", white),
            ("surface-elevated-bg", white),
            ("surface-hover-bg", foundational_colors['neutral']['100']),
            ("surface-active-bg", foundational_colors['neutral']['200']),
            ("surface-selected-bg", foundational_colors['primary']['50']),
            ("surface-selected-border", foundational_colors['primary']['300']),
            
            ("surface-border-subtle", foundational_colors['neutral']['200']),
            ("surface-border-strong", foundational_colors['neutral']['300']),
            
            ("surface-text-primary", foundational_colors['neutral']['900']),
            ("surface-text-secondary", foundational_colors['neutral']['600']),
            ("surface-text-muted", foundational_colors['neutral']['400']),
            ("surface-inverted-text", white),
            
            ("surface-tooltip-bg", foundational_colors['neutral']['800']),
            ("surface-backdrop", black_backdrop),
        ]
    },
    {
        "id": "founder-os-tag-label-swatches",
        "name": "Founder OS Tag Label Swatches",
        "path": "52 Color Palette\\Founder OS Tag Label Swatches.scss",
        "count": 52,
        "type": "component-states",
        "intent": "Ultimate tag component tokens containing Soft, Solid, Outline, and Ghost variants across Growth, Revenue, Product, and Urgent semantics.",
        "colors": []
    }
]

# Generate Tag Label colors dynamically
tags_types = [
    ("growth", "success"),
    ("revenue", "accent"),
    ("product", "primary"),
    ("urgent", "danger")
]

tag_colors = []
for type_name, root in tags_types:
    f_map = foundational_colors[root]
    tag_colors.extend([
        # Soft
        (f"tag-{type_name}-bg", f_map['50']),
        (f"tag-{type_name}-hover-bg", f_map['100']),
        (f"tag-{type_name}-border", f_map['500']),
        (f"tag-{type_name}-text", f_map['900']),
        # Solid
        (f"tag-{type_name}-solid-bg", f_map['500']),
        (f"tag-{type_name}-solid-hover-bg", f_map['600']),
        (f"tag-{type_name}-solid-text", white if type_name != 'revenue' else foundational_colors['neutral']['900']),
        # Outline
        (f"tag-{type_name}-outline-bg", transparent),
        (f"tag-{type_name}-outline-border", f_map['500']),
        (f"tag-{type_name}-outline-text", f_map['600']),
        # Ghost
        (f"tag-{type_name}-ghost-bg", transparent),
        (f"tag-{type_name}-ghost-hover-bg", f_map['50']),
        (f"tag-{type_name}-ghost-text", f_map['600']),
    ])
components[2]["colors"] = tag_colors

for comp in components:
    d = os.path.dirname(os.path.join(base_path, comp["path"]))
    os.makedirs(d, exist_ok=True)
    fpath = os.path.join(base_path, comp["path"])
    content = generate_scss_content(comp["id"], comp["name"], comp["count"], comp["intent"], comp["type"], comp["colors"])
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created upgraded file: {comp['path']}")

# Write Elevation manually to preserve box-shadow strings
elevation_content = """/*---
id: founder-os-elevation-shadow-swatches
name: Founder OS Elevation & Shadow Swatches
author: JaZeR-444
version: 1.1.0
category: Web Development System
count: 18
tags:
  project:
  - Founder OS
  swatchType:
  - component-states
  mood:
  - dark
  - premium
  aesthetic:
  - Glassmorphism
  - Tech
intent: A comprehensive 18-token named shadow swatch set for Founder OS depth hierarchy — includes hover lifts, directional drawers, deep insets, and glowing focus rings.
url: https://founder.os/
created: '2026-07-08'
updated: '2026-07-08'
---*/

:root {
/* CSS HEX (Base Colors) */
--shadow-color-base: #000000ff;
--shadow-color-cyan-tint: #00f0ff1a;
--shadow-color-magenta-tint: #ff00551a;
--shadow-color-mid: #090b10ff;
--shadow-color-deep: #07090dff;

/* NOTE: Box shadow tokens (These translate directly in Tailwind) */
--shadow-xs: 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4);
--shadow-sm: 0 4px 6px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.45);
--shadow-md: 0 10px 15px rgba(0,0,0,0.6), 0 4px 6px rgba(0,0,0,0.45);
--shadow-lg: 0 20px 25px rgba(0,0,0,0.65), 0 10px 10px rgba(0,0,0,0.5);
--shadow-xl: 0 25px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04);
--shadow-hover-lift: 0 15px 30px rgba(0,0,0,0.7), 0 5px 15px rgba(0,0,0,0.5);
--shadow-drawer-left: 20px 0 25px rgba(0,0,0,0.65);
--shadow-drawer-right: -20px 0 25px rgba(0,0,0,0.65);
--shadow-glow-cyan: 0 0 12px rgba(0,240,255,0.35), 0 0 24px rgba(0,240,255,0.15);
--shadow-glow-magenta: 0 0 12px rgba(255,0,85,0.35), 0 0 24px rgba(255,0,85,0.15);
--shadow-glow-amber: 0 0 12px rgba(255,184,0,0.30), 0 0 24px rgba(255,184,0,0.12);
--shadow-focus-ring: 0 0 0 2px #090b10ff, 0 0 0 4px #00f0ffff;
--shadow-inset: inset 0 2px 6px rgba(0,0,0,0.6);
--shadow-inset-deep: inset 0 4px 10px rgba(0,0,0,0.8);

/* CSS HSL */
--shadow-color-base: hsla(0, 0%, 0%, 1);
--shadow-color-cyan-tint: hsla(184, 100%, 50%, 0.10);
--shadow-color-magenta-tint: hsla(340, 100%, 50%, 0.10);
--shadow-color-mid: hsla(223, 28%, 5%, 1);
--shadow-color-deep: hsla(220, 30%, 4%, 1);
}

/* SCSS HEX */
$shadow-color-base: #000000ff;
$shadow-color-cyan-tint: rgba(0, 240, 255, 0.10);
$shadow-color-magenta-tint: rgba(255, 0, 85, 0.10);
$shadow-color-mid: #090b10ff;
$shadow-color-deep: #07090dff;

/* SCSS Box Shadows */
$shadow-xs: 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4);
$shadow-sm: 0 4px 6px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.45);
$shadow-md: 0 10px 15px rgba(0,0,0,0.6), 0 4px 6px rgba(0,0,0,0.45);
$shadow-lg: 0 20px 25px rgba(0,0,0,0.65), 0 10px 10px rgba(0,0,0,0.5);
$shadow-xl: 0 25px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04);
$shadow-hover-lift: 0 15px 30px rgba(0,0,0,0.7), 0 5px 15px rgba(0,0,0,0.5);
$shadow-drawer-left: 20px 0 25px rgba(0,0,0,0.65);
$shadow-drawer-right: -20px 0 25px rgba(0,0,0,0.65);
$shadow-glow-cyan: 0 0 12px rgba(0,240,255,0.35), 0 0 24px rgba(0,240,255,0.15);
$shadow-glow-magenta: 0 0 12px rgba(255,0,85,0.35), 0 0 24px rgba(255,0,85,0.15);
$shadow-glow-amber: 0 0 12px rgba(255,184,0,0.30), 0 0 24px rgba(255,184,0,0.12);
$shadow-focus-ring: 0 0 0 2px #090b10ff, 0 0 0 4px #00f0ffff;
$shadow-inset: inset 0 2px 6px rgba(0,0,0,0.6);
$shadow-inset-deep: inset 0 4px 10px rgba(0,0,0,0.8);

/* SCSS Map */
$founder-os-elevation-shadow-swatches-map: (
    "shadow-color-base": #000000ff,
    "shadow-color-mid": #090b10ff,
    "shadow-color-deep": #07090dff,
    "shadow-xs": "0 1px 3px rgba(0,0,0,0.5)",
    "shadow-sm": "0 4px 6px rgba(0,0,0,0.55)",
    "shadow-md": "0 10px 15px rgba(0,0,0,0.6)",
    "shadow-lg": "0 20px 25px rgba(0,0,0,0.65)",
    "shadow-xl": "0 25px 50px rgba(0,0,0,0.75)",
    "shadow-hover-lift": "0 15px 30px rgba(0,0,0,0.7)",
    "shadow-drawer-left": "20px 0 25px rgba(0,0,0,0.65)",
    "shadow-drawer-right": "-20px 0 25px rgba(0,0,0,0.65)",
    "shadow-glow-cyan": "0 0 12px rgba(0,240,255,0.35)",
    "shadow-glow-amber": "0 0 12px rgba(255,184,0,0.30)",
    "shadow-inset-deep": "inset 0 4px 10px rgba(0,0,0,0.8)"
);
"""
d = os.path.dirname(os.path.join(base_path, "18 Color Palette\\Founder OS Elevation Shadow Swatches.scss"))
os.makedirs(d, exist_ok=True)
with open(os.path.join(base_path, "18 Color Palette\\Founder OS Elevation Shadow Swatches.scss"), "w", encoding="utf-8") as f:
    f.write(elevation_content)
print("Created upgraded file: 18 Color Palette\\Founder OS Elevation Shadow Swatches.scss")
