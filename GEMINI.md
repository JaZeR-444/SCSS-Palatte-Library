# SCSS Color Palettes

This directory contains a curated collection of SCSS-based color palettes designed for web development. Each palette is inspired by a specific theme and provides a comprehensive set of variables for consistent styling.

## Project Overview

The project serves as a library of design assets. Each themed palette is encapsulated in its own `.scss` file, offering a range of color formats and pre-defined gradients. These palettes are sourced from [Coolors.co](https://coolors.co/) as indicated in the file comments.

## Key Files

The palettes are organized into directories based on the number of colors they contain:

### 3 Color Palette
- **`Desert Heat.scss`**: Thematic color palette.
- **`Earthy Organic.scss`**: Thematic color palette.
- **`Forest Whisper.scss`**: Thematic color palette.
- **`Modern Minimalist.scss`**: Thematic color palette.
- **`Ocean Depth.scss`**: Thematic color palette.
- **`Retro Revival.scss`**: Thematic color palette.
- **`Slate Gray.scss`**: Thematic color palette.
- **`Sunset Glow.scss`**: Thematic color palette.

### 4 Color Palette
- **`Berry Blast.scss`**: Thematic color palette.
- **`Coffee Shop.scss`**: Thematic color palette.
- **`Electric Night.scss`**: Thematic color palette.
- **`Nature Trail.scss`**: Thematic color palette.
- **`Retro Pop.scss`**: Thematic color palette.
- **`SaaS Blue.scss`**: Thematic color palette.
- **`Spring Meadow.scss`**: Thematic color palette.
- **`Winter Frost.scss`**: Thematic color palette.

### 5 Color Palette
- **`Bold Berry.scss`**: Thematic color palette.
- **`Classic Vaporwave.scss`**: Thematic color palette.
- **`Cyber Pastel.scss`**: Thematic color palette.
- **`Deep Space.scss`**: Thematic color palette.
- **`Desert Sands.scss`**: Thematic color palette.
- **`Future Shock.scss`**: Thematic color palette.
- **`Holo Noir.scss`**: Thematic color palette.
- **`Lavender Mist.scss`**: Thematic color palette.
- **`Midnight Cyberpunk.scss`**: Thematic color palette.
- **`Midnight Neon.scss`**: Thematic color palette.
- **`Monochrome Magic.scss`**: Thematic color palette.
- **`Muted Earth.scss`**: Thematic color palette.
- **`Neon Punk.scss`**: Thematic color palette.
- **`Soft Pink Delight.scss`**: Thematic color palette.
- **`Tropical Reef.scss`**: Thematic color palette.
- **`Vintage Gold.scss`**: Thematic color palette.
- **`Vintage Vibe.scss`**: Thematic color palette.

### 6 Color Palette
- **`Arctic Night.scss`**: Thematic color palette.
- **`Cool Oceanic.scss`**: Thematic color palette.
- **`Forest Canopy.scss`**: Thematic color palette.
- **`Industrial Gray.scss`**: Thematic color palette.
- **`Modern Vibe.scss`**: Thematic color palette.
- **`Royal Purple.scss`**: Thematic color palette.
- **`Sunset Boulevard.scss`**: Thematic color palette.

### 7 Color Palette
- **`Autumn Leaves.scss`**: Thematic color palette.
- **`Fire and Ice.scss`**: Thematic color palette.
- **`Midnight Sky.scss`**: Thematic color palette.
- **`Neon Horizon.scss`**: Thematic color palette.
- **`Ocean Waves.scss`**: Thematic color palette.
- **`Professional IBM.scss`**: Thematic color palette.
- **`Rainbow Pastels.scss`**: Thematic color palette.
- **`Retro Metro.scss`**: Thematic color palette.

### 8 Color Palette
- **`Cool Blues.scss`**: Thematic color palette.
- **`Cyberpunk Neon.scss`**: Thematic color palette.
- **`Dracula Palette.scss`**: Thematic color palette.
- **`Earth Tones.scss`**: Thematic color palette.
- **`Monochrome Night.scss`**: Thematic color palette.
- **`Nord Palette.scss`**: Thematic color palette.
- **`Tokyo Night.scss`**: Thematic color palette.
- **`Warm Sunset.scss`**: Thematic color palette.

### 9 Color Palette
- **`Arctic Expedition.scss`**: Thematic color palette.
- **`Autumn Harvest.scss`**: Thematic color palette.
- **`Deep Forest.scss`**: Thematic color palette.
- **`Deep Ocean.scss`**: Thematic color palette.
- **`Enchanted Forest.scss`**: Thematic color palette.
- **`Fresh Greens.scss`**: Thematic color palette.
- **`Galactic Nebula.scss`**: Thematic color palette.
- **`Muted Pastels.scss`**: Thematic color palette.
- **`Ocean Blue Serenity.scss`**: Thematic color palette.
- **`Rainforest.scss`**: Thematic color palette.
- **`Solar Flare.scss`**: Thematic color palette.
- **`Sunset Sands.scss`**: Thematic color palette.
- **`Tropical Paradise.scss`**: Thematic color palette.
- **`Urban Industrial.scss`**: Thematic color palette.

### 10 Color Palette
- **`Blue Ridge.scss`**: Thematic color palette.
- **`Cybernetic Steel.scss`**: Thematic color palette.
- **`Dark Forest 10.scss`**: Thematic color palette.
- **`Fiery Red Sunset Palette.scss`**: Thematic color palette.
- **`Heatwave 10.scss`**: Thematic color palette.
- **`Nebula Void.scss`**: Thematic color palette.
- **`Spectrum 10.scss`**: Thematic color palette.
- **`Steel & Rust.scss`**: Thematic color palette.
- **`Synthwave Horizon.scss`**: Thematic color palette.
- **`Terminal Matrix.scss`**: Thematic color palette.

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

