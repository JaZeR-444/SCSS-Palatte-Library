import json
import sqlite3
import os

files_to_remove = [
    "Founder OS Button Component Swatches",
    "Founder OS Tag Label Swatches",
    "Founder OS Notification Badge Swatches"
]

base_dir = "C:\\00_Active_Projects\\App - Pallates"
json_path = os.path.join(base_dir, "generated", "palettes.json")
db_path = os.path.join(base_dir, "generated", "palettes.db")

with open(json_path, "r", encoding="utf-8") as f:
    palettes = json.load(f)

# Keep everything EXCEPT the ones we are removing
palettes = [p for p in palettes if p["name"] not in files_to_remove]

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(palettes, f, indent=4)

ids_to_remove = [name.lower().replace(" ", "-") for name in files_to_remove]
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
