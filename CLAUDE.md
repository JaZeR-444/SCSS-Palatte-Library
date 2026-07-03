# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **no-build SCSS/CSS color palette library** published to npm. There are no compile steps for the library itself — the SCSS files are consumed directly as imports by end-users.

## Palette data: single source of truth

There are two *surfaces* in this repo but **one canonical palette dataset**:

- **`generated/`** is the **single source of truth** for all palette data — `palettes.json` + `palettes.db` (plus `master-index.csv`, `PALETTES.md`). It holds the complete union of every palette (currently 2,556: the curated SCSS palettes **plus** procedurally generated ones authored by `PaletteAgent`). `web-showcase/src/utils/db.ts` already treats it as the seed fallback.
- **`web-showcase/`** — the deployed Next.js 16 app at `app-pallates.vercel.app`. It reads its own local copy in `web-showcase/src/data/{palettes.json,palettes.db}`, which is a **derivative of `generated/`** produced by `sync_palettes.py`. Do not hand-edit these — regenerate them.
- **The npm SCSS library** — the curated **subset** of palettes that have real `.scss` source files in `Palattes by # of Colors/`. `build_index.py` reads those SCSS files and (re)generates the root `palettes.db` (and `archive/showcase/palettes.json` for the retired static gallery). Every curated palette also exists in `generated/`.

**`sync_palettes.py`** propagates `generated/` → the live app's dataset. It replaces only the content tables in `web-showcase/src/data/palettes.db` (rebuilding the `palettes_fts` index) and preserves the app's runtime tables (`collections`, `favorites`, `palette_history`, `role_mappings`). Nothing is deleted.

## Adding a New Palette

Two cases:

**A palette for the live app only** (no SCSS shipped): add the entry to `generated/palettes.json` **and** `generated/palettes.db` (tables `palettes`, `palette_colors`, `palette_tags`, `palette_stats`, and the `palettes_fts` virtual table — no triggers, so FTS must be inserted manually), then run `python sync_palettes.py`.

**A palette that also ships in the npm SCSS library**, update in the same commit:

1. **New SCSS file** in the appropriate `Palattes by # of Colors/N Color Palette/` folder
2. **`_index.scss`** — add an `@import` for the new palette
3. **`GEMINI.md`** — add the file to the "Key Files" section under its color-count heading
4. **`README.md`** — add to the "Available Palettes" list
5. **`CHANGELOG.md`** — add an entry under `[Unreleased]`
6. Add the same palette to **`generated/`** (source of truth) and run **`python sync_palettes.py`** so it appears in the live app. (`build_index.py` regenerates the root `palettes.db` from the SCSS sources.)

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

- **`_index.scss`** — single entry point; imports all 333 palettes via `@import`. This is the `"main"` field in `package.json`.
- **`Palattes by # of Colors/N Color Palette/`** — folders grouping palettes by color count (3–35).
- **`web-showcase/`** — the **one active showcase**: the deployed Next.js 16 app at `app-pallates.vercel.app`. Reads `web-showcase/src/data/` (synced from `generated/` via `sync_palettes.py`).
- **`archive/showcase/`** — the retired legacy static gallery (vanilla HTML/JS). Kept for reference only; **not** deployed and not the source of truth. `build_index.py` regenerates its `palettes.json` from the SCSS sources if run.

The SCSS library itself requires no processing to distribute; consumers run their own SCSS compiler.

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
