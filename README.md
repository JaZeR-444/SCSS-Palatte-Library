# SCSS Color Palettes

A curated collection of themed, production-ready SCSS and CSS color palettes.

## Features

- **Multi-Format Support**: Every palette includes CSS Custom Properties (Variables), SCSS Hex, SCSS HSL, and SCSS RGB variables.
- **Pre-defined Gradients**: 9 standard gradient variations (Top, Bottom, Left, Right, Diagonals, and Radial) for every theme.
- **Themed Collections**: Palettes ranging from "Bold Berry" to "Ocean Blue Serenity".
- **Easy Integration**: Drop any `.scss` file into your project and start using the variables immediately.

## Available Palettes

- **Arctic Expedition**: 9-color icy blue and white sequence.
- **Autumn Harvest**: 9-color earth and harvest tones.
- **Bold Berry**: Rich berry tones.
- **Deep Forest**: 9-color lush green and earth tones.
- **Desert Sands**: Warm earth and sand tones.
- **Enchanted Forest**: 9-color mystical green and silver sequence.
- **Fiery Red Sunset**: Vibrant sunset sequence.
- **Fresh Greens**: Natural green variations.
- **Lavender Mist**: Soft pastel shades.
- **Midnight Neon**: Cyberpunk-inspired high-contrast neon.
- **Monochrome Magic**: Professional grayscale sets.
- **Ocean Blue Serenity**: Calming aquatic tones.
- **Soft Pink Delight**: Gentle pink shades.
- **Solar Flare**: 9-color vibrant sun-inspired palette.
- **Tropical Paradise**: 9-color vibrant island and sunset mix.
- **Urban Industrial**: 9-color gritty city and industrial tones.
- **Vintage Gold**: Classic black, blue, and gold tones.

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
