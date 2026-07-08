import os
import colorsys

base_path = "C:\\00_Active_Projects\\App - Pallates\\Palattes by # of Colors\\10 Color Palette"

def generate_scss_content(pal_id, pal_name, intent, base_name, colors):
    lines = []
    lines.append(f"/*---")
    lines.append(f"id: {pal_id}")
    lines.append(f"name: {pal_name}")
    lines.append(f"author: JaZeR-444")
    lines.append(f"version: 1.0.0")
    lines.append(f"category: Web Development System")
    lines.append(f"count: 10")
    lines.append(f"tags:")
    lines.append(f"  project:")
    lines.append(f"  - Founder OS")
    lines.append(f"  swatchType:")
    lines.append(f"  - brand-scale")
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
    
    token_names = [
        f"--brand-{base_name}-50-wash",
        f"--brand-{base_name}-100-subtle",
        f"--brand-{base_name}-200-light",
        f"--brand-{base_name}-300-muted",
        f"--brand-{base_name}-400-base",
        f"--brand-{base_name}-500-primary",
        f"--brand-{base_name}-600-hover",
        f"--brand-{base_name}-700-active",
        f"--brand-{base_name}-800-deep",
        f"--brand-{base_name}-900-dark"
    ]
    
    for i in range(10):
        lines.append(f"{token_names[i]}: {colors[i]};")
        
    lines.append("\n/* CSS HSL */")
    for i in range(10):
        hex_color = colors[i][:7].lstrip('#')
        r, g, b = tuple(int(hex_color[j:j+2], 16) for j in (0, 2, 4))
        h, l, s = colorsys.rgb_to_hls(r/255.0, g/255.0, b/255.0)
        lines.append(f"{token_names[i]}: hsla({round(h*360)}, {round(s*100)}%, {round(l*100)}%, 1);")
    lines.append("}\n")
    
    lines.append("/* SCSS HEX */")
    for i in range(10):
        lines.append(f"${token_names[i][2:]}: {colors[i]};")
        
    lines.append("\n/* SCSS Map */")
    lines.append(f"${pal_id}-map: (")
    map_lines = []
    for i in range(10):
        map_lines.append(f'    "{token_names[i][2:]}": {colors[i]}')
    lines.append(",\n".join(map_lines))
    lines.append(");")
    
    return "\n".join(lines)

# Curated 10-step scales
palettes = [
    {
        "id": "founder-os-violet-brand-swatches",
        "name": "Founder OS Violet Brand Swatches",
        "intent": "A beautiful 10-step violet scale, perfect for AI features, magic actions, and premium SaaS tiers.",
        "base_name": "violet",
        "colors": [
            "#f5f3ffff", "#ede9feff", "#ddd6feff", "#c4b5fdff", "#a78bfaff", 
            "#8b5cf6ff", "#7c3aedff", "#6d28d9ff", "#5b21b6ff", "#4c1d95ff"
        ]
    },
    {
        "id": "founder-os-rose-brand-swatches",
        "name": "Founder OS Rose Brand Swatches",
        "intent": "A vibrant 10-step rose scale for pop marketing, lifestyle brands, and soft destructive alerts.",
        "base_name": "rose",
        "colors": [
            "#fff1f2ff", "#ffe4e6ff", "#fecdd3ff", "#fda4afff", "#fb7185ff", 
            "#f43f5eff", "#e11d48ff", "#be123cff", "#9f1239ff", "#881337ff"
        ]
    },
    {
        "id": "founder-os-teal-brand-swatches",
        "name": "Founder OS Teal Brand Swatches",
        "intent": "A deep, trustworthy 10-step teal scale for fintech, healthcare, and secure systems.",
        "base_name": "teal",
        "colors": [
            "#f0fdfaff", "#ccfbf1ff", "#99f6e4ff", "#5eead4ff", "#2dd4bfff", 
            "#14b8a6ff", "#0d9488ff", "#0f766eff", "#115e59ff", "#134e4aff"
        ]
    },
    {
        "id": "founder-os-indigo-brand-swatches",
        "name": "Founder OS Indigo Brand Swatches",
        "intent": "A highly corporate 10-step indigo scale for enterprise dashboards and intense focus states.",
        "base_name": "indigo",
        "colors": [
            "#eef2ffff", "#e0e7ffff", "#c7d2feff", "#a5b4fcff", "#818cf8ff", 
            "#6366f1ff", "#4f46e5ff", "#4338caff", "#3730a3ff", "#312e81ff"
        ]
    },
    {
        "id": "founder-os-amber-brand-swatches",
        "name": "Founder OS Amber Brand Swatches",
        "intent": "A striking 10-step amber scale for intense warnings, energetic highlights, and glowing accents.",
        "base_name": "amber",
        "colors": [
            "#fffbebff", "#fef3c7ff", "#fde68aff", "#fcd34dff", "#fbbf24ff", 
            "#f59e0bff", "#d97706ff", "#b45309ff", "#92400eff", "#78350fff"
        ]
    }
]

for p in palettes:
    fpath = os.path.join(base_path, f"{p['name']}.scss")
    content = generate_scss_content(p["id"], p["name"], p["intent"], p["base_name"], p["colors"])
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {p['name']}")
