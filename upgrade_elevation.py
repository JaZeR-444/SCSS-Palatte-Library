import os

base_path = "C:\\00_Active_Projects\\App - Pallates\\Palattes by # of Colors"
old_file = os.path.join(base_path, "18 Color Palette\\Founder OS Elevation Shadow Swatches.scss")
if os.path.exists(old_file):
    os.remove(old_file)
    print(f"Removed old file: {old_file}")

new_content = """/*---
id: founder-os-elevation-shadow-swatches
name: Founder OS Elevation & Shadow Swatches
author: JaZeR-444
version: 1.2.0
category: Web Development System
count: 24
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
intent: A definitive 24-token shadow and elevation system. Includes structural shadows, glassmorphism panel borders, full semantic glowing states (Success, Danger, Info), and massive marketing glows.
url: https://founder.os/
created: '2026-07-08'
updated: '2026-07-08'
---*/

:root {
/* CSS HEX (Base Colors - Rendered in UI) */
--shadow-color-base: #000000ff;
--shadow-color-cyan-tint: #00f0ff1a;
--shadow-color-magenta-tint: #ff00551a;
--shadow-color-mid: #090b10ff;
--shadow-color-deep: #07090dff;

/* NOTE: Box shadow tokens (These translate directly into Tailwind) */
--shadow-xs: 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4);
--shadow-sm: 0 4px 6px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.45);
--shadow-md: 0 10px 15px rgba(0,0,0,0.6), 0 4px 6px rgba(0,0,0,0.45);
--shadow-lg: 0 20px 25px rgba(0,0,0,0.65), 0 10px 10px rgba(0,0,0,0.5);
--shadow-xl: 0 25px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04);
--shadow-hover-lift: 0 15px 30px rgba(0,0,0,0.7), 0 5px 15px rgba(0,0,0,0.5);
--shadow-drawer-left: 20px 0 25px rgba(0,0,0,0.65);
--shadow-drawer-right: -20px 0 25px rgba(0,0,0,0.65);

/* Focus & Inset */
--shadow-focus-ring: 0 0 0 2px #090b10ff, 0 0 0 4px #00f0ffff;
--shadow-inset: inset 0 2px 6px rgba(0,0,0,0.6);
--shadow-inset-deep: inset 0 4px 10px rgba(0,0,0,0.8);

/* Glassmorphism */
--shadow-glass-border: inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.02);
--shadow-glass-panel: 0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1);

/* Semantic Glows */
--shadow-glow-cyan: 0 0 12px rgba(0,240,255,0.35), 0 0 24px rgba(0,240,255,0.15);
--shadow-glow-magenta: 0 0 12px rgba(255,0,85,0.35), 0 0 24px rgba(255,0,85,0.15);
--shadow-glow-amber: 0 0 12px rgba(255,184,0,0.30), 0 0 24px rgba(255,184,0,0.12);
--shadow-glow-success: 0 0 12px rgba(52,211,153,0.30), 0 0 24px rgba(52,211,153,0.12);
--shadow-glow-danger: 0 0 12px rgba(251,113,133,0.35), 0 0 24px rgba(251,113,133,0.15);
--shadow-glow-info: 0 0 12px rgba(96,165,250,0.30), 0 0 24px rgba(96,165,250,0.12);

/* Marketing Glow */
--shadow-glow-primary-lg: 0 0 40px rgba(0,240,255,0.25), 0 0 80px rgba(0,240,255,0.15);

/* CSS HSL (For the base hexes) */
--shadow-color-base: hsla(0, 0%, 0%, 1);
--shadow-color-cyan-tint: hsla(184, 100%, 50%, 0.10);
--shadow-color-magenta-tint: hsla(340, 100%, 50%, 0.10);
--shadow-color-mid: hsla(223, 28%, 5%, 1);
--shadow-color-deep: hsla(220, 30%, 4%, 1);
}

/* SCSS HEX (For the base colors) */
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
$shadow-focus-ring: 0 0 0 2px #090b10ff, 0 0 0 4px #00f0ffff;
$shadow-inset: inset 0 2px 6px rgba(0,0,0,0.6);
$shadow-inset-deep: inset 0 4px 10px rgba(0,0,0,0.8);
$shadow-glass-border: inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.02);
$shadow-glass-panel: 0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
$shadow-glow-cyan: 0 0 12px rgba(0,240,255,0.35), 0 0 24px rgba(0,240,255,0.15);
$shadow-glow-magenta: 0 0 12px rgba(255,0,85,0.35), 0 0 24px rgba(255,0,85,0.15);
$shadow-glow-amber: 0 0 12px rgba(255,184,0,0.30), 0 0 24px rgba(255,184,0,0.12);
$shadow-glow-success: 0 0 12px rgba(52,211,153,0.30), 0 0 24px rgba(52,211,153,0.12);
$shadow-glow-danger: 0 0 12px rgba(251,113,133,0.35), 0 0 24px rgba(251,113,133,0.15);
$shadow-glow-info: 0 0 12px rgba(96,165,250,0.30), 0 0 24px rgba(96,165,250,0.12);
$shadow-glow-primary-lg: 0 0 40px rgba(0,240,255,0.25), 0 0 80px rgba(0,240,255,0.15);

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

new_file = os.path.join(base_path, "24 Color Palette\\Founder OS Elevation Shadow Swatches.scss")
os.makedirs(os.path.dirname(new_file), exist_ok=True)
with open(new_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Created new file: {new_file}")

import json
import sqlite3

json_path = os.path.join("C:\\00_Active_Projects\\App - Pallates", "generated", "palettes.json")
db_path = os.path.join("C:\\00_Active_Projects\\App - Pallates", "generated", "palettes.db")

with open(json_path, "r", encoding="utf-8") as f:
    palettes = json.load(f)

ids_to_remove = ["founder-os-elevation-shadow-swatches", "founder-os-elevation-&-shadow-swatches"]
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
print("Purged old Elevation swatches from JSON and DB.")
