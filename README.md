# SCSS Color Palettes

A curated collection of themed, production-ready SCSS and CSS color palettes.

## Features

- **Multi-Format Support**: Every palette includes CSS Custom Properties (Variables), SCSS Hex, SCSS HSL, and SCSS RGB variables.
- **Pre-defined Gradients**: 9 standard gradient variations (Top, Bottom, Left, Right, Diagonals, and Radial) for every theme.
- **Themed Collections**: Palettes ranging from "Bold Berry" to "Ocean Blue Serenity".
- **Easy Integration**: Drop any `.scss` file into your project and start using the variables immediately.

## Available Palettes

The library is organized into directories based on the color count of each palette (e.g., `3 Color Palette/`, `9 Color Palette/`).

- **3 Color Palettes**: Earthy Organic, Modern Minimalist, Retro Revival.
- **4 Color Palettes**: Nature Trail, Retro Pop, SaaS Blue.
- **5 Color Palettes**: Bold Berry, Desert Sands, Lavender Mist, Midnight Neon, Monochrome Magic, Soft Pink Delight, Vintage Gold.
- **6 Color Palettes**: Cool Oceanic, Modern Vibe.
- **7 Color Palettes**: Professional IBM, Retro Metro.
- **8 Color Palettes**: Dracula, Nord, Tokyo Night.
- **9 Color Palettes**: Arctic Expedition, Autumn Harvest, Deep Forest, Enchanted Forest, Fresh Greens, Ocean Blue Serenity, Solar Flare, Tropical Paradise, Urban Industrial.
- **10 Color Palettes**: Fiery Red Sunset.

## Usage

### SCSS
```scss
@import 'Ocean Blue Serenity';

body {
  background-color: $ocean-blue;
  background-image: $gradient-bottom;
}
```

### CSS
```css
/* After importing or copying variables */
.card {
  color: var(--soft-apricot);
}
```

## Contributing

Interested in adding a palette? Check out our [CONTRIBUTING.md](CONTRIBUTING.md) for a template and naming guidelines.

## Maintenance

For maintainers, please refer to [MAINTENANCE.md](MAINTENANCE.md) for auditing procedures.

## License

This project is open-source. Feel free to use these palettes in your personal or commercial projects.
