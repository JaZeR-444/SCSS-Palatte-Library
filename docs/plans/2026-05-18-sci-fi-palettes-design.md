# Design Doc: Sci-Fi & Tech 10-Color Palettes

**Date:** 2026-05-18
**Topic:** Sci-Fi & Tech 10-Color Expansion

## Overview
Expand the `10 Color Palette` directory with four new thematic collections inspired by Sci-Fi and Technology. Each palette will feature a 10-color **Linear Gradient Flow**, moving from deep darks to high-intensity light tones.

## Palette Specifications

### 1. Terminal Matrix (`Terminal Matrix.scss`)
*Vibe: Classic green-on-black computing.*
1. #0d1117 (Console Void)
2. #003822 (Deep Kernel)
3. #004d2c (Terminal Forest)
4. #006437 (Old CRT)
5. #007a41 (Code Stream)
6. #00914c (Command Line)
7. #00a856 (Green Phosphorus)
8. #00bf61 (Digital Moss)
9. #00d66b (Data Pulse)
10. #00ed76 (Glitch Mint)

### 2. Nebula Void (`Nebula Void.scss`)
*Vibe: Deep space exploration and galactic gas clouds.*
1. #03001e (Event Horizon)
2. #12002f (Stellar Abyss)
3. #2a004e (Interstellar Purple)
4. #440074 (Nebula Core)
5. #5d009b (Cosmic Violet)
6. #7600c1 (Nova Glow)
7. #8f00e8 (Pulsar Pink)
8. #a842f1 (Star Dust)
9. #c184f9 (Orion Mist)
10. #da9ff9 (Supernova Light)

### 3. Cybernetic Steel (`Cybernetic Steel.scss`)
*Vibe: Industrial robotics and metallic textures.*
1. #1a1a1a (Oil Slick)
2. #2b2d42 (Industrial Slate)
3. #3d405b (Machine Gray)
4. #4a4e69 (Gunmetal)
5. #5f647d (Hydraulic Blue)
6. #747d92 (Titanium)
7. #8d99ae (Brushed Steel)
8. #a2abbd (Chrome Plate)
9. #b8bdcc (Cool Silicon)
10. #edf2f4 (LED Neutral)

### 4. Synthwave Horizon (`Synthwave Horizon.scss`)
*Vibe: 80s retro-futurism and sunset grids.*
1. #120458 (Midnight City)
2. #2d0b7d (Neon Indigo)
3. #4a0e8f (Cyber Purple)
4. #7a0c9a (Vaporwave Violet)
5. #a0069a (Electric Magenta)
6. #c600a0 (Sunset Pink)
7. #e500a4 (Laser Fuchsia)
8. #ff00ab (Hot Neon)
9. #3df9ff (Grid Cyan)
10. #a0fefe (Sky Blue Glitch)

## Implementation Rules
- Files must be placed in the `10 Color Palette/` directory.
- Each file must include:
    - CSS Variables (`--name`)
    - SCSS HEX Variables (`$name`)
    - SCSS HSL Variables
    - SCSS RGB Variables
    - 9 standard gradients using all 10 colors.
- Documentation (`GEMINI.md`, `README.md`, `CHANGELOG.md`) must be updated to reflect version 1.5.0.
