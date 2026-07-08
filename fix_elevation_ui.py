import os
import re

# 1. Update Elevation SCSS file to have 24 hex colors in the CSS HEX block
fpath = "C:\\00_Active_Projects\\App - Pallates\\Palattes by # of Colors\\24 Color Palette\\Founder OS Elevation Shadow Swatches.scss"

with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()

hex_additions = """
/* UI Representative Hexes for Shadows */
--shadow-xs: #000000ff;
--shadow-sm: #000000ff;
--shadow-md: #000000ff;
--shadow-lg: #000000ff;
--shadow-xl: #000000ff;
--shadow-hover-lift: #000000ff;
--shadow-drawer-left: #000000ff;
--shadow-drawer-right: #000000ff;
--shadow-focus-ring: #00f0ffff;
--shadow-inset: #000000ff;
--shadow-inset-deep: #000000ff;
--shadow-glass-border: #ffffffff;
--shadow-glass-panel: #000000ff;
--shadow-glow-cyan: #00f0ffff;
--shadow-glow-magenta: #ff0055ff;
--shadow-glow-amber: #ffb800ff;
--shadow-glow-success: #34d399ff;
--shadow-glow-danger: #fb7185ff;
--shadow-glow-info: #60a5faff;
--shadow-glow-primary-lg: #00f0ffff;
"""

# Inject right before /* NOTE: Box shadow tokens
content = content.replace("/* NOTE: Box shadow tokens", hex_additions.strip() + "\n\n/* NOTE: Box shadow tokens")

with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SCSS file with representative hexes.")

# 2. Update build_sdks.py to handle shadow tokens correctly
build_sdk_path = "C:\\00_Active_Projects\\App - Pallates\\build_sdks.py"
with open(build_sdk_path, "r", encoding="utf-8") as f:
    sdk_content = f.read()

# Replace the extraction logic
old_extract = """    # Extract only from the CSS HEX block so we don't duplicate with HSL/RGB
    hex_block_match = re.search(r'/\\* CSS HEX \\*/(.*?)/\\* CSS HSL \\*/', content, re.DOTALL)
    if not hex_block_match:
        continue
        
    hex_block = hex_block_match.group(1)
    
    # Match --var-name: #hex
    tokens = re.findall(r'--([a-zA-Z0-9-]+):\\s*(#[0-9a-fA-F]{6,8});', hex_block)
    for t_name, t_val in tokens:
        all_tokens[t_name] = t_val"""

new_extract = """    # Extract HEX block
    hex_block_match = re.search(r'/\\* CSS HEX \\*/(.*?)(?:/\\* NOTE:|/\\* CSS HSL \\*/)', content, re.DOTALL)
    if hex_block_match:
        tokens = re.findall(r'--([a-zA-Z0-9-]+):\\s*(#[0-9a-fA-F]{6,8});', hex_block_match.group(1))
        for t_name, t_val in tokens:
            all_tokens[t_name] = {"value": t_val, "type": "color"}
            
    # Extract Box Shadows block
    shadow_block_match = re.search(r'/\\* NOTE: Box shadow tokens(.*?)(\\*/|/\\* Focus)', content, re.DOTALL)
    if shadow_block_match:
        pass # We will just scan the whole root for shadows to be safe
    
    # Scan entire :root for shadows
    root_match = re.search(r':root\\s*{([^}]+)}', content, re.DOTALL)
    if root_match:
        # match shadows like: --shadow-lg: 0 20px 25px rgba...;
        shadow_tokens = re.findall(r'--(shadow-[a-zA-Z0-9-]+):\\s*([^;]+);', root_match.group(1))
        for t_name, t_val in shadow_tokens:
            if t_name not in all_tokens or "rgba" in t_val or "inset" in t_val or "px" in t_val:
                all_tokens[t_name] = {"value": t_val, "type": "shadow"}"""

sdk_content = sdk_content.replace(old_extract, new_extract)

old_ts = """for t_name in sorted(all_tokens.keys()):
    pascal_name = to_pascal_case(t_name)
    ts_lines.append(f'  {pascal_name}: "var(--{t_name})",')"""

new_ts = """for t_name in sorted(all_tokens.keys()):
    pascal_name = to_pascal_case(t_name)
    ts_lines.append(f'  {pascal_name}: "var(--{t_name})",')"""
sdk_content = sdk_content.replace(old_ts, new_ts) # Same for TS

old_tw = """for t_name in sorted(all_tokens.keys()):
    # Map to Tailwind v4 color scale
    # Example: --color-btn-primary-bg: var(--btn-primary-bg);
    tw_lines.append(f"  --color-{t_name}: var(--{t_name});")"""

new_tw = """for t_name in sorted(all_tokens.keys()):
    t_info = all_tokens[t_name]
    if t_info["type"] == "shadow":
        # Do not output shadow-color-base as a shadow
        if "color" in t_name:
            tw_lines.append(f"  --color-{t_name}: var(--{t_name});")
        else:
            tw_lines.append(f"  --{t_name}: var(--{t_name});")
    else:
        tw_lines.append(f"  --color-{t_name}: var(--{t_name});")"""

sdk_content = sdk_content.replace(old_tw, new_tw)

with open(build_sdk_path, "w", encoding="utf-8") as f:
    f.write(sdk_content)

print("Updated build_sdks.py")
