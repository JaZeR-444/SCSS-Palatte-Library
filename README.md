<div align="center">
  <br />
  <img src="web-showcase/public/logo.svg" alt="Palattes — Color Palette Library" height="72" />
  <br /><br />

  [![Live Demo](https://img.shields.io/badge/Live_Demo-app--pallates.vercel.app-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://app-pallates.vercel.app)
  [![Palettes](https://img.shields.io/badge/Palettes-2%2C555%2B-F97316?style=for-the-badge)](https://app-pallates.vercel.app)
  [![License](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)
  [![npm](https://img.shields.io/badge/npm-install-CB3837?style=for-the-badge&logo=npm)](https://github.com/JaZeR-444/SCSS-Palatte-Library)

  <p><em>2,500+ production-ready SCSS & CSS color palettes — browse, search, export, and use in any project.</em></p>
</div>

---

## ✨ What is Palattes?

**Palattes** is a dual-purpose repository:

| Layer | Description |
|-------|-------------|
| 📦 **SCSS/CSS Library** | 332+ curated palette files installable via `npm`. Each palette ships in HEX, HSL, RGB, and gradient formats. |
| 🌐 **Interactive Showcase** | A Next.js 15 App Router web app at `web-showcase/` with live preview, search, contrast checking (WCAG), export, and collection management for 2,555+ palettes from a SQLite database. |

---

## 🚀 Live App

**[https://app-pallates.vercel.app](https://app-pallates.vercel.app)**

### App Features

- 🔍 **Full-text search** — fuzzy-match palettes by name, description, tag, or hex value
- 🎨 **2,555+ palettes** served from a normalized SQLite database
- 🌓 **Dark / Light mode** with system preference support
- ♿ **WCAG contrast checker** — AA/AAA pass/fail for any palette
- 🎭 **Colorblind simulation** — Protanopia, Deuteranopia, Tritanopia, Achromatopsia
- 📋 **One-click export** — CSS variables, SCSS map, Tailwind config, raw hex array
- ❤️ **Favorites** — persisted in SQLite
- 🗂️ **Collections** — create named collections, add/remove palettes
- 🎲 **Random palette** — discover something new instantly
- 🎛️ **Studio Mode** — deep-dive view with role mapping and audio feedback
- 📱 **Fully responsive** — mobile, tablet, and desktop
- 🔧 **Palette Creator** — build your own palette and save to the library

---

## 📦 SCSS Library — Quick Start

### Install from GitHub

```bash
npm install git+https://github.com/JaZeR-444/SCSS-Palatte-Library.git
```

### Import a palette

```scss
// Single palette
@use 'scss-palette-library/Palattes by # of Colors/5 Color Palette/Midnight Neon' as *;

.hero {
  background: $gradient-top;
  color: $electric-violet;
}
```

```css
/* CSS custom properties (no pre-processing needed) */
:root {
  --electric-violet: #7b2fff;
}
```

### Import everything

```scss
@use 'scss-palette-library'; // imports _index.scss → all 332 palettes
```

---

## 🗂️ Repository Structure

```
App - Palattes/
├── Palattes by # of Colors/          # SCSS source palettes
│   ├── 3 Color Palette/              # 8 palettes
│   ├── 4 Color Palette/              # 8 palettes
│   ├── 5 Color Palette/              # 17 palettes
│   ├── 6 Color Palette/              # 7 palettes
│   ├── 7 Color Palette/              # 8 palettes
│   ├── 8 Color Palette/              # 8 palettes
│   ├── 9 Color Palette/              # 14 palettes
│   ├── 10 Color Palette/             # 10 palettes
│   └── 11–35 Color Palette/          # reserved for future palettes
│
├── web-showcase/                     # Next.js 15 App Router showcase
│   ├── src/
│   │   ├── app/                      # layout, page, server actions
│   │   ├── components/               # UI components + Studio
│   │   ├── data/                     # palettes.json + palettes.db
│   │   ├── types/                    # TypeScript types
│   │   └── utils/                    # db, contrast, audio, toast
│   └── public/                       # Brand assets + PWA icons
│       ├── icon.svg                  # App icon (SVG)
│       ├── logo.svg                  # Full wordmark
│       ├── og-image.png              # OpenGraph social card (1200×630)
│       ├── icon-192.png              # PWA icon
│       ├── icon-512.png              # PWA icon
│       ├── apple-touch-icon.png      # iOS home screen (180×180)
│       └── site.webmanifest          # PWA manifest
│
├── showcase/                         # Legacy static gallery
│   ├── index.html
│   ├── app.js
│   └── palettes.json                 # Generated from build_index.py
│
├── generated/                        # Generated assets
│   └── palettes.db                   # Normalized SQLite (2,555 palettes)
│
├── _index.scss                       # npm package entry point
├── build_index.py                    # Regenerates showcase data from SCSS
├── package.json                      # npm package config (SCSS library)
└── CHANGELOG.md
```

---

## 🎨 Brand Assets

| Asset | Path | Usage |
|-------|------|-------|
| App Icon (SVG) | `web-showcase/public/icon.svg` | Favicon, header mark |
| Full Wordmark | `web-showcase/public/logo.svg` | Light backgrounds |
| Dark Wordmark | `web-showcase/public/logo-dark.svg` | Dark backgrounds |
| OG Image | `web-showcase/public/og-image.png` | Social sharing (1200×630) |
| PWA Icon 192 | `web-showcase/public/icon-192.png` | Android home screen |
| PWA Icon 512 | `web-showcase/public/icon-512.png` | Android splash |
| Apple Touch | `web-showcase/public/apple-touch-icon.png` | iOS home screen |

**Brand colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| Indigo | `#6366F1` | Primary / interactive |
| Emerald | `#10B981` | Success / accent |
| Orange | `#F97316` | CTA / highlight |
| Pink | `#EC4899` | Tag / mood |
| Violet | `#8B5CF6` | Secondary accent |
| Cyan | `#06B6D4` | Aesthetic tag |
| Dark BG | `#0F172A` | App dark background |

---

## 🛠️ Development

### Run the showcase locally

```bash
cd web-showcase
npm install
npm run dev
# open http://localhost:3000
```

### Rebuild palette index

```bash
python build_index.py
# regenerates showcase/palettes.json, PALETTES.md, master_index.csv
```

### Serve the legacy static gallery

```bash
python -m http.server 8000
# open http://localhost:8000/showcase/
```

---

## 📋 Palette Format

Every `.scss` file follows this structure:

```scss
/*---
title: Midnight Neon
description: Electric neons against deep midnight black for a futuristic edge.
tags: ["neon", "dark", "cyberpunk"]
categories: ["5 Color"]
url: https://coolors.co/...
---*/

:root {
  /* CSS HEX */
  --electric-violet: #7b2fff;
  /* CSS HSL */
  --electric-violet-hsl: hsla(264, 100%, 59%, 1);
}

/* SCSS HEX */
$electric-violet: #7b2fff;

/* SCSS Gradient */
$gradient-top: linear-gradient(0deg, #7b2fff, #00f5d4, ...);
$gradient-radial: radial-gradient(ellipse at center, ...);

/* SCSS Map */
$midnight-neon-map: (
  "electric-violet": #7b2fff,
);
```

---

## 📄 License

MIT © [JaZeR-444](https://github.com/JaZeR-444)

