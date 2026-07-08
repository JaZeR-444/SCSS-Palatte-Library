import json
import sqlite3
import os

files_to_remove = [
    "Founder OS Form Input State Swatches",
    "Founder OS Light Surface Swatches",
    "Founder OS Elevation Shadow Swatches",
    "Founder OS Tag Label Swatches"
]

base_dir = "C:\\00_Active_Projects\\App - Pallates"
json_path = os.path.join(base_dir, "generated", "palettes.json")
db_path = os.path.join(base_dir, "generated", "palettes.db")

with open(json_path, "r", encoding="utf-8") as f:
    palettes = json.load(f)

palettes = [p for p in palettes if p["name"] not in files_to_remove]

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(palettes, f, indent=4)

ids_to_remove = [name.lower().replace(" ", "-").replace("&", "") for name in files_to_remove]
# Fix for the "Elevation & Shadow" slug which might be "founder-os-elevation-&-shadow-swatches" or "founder-os-elevation-shadow-swatches"
ids_to_remove.append("founder-os-elevation-shadow-swatches")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

for pid in ids_to_remove:
    cursor.execute("DELETE FROM palettes WHERE id = ?", (pid,))
    cursor.execute("DELETE FROM palette_colors WHERE palette_id = ?", (pid,))
    cursor.execute("DELETE FROM palette_tags WHERE palette_id = ?", (pid,))
    cursor.execute("DELETE FROM palette_stats WHERE palette_id = ?", (pid,))
    
conn.commit()
conn.close()
print("Purged old versions from DB.")
