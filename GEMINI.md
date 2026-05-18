# SCSS Color Palettes

This directory contains a curated collection of SCSS-based color palettes designed for web development. Each palette is inspired by a specific theme and provides a comprehensive set of variables for consistent styling.

## Project Overview

The project serves as a library of design assets. Each themed palette is encapsulated in its own `.scss` file, offering a range of color formats and pre-defined gradients. These palettes are sourced from [Coolors.co](https://coolors.co/) as indicated in the file comments.

## Key Files

The palettes are organized into directories based on the number of colors they contain:

### 3 Color Palette
- **`Earthy Organic.scss`**: Natural, grounded tones.
- **`Modern Minimalist.scss`**: Clean, contemporary colors.
- **`Retro Revival.scss`**: Vintage-inspired 3-color set.

### 4 Color Palette
- **`Nature Trail.scss`**: Earthy outdoors tones.
- **`Retro Pop.scss`**: Vibrant 4-color nostalgia.
- **`SaaS Blue.scss`**: Professional software-themed blues.

### 5 Color Palette
- **`Bold Berry.scss`**: Rich berry-inspired shades.
- **`Desert Sands.scss`**: Warm earth tones including Persian green.
- **`Lavender Mist.scss`**: Soft pastel lavender and pink.
- **`Midnight Neon.scss`**: Cyberpunk-inspired neon magenta and cyan.
- **`Monochrome Magic.scss`**: Professional grayscale sets.
- **`Soft Pink Delight.scss`**: Gentle and light pink variations.
- **`Vintage Gold.scss`**: Classic black, oxford blue, and orange peel.

### 6 Color Palette
- **`Cool Oceanic.scss`**: Deep sea and aquatic tones.
- **`Modern Vibe.scss`**: Trendy, contemporary colors.

### 7 Color Palette
- **`Professional IBM.scss`**: Colors inspired by professional enterprise design.
- **`Retro Metro.scss`**: Urban vintage tones.

### 8 Color Palette
- **`Dracula Palette.scss`**: High-contrast dark theme.
- **`Nord Palette.scss`**: Clean, arctic-inspired grays and blues.
- **`Tokyo Night.scss`**: Deep purples and neons of a night cityscape.

### 9 Color Palette
- **`Arctic Expedition.scss`**: Icy palette from crystal white to polar night.
- **`Autumn Harvest.scss`**: Earthy browns, burnt oranges, and saffron.
- **`Deep Forest.scss`**: Lush forest greens and misty whites.
- **`Enchanted Forest.scss`**: Mystical emeralds and moonlight silvers.
- **`Fresh Greens.scss`**: Natural green variations.
- **`Ocean Blue Serenity.scss`**: Calming blue and aquatic tones.
- **`Solar Flare.scss`**: Sun-inspired palette from space blue to yellow.
- **`Tropical Paradise.scss`**: Island mix from prussian blue to hibiscus red.
- **`Urban Industrial.scss`**: Gritty concrete grays and safety yellows.

### 10 Color Palette
- **`Fiery Red Sunset Palette.scss`**: Vibrant sequence from ink black to amber flames.

## Usage

Each palette file is structured to be highly versatile, supporting both modern CSS and SCSS workflows.

### Available Formats

Within each file, you will find:

1.  **CSS Variables**: Native CSS custom properties (e.g., `--soft-apricot`) for use in standard `.css` files.
2.  **SCSS HEX Variables**: SCSS variables using hexadecimal color codes (e.g., `$soft-apricot`).
3.  **SCSS HSL Variables**: SCSS variables using HSL (Hue, Saturation, Lightness) format.
4.  **SCSS RGB Variables**: SCSS variables using RGB (Red, Green, Blue) format.
5.  **SCSS Gradients**: A set of pre-defined linear and radial gradients using the palette's colors.

### Example Integration

To use a palette in your SCSS project:

```scss
@import 'Ocean Blue Serenity';

.element {
  background-color: $ocean-blue;
  color: $white;
  background-image: $gradient-top;
}
```

To use it in a plain CSS project (assuming the file is processed or variables are extracted):

```css
:root {
  /* Copy variables from the file */
  --ocean-blue: #0077b6;
}

.element {
  background-color: var(--ocean-blue);
}
```

## Development Conventions

- **Naming**: Colors are given descriptive, thematic names (e.g., `berry-crush`, `amber-flame`).
- **Completeness**: Each file includes multiple formats (HEX, HSL, RGB) to suit different developer preferences and technical requirements.
- **Gradients**: Standard directional gradients (top, right, bottom, left, and diagonals) and a radial gradient are included in every palette.

## Documentation Synchronization Mandate

**CRITICAL**: To maintain project integrity, whenever a new palette is added or existing documentation is modified, you MUST update the following files in a single turn:
1.  **`GEMINI.md`**: Update the "Key Files" section to include the new palette.
2.  **`README.md`**: Update the "Available Palettes" list.
3.  **`CHANGELOG.md`**: Add a new entry under the `[Unreleased]` or a new version header describing the changes.

