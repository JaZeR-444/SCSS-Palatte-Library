# Contributing to SCSS Color Palettes

Thank you for your interest in contributing! This project aims to provide a high-quality collection of themed color palettes for web development.

## How to Propose a New Palette

1.  **Source Your Palette**: We recommend using [Coolors.co](https://coolors.co/) to generate or find a palette.
2.  **Create a New File**: Name your file using `Title Case.scss` (e.g., `Midnight Neon.scss`).
3.  **Follow the Template**: Use the exact structure below.

### Palette Template

```scss
/* [Palette Name] - [Coolors.co URL] */

/* CSS HEX */
--color-name: #hexcode;

/* CSS HSL */
--color-name: hsla(h, s, l, a);

/* SCSS HEX */
$color-name: #hexcode;

/* SCSS HSL */
$color-name: hsla(h, s, l, a);

/* SCSS RGB */
$color-name: rgba(r, g, b, a);

/* SCSS Gradient */
$gradient-top: linear-gradient(0deg, [all-colors-comma-separated]);
$gradient-right: linear-gradient(90deg, [all-colors-comma-separated]);
$gradient-bottom: linear-gradient(180deg, [all-colors-comma-separated]);
$gradient-left: linear-gradient(270deg, [all-colors-comma-separated]);
$gradient-top-right: linear-gradient(45deg, [all-colors-comma-separated]);
$gradient-bottom-right: linear-gradient(135deg, [all-colors-comma-separated]);
$gradient-top-left: linear-gradient(225deg, [all-colors-comma-separated]);
$gradient-bottom-left: linear-gradient(315deg, [all-colors-comma-separated]);
$gradient-radial: radial-gradient([all-colors-comma-separated]);
```

## Naming Conventions

- **File Names**: Use `Title Case` with spaces (e.g., `Summer Breeze.scss`).
- **Variable Names**: Use `kebab-case` for color names (e.g., `--deep-sea-blue` or `$deep-sea-blue`).
- **Descriptive Names**: Choose thematic names that reflect the palette's vibe rather than just "color-1", "color-2".

## Structural Requirements

- **Completeness**: Every palette must include all five sections: CSS HEX, CSS HSL, SCSS HEX, SCSS HSL, SCSS RGB, and SCSS Gradient.
- **Order**: Maintain the order of sections as shown in the template.
- **Gradients**: Include all 9 standard gradient variations (8 directional + 1 radial).
