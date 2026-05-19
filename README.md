# SCSS Palette Library (v2.0.0)

A professional design system of themed, production-ready SCSS and CSS color palettes, featuring 332+ curated collections.

## 🚀 Installation

You can install this library directly from GitHub into any Node.js/frontend project:

```bash
npm install git+https://github.com/JaZeR-444/SCSS-Palatte-Library.git
```

## 🛠 Usage

### 1. Simple Import
Import the entire library to access every palette:

```scss
@import 'scss-palette-library';

body {
    background: $midnight-asphalt; // Access global variables
    color: map-get($midnight-neon-map, 'neon-magenta'); // Use SCSS Maps
}
```

### 2. Specific Palette
Import only what you need:

```scss
@import 'scss-palette-library/9-color-palette/arctic-expedition';

.header {
    color: $glacier-blue;
}
```

### 3. CSS Variables
Native CSS variables are provided for every palette via the `:root` selector:

```css
.card {
    border: 1px solid var(--deep-kernel);
}
```

## ✨ New in v2.0.0

- **SCSS Maps**: Programmatic access to all colors via `${filename}-map`.
- **Unified Entry Point**: Central `_index.scss` for streamlined imports.
- **Interactive Showcase**: A completely revamped gallery in `/showcase` featuring:
    - **Advanced Search**: Filter 330+ palettes by name or semantic tags (neon, warm, professional, etc.).
    - **Live UI Preview**: Test colors on mock dashboard and mobile components before implementing.
    - **Typography Sandbox**: Check headings, body text, links, badges, blockquotes, and inline code against each palette.
    - **Personal Organization**: Save palettes into named local collections and revisit recently viewed palettes.
    - **One-Click Export**: Copy Tailwind config objects, SCSS Maps, CSS variables, or download PNG swatch sheets instantly.
    - **Accessibility Audit**: Real-time WCAG contrast checking for every color in the library.

## 📁 Repository Structure

- `3 Color Palette/` through `10 Color Palette/`: Categorized SCSS collections.
- `showcase/`: The visual interactive gallery.
- `_index.scss`: The library entry point.
- `package.json`: NPM configuration.

## 🎨 Available Themes

- **Sci-Fi & Tech**: Terminal Matrix, Nebula Void, Cybernetic Steel...
- **Natural**: Deep Forest, Autumn Leaves, Ocean Waves...
- **Vintage & Retro**: Classic Vaporwave, Retro Pop, 90s Metro...
- **Professional**: SaaS Blue, IBM Categorical, Modern Minimalist...
- **Modern UI**: Glass Aurora, Civic Sunrise, Verdant Circuit...
- **Expanded Systems**: Atlas Neutral, Garden System, Maritime Signal, Solar Ledger...
- **Purple Systems**: Royal Iris, Amethyst Haze, Mystic Spectrum, Purple Observatory, Imperial Velvet Atlas...
- **Blue Systems**: Azure Harbor, Cobalt Circuit, Glacier Blue, Sapphire Ledger...
- **Green Systems**: Emerald Circuit, Forest Ledger, Moss Garden, Viridian Harbor...
- **Red Systems**: Crimson Circuit, Ruby Ledger, Ember Market, Rose Signal...
- **Black Systems**: Obsidian Circuit, Carbon Ledger, Ink Studio, Void Chrome...
- **Orange Systems**: Amber Forge, Tangerine Signal, Marigold Commerce, Copper Canyon...
- **Yellow Systems**: Solar Circuit, Lemon Signal, Honey Commerce, Sunflower Field...
- **Pink Systems**: Fuchsia Circuit, Blush Signal, Petal Commerce, Sakura Bloom...
- **White Systems**: Porcelain Circuit, Pearl Signal, Ivory Commerce, Alpine Mist...

## 📜 License

MIT. Free for personal and commercial use.
