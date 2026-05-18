# SCSS Color Palettes

A curated collection of themed, production-ready SCSS and CSS color palettes.

## Features

- **Multi-Format Support**: Every palette includes CSS Custom Properties (Variables), SCSS Hex, SCSS HSL, and SCSS RGB variables.
- **Pre-defined Gradients**: 9 standard gradient variations (Top, Bottom, Left, Right, Diagonals, and Radial) for every theme.
- **Themed Collections**: Palettes ranging from "Bold Berry" to "Ocean Blue Serenity".
- **Easy Integration**: Drop any `.scss` file into your project and start using the variables immediately.
## Available Palettes

The library is organized into directories based on the color count of each palette (e.g., `3 Color Palette/`, `9 Color Palette/`).

- **3 Color Palettes**: Desert Heat, Earthy Organic, Forest Whisper, Modern Minimalist, Ocean Depth, Retro Revival, Slate Gray, Sunset Glow.
- **4 Color Palettes**: Berry Blast, Coffee Shop, Electric Night, Nature Trail, Retro Pop, SaaS Blue, Spring Meadow, Winter Frost.
- **5 Color Palettes**: Bold Berry, Classic Vaporwave, Cyber Pastel, Deep Space, Desert Sands, Future Shock, Holo Noir, Lavender Mist, Midnight Cyberpunk, Midnight Neon, Monochrome Magic, Muted Earth, Neon Punk, Soft Pink Delight, Tropical Reef, Vintage Gold, Vintage Vibe.
- **6 Color Palettes**: Arctic Night, Cool Oceanic, Forest Canopy, Industrial Gray, Modern Vibe, Royal Purple, Sunset Boulevard.
- **7 Color Palettes**: Autumn Leaves, Fire and Ice, Midnight Sky, Neon Horizon, Ocean Waves, Professional IBM, Rainbow Pastels, Retro Metro.
- **8 Color Palettes**: Cool Blues, Cyberpunk Neon, Dracula Palette, Earth Tones, Monochrome Night, Nord Palette, Tokyo Night, Warm Sunset.
- **9 Color Palettes**: Arctic Expedition, Autumn Harvest, Deep Forest, Deep Ocean, Enchanted Forest, Fresh Greens, Galactic Nebula, Muted Pastels, Ocean Blue Serenity, Rainforest, Solar Flare, Sunset Sands, Tropical Paradise, Urban Industrial.
- **10 Color Palettes**: Blue Ridge, Cybernetic Steel, Dark Forest 10, Fiery Red Sunset Palette, Heatwave 10, Nebula Void, Spectrum 10, Steel & Rust, Synthwave Horizon, Terminal Matrix.

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
