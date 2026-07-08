import os

base_dir = os.path.dirname(os.path.abspath(__file__))
palettes_dir = os.path.join(base_dir, "Palattes by # of Colors")

scss_content = "// SCSS Palette Library - Main Entry Point\n\n"

folders = [f"{i} Color Palette" for i in range(3, 36)]

for folder in folders:
    folder_path = os.path.join(palettes_dir, folder)
    if os.path.exists(folder_path):
        files = [f for f in os.listdir(folder_path) if f.endswith(".scss")]
        for f in sorted(files):
            name = f.replace(".scss", "")
            scss_content += f"@import 'Palattes by # of Colors/{folder}/{name}';\n"

index_path = os.path.join(base_dir, "_index.scss")
with open(index_path, "w", encoding="utf-8") as f:
    f.write(scss_content)

print(f"Updated _index.scss")
