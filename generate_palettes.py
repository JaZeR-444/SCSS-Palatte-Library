import colorsys
import os

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hsl(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
    return (round(h * 360), round(s * 100), round(l * 100))

def create_palette(name, colors):
    # colors is a list of tuples (name, hex)
    hex_css = []
    hsl_css = []
    scss_hex_vars = []
    scss_hsl_vars = []
    scss_rgb_vars = []
    
    clean_colors = []
    for c_name, hex_val in colors:
        r, g, b = hex_to_rgb(hex_val)
        h, s, l = rgb_to_hsl(r, g, b)
        
        hex_val_full = hex_val.lower().lstrip('#')
        if len(hex_val_full) == 6:
            hex_val_full += 'ff'
            
        hex_css.append(f"--{c_name}: #{hex_val_full};")
        hsl_css.append(f"--{c_name}: hsla({h}, {s}%, {l}%, 1);")
        scss_hex_vars.append(f"${c_name}: #{hex_val_full};")
        scss_hsl_vars.append(f"${c_name}: hsla({h}, {s}%, {l}%, 1);")
        scss_rgb_vars.append(f"${c_name}: rgba({r}, {g}, {b}, 1);")
        clean_colors.append(f"#{hex_val_full}")

    grad_list = ", ".join(clean_colors)
    
    content = f"/* {name} - https://coolors.co/ */\n\n"
    content += ":root {\n"
    content += "/* CSS HEX */\n" + "\n".join(hex_css) + "\n\n"
    content += "/* CSS HSL */\n" + "\n".join(hsl_css) + "\n"
    content += "}\n\n"
    
    content += "/* SCSS HEX */\n" + "\n".join(scss_hex_vars) + "\n\n"
    content += "/* SCSS HSL */\n" + "\n".join(scss_hsl_vars) + "\n\n"
    content += "/* SCSS RGB */\n" + "\n".join(scss_rgb_vars) + "\n\n"
    
    content += "/* SCSS Gradient */\n"
    content += f"$gradient-top: linear-gradient(0deg, {grad_list});\n"
    content += f"$gradient-right: linear-gradient(90deg, {grad_list});\n"
    content += f"$gradient-bottom: linear-gradient(180deg, {grad_list});\n"
    content += f"$gradient-left: linear-gradient(270deg, {grad_list});\n"
    content += f"$gradient-top-right: linear-gradient(45deg, {grad_list});\n"
    content += f"$gradient-bottom-right: linear-gradient(135deg, {grad_list});\n"
    content += f"$gradient-top-left: linear-gradient(225deg, {grad_list});\n"
    content += f"$gradient-bottom-left: linear-gradient(315deg, {grad_list});\n"
    content += f"$gradient-radial: radial-gradient({grad_list});\n"
    
    with open(f"{name}.scss", "w") as f:
        f.write(content)

palettes = [
    ("Forest Whisper", [("deep-emerald", "#2d6a4f"), ("moss-green", "#40916c"), ("sage-leaf", "#52b788")]),
    ("Ocean Depth", [("midnight-blue", "#03045e"), ("star-command-blue", "#0077b6"), ("blue-grotto", "#00b4d8")]),
    ("Sunset Glow", [("cherry-blossom", "#ff4d6d"), ("rose-pink", "#ff758f"), ("flamingo-pink", "#ff8fa3")]),
    ("Desert Heat", [("tiger-eye", "#bc6c25"), ("fawn", "#dda15e"), ("cornsilk", "#fefae0")]),
    ("Slate Gray", [("eerie-black", "#212529"), ("jet", "#343a40"), ("outer-space", "#495057")]),
    
    ("Spring Meadow", [("apple-green", "#55a630"), ("yellow-green", "#80b918"), ("lime-green", "#aacc00"), ("pear", "#bfd200")]),
    ("Berry Blast", [("grape", "#7209b7"), ("mulberry", "#b5179e"), ("rose-madder", "#f72585"), ("crimson", "#ff4d6d")]),
    ("Electric Night", [("persian-blue", "#3a0ca3"), ("royal-blue", "#4361ee"), ("vivid-sky-blue", "#4cc9f0"), ("bleu-de-france", "#4895ef")]),
    ("Coffee Shop", [("licorice", "#220901"), ("blood-red", "#621708"), ("ruby-red", "#941b0c"), ("burnt-orange", "#bc3908")]),
    ("Winter Frost", [("capri", "#00b4d8"), ("diamond", "#90e0ef"), ("alice-blue", "#caf0f8"), ("non-photo-blue", "#ade8f4")]),
    
    ("Deep Space", [("rich-black", "#0b090a"), ("gunmetal", "#161a1d"), ("blood-red", "#660708"), ("dark-red", "#a4161a"), ("fire-brick", "#ba181b")]),
    ("Tropical Reef", [("star-command-blue", "#0077b6"), ("blue-sapphire", "#0096c7"), ("pacific-blue", "#00b4d8"), ("sky-blue-crayola", "#48cae4"), ("non-photo-blue", "#90e0ef")]),
    ("Vintage Vibe", [("charcoal", "#264653"), ("persian-green", "#2a9d8f"), ("maize-crayola", "#e9c46a"), ("sandy-brown", "#f4a261"), ("burnt-sienna", "#e76f51")]),
    ("Neon Punk", [("rose-red", "#ff0054"), ("orange-pantone", "#ff5400"), ("amber", "#ffbd00"), ("mindaro", "#e9ff70"), ("aquamarine", "#00f5d4")]),
    ("Muted Earth", [("artichoke", "#6b705c"), ("sage", "#a5a58d"), ("ash-gray", "#b7b7a4"), ("linen", "#ffe8d6"), ("desert-sand", "#ddbea9")]),
    
    ("Arctic Night", [("navy-blue", "#03045e"), ("dark-blue", "#023e8a"), ("star-command-blue", "#0077b6"), ("blue-sapphire", "#0096c7"), ("pacific-blue", "#00b4d8"), ("sky-blue-crayola", "#48cae4")]),
    ("Sunset Boulevard", [("red", "#ff0000"), ("orange-red", "#ff4d00"), ("orange", "#ff8e00"), ("amber", "#ffc900"), ("yellow", "#ffee00"), ("lime", "#d4ff00")]),
    ("Forest Canopy", [("dark-jungle-green", "#081c15"), ("brunswick-green", "#1b4332"), ("castleton-green", "#2d6a4f"), ("illuminating-emerald", "#40916c"), ("zomp", "#52b788"), ("granny-smith-apple", "#74c69d")]),
    ("Royal Purple", [("russian-violet", "#240046"), ("persian-indigo", "#3c096c"), ("purple-pizzazz", "#5a189a"), ("grape", "#7b2cbf"), ("amethyst", "#9d4edd"), ("heliotrope", "#c77dff")]),
    ("Industrial Gray", [("eerie-black", "#212529"), ("jet", "#343a40"), ("outer-space", "#495057"), ("dim-gray", "#6c757d"), ("silver-chalice", "#adb5bd"), ("silver", "#ced4da")]),
    
    ("Fire and Ice", [("navy-blue", "#03045e"), ("star-command-blue", "#0077b6"), ("pacific-blue", "#00b4d8"), ("non-photo-blue", "#90e0ef"), ("rose-red", "#ff4d6d"), ("crimson", "#c9184a"), ("burgundy", "#800f2f")]),
    ("Rainbow Pastels", [("melon", "#ffadad"), ("apricot", "#ffd6a5"), ("cream", "#fdffb6"), ("tea-green", "#caffbf"), ("electric-blue", "#9bf6ff"), ("periwinkle", "#a0c4ff"), ("mauve", "#bdb2ff")]),
    ("Autumn Leaves", [("maroon", "#3d0000"), ("rosewood", "#5a1207"), ("oxblood", "#903112"), ("rust", "#bc5421"), ("copper", "#de7c3e"), ("apricot-orange", "#f1a16d"), ("peach", "#f8c291")]),
    ("Ocean Waves", [("rich-black", "#001219"), ("midnight-green", "#005f73"), ("dark-cyan", "#0a9396"), ("tiffany-blue", "#94d2bd"), ("vanilla", "#e9d8a6"), ("gamboge", "#ee9b00"), ("alloy-orange", "#ca6702")]),
    ("Midnight Sky", [("black", "#010101"), ("oxford-blue", "#0d1b2a"), ("space-cadet", "#1b263b"), ("bdazzled-blue", "#415a77"), ("shadow-blue", "#778da9"), ("artichoke", "#a3b18a"), ("timberwolf", "#dad7cd")]),
    
    ("Cyberpunk Neon", [("rose-red", "#f72585"), ("mulberry", "#b5179e"), ("grape", "#7209b7"), ("violet", "#560bad"), ("indigo", "#480ca8"), ("persian-blue", "#3a0ca3"), ("neon-blue", "#3f37c9"), ("royal-blue", "#4361ee")]),
    ("Earth Tones", [("dark-green", "#283618"), ("olive-drab", "#606c38"), ("cornsilk", "#fefae0"), ("fawn", "#dda15e"), ("tiger-eye", "#bc6c25"), ("sepia", "#582f0e"), ("coffee", "#7f4f24"), ("walnut", "#936639")]),
    ("Cool Blues", [("prussian-blue", "#012a4a"), ("indigo-dye", "#013a63"), ("usafa-blue", "#01497c"), ("lapislazuli", "#014f86"), ("blue-munsell", "#2a6f97"), ("celadon-blue", "#2c7da0"), ("maximum-blue", "#468faf"), ("sky-blue", "#61a5c2")]),
    ("Warm Sunset", [("claret", "#590d22"), ("burgundy", "#800f2f"), ("crimson", "#a4133c"), ("rose-red", "#c9184a"), ("rose-pink", "#ff4d6d"), ("cherry-blossom", "#ff758f"), ("tickle-me-pink", "#ff8fa3"), ("orchid-pink", "#ffb3c1")]),
    ("Monochrome Night", [("black", "#000000"), ("oxford-blue", "#14213d"), ("orange-peel", "#fca311"), ("platinum", "#e5e5e5"), ("white", "#ffffff"), ("dim-gray", "#6d6875"), ("silver-pink", "#b5a4a3"), ("apricot", "#ffcdb2")]),
    
    ("Galactic Nebula", [("black", "#0b090a"), ("gunmetal", "#161a1d"), ("blood-red", "#660708"), ("dark-red", "#a4161a"), ("fire-brick", "#ba181b"), ("engineering-orange", "#e5383b"), ("silver", "#b1a7a6"), ("light-gray", "#d3d3d3"), ("seashell", "#f5f3f4")]),
    ("Rainforest", [("dark-green", "#004b23"), ("pakistan-green", "#006400"), ("office-green", "#007200"), ("green", "#008000"), ("kelly-green", "#38b000"), ("lawngreen", "#70e000"), ("chartreuse", "#9ef01a"), ("lime-green", "#ccff33"), ("fluorescent-yellow", "#e5ff00")]),
    ("Deep Ocean", [("rich-black", "#000814"), ("oxford-blue", "#001d3d"), ("royal-blue", "#003566"), ("amber", "#ffc300"), ("gold", "#ffd6a5"), ("deep-koamaru", "#1b263b"), ("shadow-blue", "#415a77"), ("cool-gray", "#778da9"), ("silver", "#bdc3c7")]),
    ("Sunset Sands", [("rich-black", "#001219"), ("midnight-green", "#005f73"), ("dark-cyan", "#0a9396"), ("tiffany-blue", "#94d2bd"), ("vanilla", "#e9d8a6"), ("gamboge", "#ee9b00"), ("alloy-orange", "#ca6702"), ("rust", "#bb3e03"), ("auburn", "#ae2012")]),
    ("Muted Pastels", [("artichoke", "#6b705c"), ("sage", "#a5a58d"), ("ash-gray", "#b7b7a4"), ("linen", "#ffe8d6"), ("desert-sand", "#ddbea9"), ("rosy-brown", "#cb997e"), ("silver", "#b7b7a4"), ("khaki", "#c2b280"), ("tan", "#d2b48c")]),
    
    ("Spectrum 10", [("red", "#ff0000"), ("orange", "#ff8700"), ("amber", "#ffd300"), ("yellow", "#deff0a"), ("lime", "#a1ff0a"), ("spring-green", "#0aff99"), ("cyan", "#0aefff"), ("azure", "#147df5"), ("blue", "#580aff"), ("violet", "#be0aff")]),
    ("Dark Forest 10", [("dark-jungle-green", "#081c15"), ("brunswick-green", "#1b4332"), ("castleton-green", "#2d6a4f"), ("illuminating-emerald", "#40916c"), ("zomp", "#52b788"), ("granny-smith-apple", "#74c69d"), ("mint", "#95d5b2"), ("celadon", "#b7e4c7"), ("tea-green", "#d8f3dc"), ("white", "#ffffff")]),
    ("Blue Ridge", [("navy-blue", "#03045e"), ("dark-blue", "#023e8a"), ("star-command-blue", "#0077b6"), ("blue-sapphire", "#0096c7"), ("pacific-blue", "#00b4d8"), ("sky-blue-crayola", "#48cae4"), ("non-photo-blue", "#90e0ef"), ("diamond", "#ade8f4"), ("alice-blue", "#caf0f8"), ("ghost-white", "#f0f9ff")]),
    ("Heatwave 10", [("chocolate-cosmos", "#370617"), ("rosewood", "#6a040f"), ("dark-red", "#9d0208"), ("red", "#d00000"), ("vermilion", "#dc2f02"), ("pumpkin", "#e85d04"), ("orange", "#f48c06"), ("amber", "#faa307"), ("golden-yellow", "#ffba08"), ("yellow", "#ffd60a")]),
    ("Steel & Rust", [("eerie-black", "#212529"), ("jet", "#343a40"), ("outer-space", "#495057"), ("dim-gray", "#6c757d"), ("silver-chalice", "#adb5bd"), ("silver", "#ced4da"), ("platinum", "#dee2e6"), ("gainsboro", "#e9ecef"), ("white-smoke", "#f8f9fa"), ("white", "#ffffff")]),
]

for name, colors in palettes:
    create_palette(name, colors)
