# SCSS Color Palettes

This directory contains a curated collection of SCSS-based color palettes designed for web development. Each palette is inspired by a specific theme and provides a comprehensive set of variables for consistent styling.

## Project Overview

The project serves as a library of design assets. Each themed palette is encapsulated in its own `.scss` file, offering a range of color formats and pre-defined gradients. These palettes are sourced from [Coolors.co](https://coolors.co/) as indicated in the file comments.

## Key Files

- **`Arctic Expedition.scss`**: A comprehensive 9-color icy palette from crystal white to polar night blue.
- **`Autumn Harvest.scss`**: A 9-color sequence of earthy browns, burnt oranges, and saffron yellows.
- **`Bold Berry.scss`**: A rich palette featuring berry-inspired shades from soft apricot to night bordeaux.
- **`Deep Forest.scss`**: A lush 9-color sequence of forest greens and misty whites.
- **`Desert Sands.scss`**: Warm earth tones including Persian green and sandy brown.
- **`Enchanted Forest.scss`**: A mystical 9-color palette featuring deep emeralds and moonlight silvers.
- **`Fiery Red Sunset Palette.scss`**: A vibrant sequence of colors ranging from ink black through deep reds to amber flames.
- **`Fresh Greens.scss`**: A palette focused on natural green tones.
- **`Lavender Mist.scss`**: Soft pastel tones including lavender and cotton candy pink.
- **`Midnight Neon.scss`**: High-contrast cyberpunk tones with neon magenta and cyan.
- **`Monochrome Magic.scss`**: A sophisticated grayscale and monochrome color set.
- **`Ocean Blue Serenity.scss`**: Calming blue and aquatic tones.
- **`Soft Pink Delight.scss`**: Gentle and light pink color variations.
- **`Solar Flare.scss`**: A vibrant 9-color sun-inspired palette from deep space blue to electric yellow.
- **`Tropical Paradise.scss`**: A vibrant 9-color island mix from prussian blue to deep hibiscus red.
- **`Urban Industrial.scss`**: A gritty 9-color palette of concrete grays, safety yellow, and industrial red.
- **`Vintage Gold.scss`**: A classic palette featuring midnight black, oxford blue, and orange peel.

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

