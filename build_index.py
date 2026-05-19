import os
import json
import re
import yaml

def build_index():
    folders = [
        "3 Color Palette", "4 Color Palette", "5 Color Palette", 
        "6 Color Palette", "7 Color Palette", "8 Color Palette", 
        "9 Color Palette", "10 Color Palette"
    ]
    
    palettes = []
    
    for folder in folders:
        if not os.path.exists(folder):
            continue
            
        color_count = int(folder.split(' ')[0])
        
        for filename in os.listdir(folder):
            if filename.endswith(".scss"):
                path = os.path.join(folder, filename).replace("\\", "/")
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Extract YAML front matter
                    # Pattern: /*--- [yaml] ---*/
                    yaml_match = re.search(r'/\*---\n(.*?)\n---\*/', content, re.DOTALL)
                    
                    metadata = {}
                    if yaml_match:
                        yaml_content = yaml_match.group(1)
                        try:
                            metadata = yaml.safe_load(yaml_content)
                        except Exception as e:
                            print(f"Error parsing YAML in {path}: {e}")
                    
                    # Fallback title if YAML missing or empty
                    name = metadata.get('title', filename.replace(".scss", ""))
                    description = metadata.get('description', f"A vibrant {color_count}-color palette.")
                    tags = metadata.get('tags', [])
                    
                    # Extract HEX colors and their variable names from CSS HEX section
                    # Pattern: --variable-name: #hex;
                    var_hex_pattern = r'--([\w-]+):\s*#([a-fA-F0-9]{6}|[a-fA-F0-9]{8});'
                    color_matches = re.findall(var_hex_pattern, content)
                    
                    color_data = []
                    seen_vars = set()
                    for var_name, hex_val in color_matches:
                        if var_name not in seen_vars:
                            # Prettify variable name (e.g., tiger-eye -> Tiger Eye)
                            pretty_name = var_name.replace('-', ' ').title()
                            color_data.append({
                                "name": pretty_name,
                                "hex": f"#{hex_val}"
                            })
                            seen_vars.add(var_name)
                    
                    palettes.append({
                        "id": filename.replace(".scss", "").lower().replace(" ", "-"),
                        "name": name,
                        "description": description,
                        "count": color_count,
                        "colors": color_data,
                        "path": path,
                        "folder": folder,
                        "tags": tags
                    })
    
    # Sort by count then name
    palettes.sort(key=lambda x: (x['count'], x['name']))
    
    os.makedirs("showcase", exist_ok=True)
    with open("showcase/palettes.json", "w", encoding='utf-8') as f:
        json.dump(palettes, f, indent=4)
        
    print(f"Successfully synchronized {len(palettes)} palettes from SCSS source.")

if __name__ == "__main__":
    build_index()
