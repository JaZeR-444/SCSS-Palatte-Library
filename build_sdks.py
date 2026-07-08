import os
import glob
import re
import datetime

def to_pascal_case(kebab_str):
    return ''.join(word.capitalize() for word in kebab_str.split('-'))

base_dir = os.path.dirname(os.path.abspath(__file__))
palettes_dir = os.path.join(base_dir, "Palattes by # of Colors")
output_dir = os.path.join(base_dir, "generated")

os.makedirs(output_dir, exist_ok=True)

# Find all Founder OS files
files = glob.glob(os.path.join(palettes_dir, "**", "Founder OS*.scss"), recursive=True)

all_tokens = {}

for fpath in files:
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Extract only from the CSS HEX block so we don't duplicate with HSL/RGB
    hex_block_match = re.search(r'/\* CSS HEX \*/(.*?)/\* CSS HSL \*/', content, re.DOTALL)
    if not hex_block_match:
        continue
        
    hex_block = hex_block_match.group(1)
    
    # Match --var-name: #hex
    tokens = re.findall(r'--([a-zA-Z0-9-]+):\s*(#[0-9a-fA-F]{6,8});', hex_block)
    for t_name, t_val in tokens:
        all_tokens[t_name] = t_val

# 1. Generate TypeScript definitions
ts_path = os.path.join(output_dir, "founder-os-tokens.ts")
ts_lines = [
    "/**",
    f" * Auto-generated Founder OS Design Tokens",
    f" * Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    " * Do not edit directly.",
    " */",
    "",
    "export const FounderOSTokens = {"
]

for t_name in sorted(all_tokens.keys()):
    pascal_name = to_pascal_case(t_name)
    ts_lines.append(f'  {pascal_name}: "var(--{t_name})",')

ts_lines.append("} as const;\n")
ts_lines.append("export type FounderOSTokenName = keyof typeof FounderOSTokens;")
ts_lines.append("export type FounderOSTokenValue = typeof FounderOSTokens[FounderOSTokenName];\n")

with open(ts_path, "w", encoding="utf-8") as f:
    f.write("\n".join(ts_lines))

# 2. Generate Tailwind v4 CSS Theme Block
tw_path = os.path.join(output_dir, "founder-os-tailwind.css")
tw_lines = [
    "/*",
    f" * Auto-generated Tailwind v4 Theme for Founder OS",
    f" * Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    " * Import this `@theme` block into your globals.css to map tokens to Tailwind utilities.",
    " */",
    "",
    "@theme {"
]

for t_name in sorted(all_tokens.keys()):
    # Map to Tailwind v4 color scale
    # Example: --color-btn-primary-bg: var(--btn-primary-bg);
    tw_lines.append(f"  --color-{t_name}: var(--{t_name});")

tw_lines.append("}\n")

with open(tw_path, "w", encoding="utf-8") as f:
    f.write("\n".join(tw_lines))
    
print(f"Successfully generated SDKs from {len(files)} files.")
print(f"Found {len(all_tokens)} unique tokens.")
print(f"Wrote TS: {ts_path}")
print(f"Wrote Tailwind: {tw_path}")
