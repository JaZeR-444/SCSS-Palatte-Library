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
    hex_vars = []
    hsl_vars = []
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
            
        hex_vars.append(f"--{c_name}: #{hex_val_full};")
        hsl_vars.append(f"--{c_name}: hsla({h}, {s}%, {l}%, 1);")
        scss_hex_vars.append(f"${c_name}: #{hex_val_full};")
        scss_hsl_vars.append(f"${c_name}: hsla({h}, {s}%, {l}%, 1);")
        scss_rgb_vars.append(f"${c_name}: rgba({r}, {g}, {b}, 1);")
        clean_colors.append(f"#{hex_val_full}")

    grad_list = ", ".join(clean_colors)
    
    content = f"/* {name} */\n\n"
    content += "/* CSS HEX */\n" + "\n".join(hex_vars) + "\n\n"
    content += "/* CSS HSL */\n" + "\n".join(hsl_vars) + "\n\n"
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

]

for name, colors in palettes:
    create_palette(name, colors)
