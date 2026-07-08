import os
import re
import colorsys

base_path = "C:\\00_Active_Projects\\App - Pallates\\Palattes by # of Colors"

# The old files to delete
old_files = [
    "16 Color Palette\\Founder OS Button Component Swatches.scss",
    "12 Color Palette\\Founder OS Tag Label Swatches.scss",
    "10 Color Palette\\Founder OS Notification Badge Swatches.scss"
]

for old_f in old_files:
    fpath = os.path.join(base_path, old_f)
    if os.path.exists(fpath):
        os.remove(fpath)
        print(f"Removed old file: {old_f}")

# 1. Map all foundational files
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
        step = match.group(1)
        val = match.group(2)
        color_map[step] = val
        
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

# 2. Build the upgraded component files
components = [
    {
        "id": "founder-os-button-component-swatches",
        "name": "Founder OS Button Component Swatches",
        "path": "24 Color Palette\\Founder OS Button Component Swatches.scss",
        "count": 24,
        "type": "component-states",
        "intent": "Advanced button states mapping Primary, Secondary, Ghost, Danger, and Success. Includes Disabled states and Focus rings for UX accessibility.",
        "colors": [
            ("btn-primary-bg", foundational_colors['primary']['500']),
            ("btn-primary-hover", foundational_colors['primary']['600']),
            ("btn-primary-active", foundational_colors['primary']['700']),
            ("btn-primary-text", white),
            
            ("btn-secondary-bg", transparent),
            ("btn-secondary-border", foundational_colors['neutral']['500']),
            ("btn-secondary-hover-bg", foundational_colors['neutral']['100']),
            ("btn-secondary-text", foundational_colors['neutral']['900']),
            
            ("btn-ghost-bg", transparent),
            ("btn-ghost-hover-bg", foundational_colors['accent']['50']),
            ("btn-ghost-active-bg", foundational_colors['accent']['100']),
            ("btn-ghost-text", foundational_colors['accent']['600']),
            
            ("btn-danger-bg", foundational_colors['danger']['500']),
            ("btn-danger-hover", foundational_colors['danger']['600']),
            ("btn-danger-active", foundational_colors['danger']['700']),
            ("btn-danger-text", white),
            
            ("btn-success-bg", foundational_colors['success']['500']),
            ("btn-success-hover", foundational_colors['success']['600']),
            ("btn-success-active", foundational_colors['success']['700']),
            ("btn-success-text", white),
            
            ("btn-disabled-bg", foundational_colors['neutral']['100']),
            ("btn-disabled-border", foundational_colors['neutral']['200']),
            ("btn-disabled-text", foundational_colors['neutral']['400']),
            
            ("btn-focus-ring", foundational_colors['primary']['500']),
        ]
    },
    {
        "id": "founder-os-tag-label-swatches",
        "name": "Founder OS Tag Label Swatches",
        "path": "28 Color Palette\\Founder OS Tag Label Swatches.scss",
        "count": 28,
        "type": "component-states",
        "intent": "Advanced tags for data filtering. Growth (Success), Revenue (Accent), Product (Primary), Urgent (Danger). Both Soft (idle/hover) and Solid variants included.",
        "colors": [
            # Growth
            ("tag-growth-bg", foundational_colors['success']['50']),
            ("tag-growth-hover-bg", foundational_colors['success']['100']),
            ("tag-growth-border", foundational_colors['success']['500']),
            ("tag-growth-text", foundational_colors['success']['900']),
            ("tag-growth-solid-bg", foundational_colors['success']['500']),
            ("tag-growth-solid-hover-bg", foundational_colors['success']['600']),
            ("tag-growth-solid-text", white),
            # Revenue
            ("tag-revenue-bg", foundational_colors['accent']['50']),
            ("tag-revenue-hover-bg", foundational_colors['accent']['100']),
            ("tag-revenue-border", foundational_colors['accent']['500']),
            ("tag-revenue-text", foundational_colors['accent']['900']),
            ("tag-revenue-solid-bg", foundational_colors['accent']['500']),
            ("tag-revenue-solid-hover-bg", foundational_colors['accent']['600']),
            ("tag-revenue-solid-text", foundational_colors['neutral']['900']), # Amber text is dark
            # Product
            ("tag-product-bg", foundational_colors['primary']['50']),
            ("tag-product-hover-bg", foundational_colors['primary']['100']),
            ("tag-product-border", foundational_colors['primary']['500']),
            ("tag-product-text", foundational_colors['primary']['900']),
            ("tag-product-solid-bg", foundational_colors['primary']['500']),
            ("tag-product-solid-hover-bg", foundational_colors['primary']['600']),
            ("tag-product-solid-text", white),
            # Urgent
            ("tag-urgent-bg", foundational_colors['danger']['50']),
            ("tag-urgent-hover-bg", foundational_colors['danger']['100']),
            ("tag-urgent-border", foundational_colors['danger']['500']),
            ("tag-urgent-text", foundational_colors['danger']['900']),
            ("tag-urgent-solid-bg", foundational_colors['danger']['500']),
            ("tag-urgent-solid-hover-bg", foundational_colors['danger']['600']),
            ("tag-urgent-solid-text", white),
        ]
    },
    {
        "id": "founder-os-notification-badge-swatches",
        "name": "Founder OS Notification Badge Swatches",
        "path": "21 Color Palette\\Founder OS Notification Badge Swatches.scss",
        "count": 21,
        "type": "component-states",
        "intent": "Advanced notification badges (Unread, Mention, System, AI, New) with both Solid high-contrast and Subtle inline variations. Includes avatar cutout ring.",
        "colors": [
            ("badge-ring", foundational_colors['neutral']['50']),
            
            ("badge-unread-bg", foundational_colors['danger']['500']),
            ("badge-unread-text", white),
            ("badge-unread-subtle-bg", foundational_colors['danger']['50']),
            ("badge-unread-subtle-text", foundational_colors['danger']['900']),
            
            ("badge-mention-bg", foundational_colors['accent']['500']),
            ("badge-mention-text", foundational_colors['neutral']['900']),
            ("badge-mention-subtle-bg", foundational_colors['accent']['50']),
            ("badge-mention-subtle-text", foundational_colors['accent']['900']),
            
            ("badge-system-bg", foundational_colors['info']['500']),
            ("badge-system-text", white),
            ("badge-system-subtle-bg", foundational_colors['info']['50']),
            ("badge-system-subtle-text", foundational_colors['info']['900']),
            
            ("badge-ai-bg", foundational_colors['tertiary']['500']),
            ("badge-ai-text", white),
            ("badge-ai-subtle-bg", foundational_colors['tertiary']['50']),
            ("badge-ai-subtle-text", foundational_colors['tertiary']['900']),
            
            ("badge-new-bg", foundational_colors['success']['500']),
            ("badge-new-text", white),
            ("badge-new-subtle-bg", foundational_colors['success']['50']),
            ("badge-new-subtle-text", foundational_colors['success']['900']),
        ]
    }
]

for comp in components:
    d = os.path.dirname(os.path.join(base_path, comp["path"]))
    os.makedirs(d, exist_ok=True)
    
    fpath = os.path.join(base_path, comp["path"])
    content = generate_scss_content(comp["id"], comp["name"], comp["count"], comp["intent"], comp["type"], comp["colors"])
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created upgraded file: {comp['path']}")
