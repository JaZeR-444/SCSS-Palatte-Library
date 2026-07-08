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
        
    # Extract HEX block
    hex_block_match = re.search(r'/\* CSS HEX \*/(.*?)(?:/\* NOTE:|/\* CSS HSL \*/)', content, re.DOTALL)
    if hex_block_match:
        tokens = re.findall(r'--([a-zA-Z0-9-]+):\s*(#[0-9a-fA-F]{6,8});', hex_block_match.group(1))
        for t_name, t_val in tokens:
            all_tokens[t_name] = {"value": t_val, "type": "color"}
            
    # Extract Box Shadows block
    shadow_block_match = re.search(r'/\* NOTE: Box shadow tokens(.*?)(\*/|/\* Focus)', content, re.DOTALL)
    if shadow_block_match:
        pass # We will just scan the whole root for shadows to be safe
    
    # Scan entire :root for shadows
    root_match = re.search(r':root\s*{([^}]+)}', content, re.DOTALL)
    if root_match:
        # match shadows like: --shadow-lg: 0 20px 25px rgba...;
        shadow_tokens = re.findall(r'--(shadow-[a-zA-Z0-9-]+):\s*([^;]+);', root_match.group(1))
        for t_name, t_val in shadow_tokens:
            if t_name not in all_tokens or "rgba" in t_val or "inset" in t_val or "px" in t_val:
                all_tokens[t_name] = {"value": t_val, "type": "shadow"}

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
# Emits BOTH the raw :root token values (the actual definitions) and the
# @theme mapping that exposes them as Tailwind utilities. Without the :root
# block every `var(--token)` reference is undefined and utilities render with
# no color.
tw_path = os.path.join(output_dir, "founder-os-tailwind.css")

# The demo (and downstream apps) use a semantic `primary-*` ramp. The canonical
# brand hue is cyan (its 500 step is the only one named "…-primary"; magenta is
# "secondary", amber is "accent"), so alias primary-* onto the brand-cyan ramp.
PRIMARY_ALIAS = {
    "50": "brand-cyan-50-wash",
    "100": "brand-cyan-100-subtle",
    "200": "brand-cyan-200-light",
    "300": "brand-cyan-300-muted",
    "400": "brand-cyan-400-base",
    "500": "brand-cyan-500-primary",
    "600": "brand-cyan-600-hover",
    "700": "brand-cyan-700-active",
    "800": "brand-cyan-800-deep",
    "900": "brand-cyan-900-dark",
}

tw_lines = [
    "/*",
    f" * Auto-generated Tailwind v4 Theme for Founder OS",
    f" * Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    " * Import into globals.css: defines the :root token values AND maps them",
    " * to Tailwind utilities via @theme. Do not edit directly.",
    " */",
    "",
    ":root {",
]

# Raw definitions — the actual hex / shadow values behind every token.
for t_name in sorted(all_tokens.keys()):
    tw_lines.append(f"  --{t_name}: {all_tokens[t_name]['value']};")

tw_lines.append("}")
tw_lines.append("")
tw_lines.append("@theme {")

for t_name in sorted(all_tokens.keys()):
    t_info = all_tokens[t_name]
    if t_info["type"] == "shadow" and "color" not in t_name:
        tw_lines.append(f"  --{t_name}: var(--{t_name});")
    else:
        tw_lines.append(f"  --color-{t_name}: var(--{t_name});")

# primary-* alias → canonical brand (cyan) ramp
alias_lines = [
    f"  --color-primary-{step}: var(--{target});"
    for step, target in PRIMARY_ALIAS.items()
    if target in all_tokens
]
if alias_lines:
    tw_lines.append("")
    tw_lines.append("  /* primary-* alias → canonical brand (cyan) ramp */")
    tw_lines.extend(alias_lines)

tw_lines.append("}\n")

with open(tw_path, "w", encoding="utf-8") as f:
    f.write("\n".join(tw_lines))
    
print(f"Successfully generated SDKs from {len(files)} files.")
print(f"Found {len(all_tokens)} unique tokens.")
print(f"Wrote TS: {ts_path}")
print(f"Wrote Tailwind: {tw_path}")
