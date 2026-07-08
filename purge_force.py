import json
import sqlite3
import os

ids_to_remove = [
    "founder-os-elevation-shadow-swatches",
    "founder-os-elevation-&-shadow-swatches",
    "founder-os-tag-label-swatches",
    "founder-os-tag-&-label-swatches"
]

base_dir = "C:\\00_Active_Projects\\App - Pallates"
json_path = os.path.join(base_dir, "generated", "palettes.json")
db_path = os.path.join(base_dir, "generated", "palettes.db")

with open(json_path, "r", encoding="utf-8") as f:
    palettes = json.load(f)

original_len = len(palettes)
palettes = [p for p in palettes if p["id"] not in ids_to_remove]
removed_count = original_len - len(palettes)

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
print(f"Purged {removed_count} old versions from JSON and DB.")
