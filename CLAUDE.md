# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **no-build SCSS/CSS color palette library** published to npm. There are no compile steps, dev servers, or test runners. The SCSS files are consumed directly as imports by end-users.

## Adding a New Palette

When adding a palette, **all four of these files must be updated in the same commit**:

1. **New SCSS file** in the appropriate `Palattes by # of Colors/N Color Palette/` folder
2. **`_index.scss`** — add a `@use` import for the new palette
3. **`showcase/palettes.json`** — add the palette metadata entry
4. **`GEMINI.md`** — add the file to the "Key Files" section under its color-count heading
5. **`README.md`** — add to the "Available Palettes" list
6. **`CHANGELOG.md`** — add an entry under `[Unreleased]`

## SCSS Palette Template

Every palette file must follow this exact structure (all six sections are required):

```scss
/*---
title: [Palette Name]
description: [One-sentence thematic description]
tags: ["tag1", "tag2"]
categories: ["N Color"]
url: [Coolors.co URL]
---*/

:root {
  /* CSS HEX */
  --color-name: #hexcode;

  /* CSS HSL */
  --color-name: hsla(h, s%, l%, a);
}
```
/* SCSS HEX */
$color-name: #hexcode;

/* SCSS HSL */
$color-name: hsla(h, s%, l%, a);

/* SCSS RGB */
$color-name: rgba(r, g, b, a);

/* SCSS Gradient */
$gradient-top: linear-gradient(0deg, #hex1, #hex2, ...);
$gradient-right: linear-gradient(90deg, ...);
$gradient-bottom: linear-gradient(180deg, ...);
$gradient-left: linear-gradient(270deg, ...);
$gradient-top-right: linear-gradient(45deg, ...);
$gradient-bottom-right: linear-gradient(135deg, ...);
$gradient-top-left: linear-gradient(225deg, ...);
$gradient-bottom-left: linear-gradient(315deg, ...);
$gradient-radial: radial-gradient(ellipse at center, ...);

/* SCSS Map */
$palette-name-map: (
  "color-name": #hexcode,
);
```

**Naming conventions:** File names use Title Case (e.g., `Ocean Depth.scss`). SCSS variables use kebab-case (e.g., `$ocean-blue`). CSS custom properties mirror the SCSS variable names with `--` prefix.

## Repository Architecture

- **`_index.scss`** — single entry point; imports all 81 palettes via `@use`. This is the `"main"` field in `package.json`.
- **`Palattes by # of Colors/N Color Palette/`** — folders grouping palettes by color count (3–35).
- **`showcase/`** — standalone interactive gallery; no build tooling.
  - `index.html` — Tailwind CSS (CDN) + GSAP + FontAwesome, all via CDN.
  - `app.js` — vanilla JS (~400 lines); loads `palettes.json`, renders the grid, handles search/filter, contrast checking (WCAG), clipboard copy, dark mode, and export (Tailwind config, SCSS Maps, CSS variables).
  - `palettes.json` — source of truth for the showcase; shape: `{ id, name, description, count, colors: [{ name, hex }], path, folder, tags }`.
  - `style.css` — custom animations and glassmorphism; supplements Tailwind.

The showcase is self-contained and opens directly in a browser — just open `showcase/index.html`. The SCSS library itself requires no processing to distribute; consumers run their own SCSS compiler.

## palettes.json Entry Shape

```json
{
  "id": "kebab-case-id",
  "name": "Palette Name",
  "description": "One-sentence thematic description.",
  "count": 5,
  "colors": [
    { "name": "Color Name", "hex": "#rrggbbff" }
  ],
  "path": "Palattes by # of Colors/5 Color Palette/Palette Name.scss",
  "folder": "5 Color Palette",
  "tags": ["tag1", "tag2"]
}
```

Hex values in `palettes.json` use 8-digit format (`#rrggbbff` with full alpha).
