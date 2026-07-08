import os
try:
    from PIL import Image
    import colorsys
    import json
except ImportError:
    print("PIL not installed. Installing...")
    os.system("pip install Pillow")
    from PIL import Image
    import colorsys
    import json

images = [
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_logo_ultimate_fusion_1783491502457.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_macro_shot_1783492012296.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_og_banner_1783491675985.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_particle_burst_1783492185156.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_stacked_logo_1783491620643.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_app_splash_1783491689561.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_feature_icons_1783491637068.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_github_banner_1783491706035.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_hexagon_icon_1783491628100.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_logo_fusion_gold_1783491341035.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_logo_fusion_neon_1783491333357.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_logo_glass_1783490806234.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_logo_gold_1783490799402.jpg",
    r"C:\Users\JaZeR\OneDrive\Desktop\founder-os-brand-generated-content\antigravity-generated\founder_os_logo_neon_1783490791491.jpg"
]

def get_dominant_colors(image_path, num_colors=5):
    try:
        img = Image.open(image_path)
        img = img.resize((50, 50)) # Resize for faster processing
        result = img.convert('P', palette=Image.ADAPTIVE, colors=num_colors)
        result.putalpha(0)
        colors = result.getcolors(50*50)
        
        hex_colors = []
        if colors:
            sorted_colors = sorted(colors, key=lambda t: t[0], reverse=True)
            for count, color in sorted_colors[:num_colors]:
                if len(color) >= 3:
                    r, g, b = color[:3]
                    hex_colors.append(f"#{r:02x}{g:02x}{b:02x}".upper())
        return hex_colors
    except Exception as e:
        return [str(e)]

results = {}
for img_path in images:
    name = os.path.basename(img_path)
    colors = get_dominant_colors(img_path, num_colors=5)
    results[name] = colors

print(json.dumps(results, indent=2))
