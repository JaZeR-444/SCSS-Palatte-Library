import json

with open('C:/00_Active_Projects/App - Pallates/generated/palettes.json', 'r', encoding='utf-8') as f:
    palettes = json.load(f)

for p in palettes:
    if 'Founder OS' in p['name']:
        print(f"{p['name']} -> {p.get('count', '?')} colors ({p.get('id', '?')})")
