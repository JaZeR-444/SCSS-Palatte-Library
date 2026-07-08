<div align="center">
  <br />
  <img src="web-showcase/public/logo.svg" alt="Palattes — Color Palette Library" height="72" />
  <br /><br />

  [![Live Demo](https://img.shields.io/badge/Live_Demo-app--pallates.vercel.app-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://app-pallates.vercel.app)
  [![Palettes](https://img.shields.io/badge/Palettes-3%2C000%2B-F97316?style=for-the-badge)](https://app-pallates.vercel.app)
  [![License](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)
  [![npm](https://img.shields.io/badge/npm-install-CB3837?style=for-the-badge&logo=npm)](https://github.com/JaZeR-444/SCSS-Palatte-Library)

  <p><em>3,000+ production-ready SCSS &amp; CSS color palettes — browse, search, export, and use in any project.</em></p>
</div>

---

## ✨ What is Palattes?

**Palattes** is a dual-purpose repository:

| Layer | Description |
|-------|-------------|
| 📦 **SCSS/CSS Library** | 933+ curated palette files installable via `npm`. Each palette ships in HEX, HSL, RGB, and gradient formats. |
| 🌐 **Interactive Showcase** | A Next.js 16 App Router web app at `web-showcase/` with live preview, search, contrast checking (WCAG), export, and collection management for 3,000+ palettes from a SQLite database. |

---

## 🚀 Live App

**[https://app-pallates.vercel.app](https://app-pallates.vercel.app)**

### App Features

- 🔍 **Full-text search** — fuzzy-match palettes by name, description, tag, or hex value
- 🎨 **3,000+ palettes** served from a normalized SQLite database
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
- 🏷️ **UI Readiness Score** — accessibility mode plus advanced filters for temperature, saturation profile, and span type
- 🧠 **Collection Intelligence** — smart palette recommendations based on active collection composition
- 🔗 **Shareable URLs** — search and filter state synced to URL query params

---

## Lead Viewer Helper

For Zoho or lead-review pages that only show the Search button after highlighting a phone number, use `tools/zoho-one-click-phone-search.user.js` with a userscript manager such as Tampermonkey. It scans the current page for US-style phone numbers, turns each one into a small clickable button, selects the number, and clicks the page's existing `Search` button.

Update the `@match` line in the script to the exact viewer domain before using it.

---

## 📦 SCSS Library — Quick Start

### Install from GitHub

```bash
npm install git+https://github.com/JaZeR-444/SCSS-Palatte-Library.git
```

If npm reports an old cached package after a repository update, clear the entry
or install with a commit SHA:

```bash
npm install git+https://github.com/JaZeR-444/SCSS-Palatte-Library.git#main
```

The package tarball is intentionally limited to `_index.scss`, palette `.scss`
files, and root package docs so installs stay lightweight.

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
@use 'scss-palette-library'; // imports _index.scss → all 933 palettes
```

---

## 🗂️ Repository Structure

```
App - Palattes/
├── Palattes by # of Colors/          # SCSS source palettes (933 total)
│   ├── 3 Color Palette/              # 36 palettes
│   ├── 4 Color Palette/              # 36 palettes
│   ├── 5 Color Palette/              # 44 palettes
│   ├── 6 Color Palette/              # 35 palettes
│   ├── 7 Color Palette/              # 35 palettes
│   ├── 8 Color Palette/              # 53 palettes
│   ├── 9 Color Palette/              # 41 palettes
│   ├── 10 Color Palette/             # 53 palettes
│   └── 11–35 Color Palette/          # 20–31 palettes each (25 folders)
│
├── web-showcase/                     # Next.js 16 App Router showcase
│   ├── src/
│   │   ├── app/                      # layout, page, server actions
│   │   ├── components/               # UI components + Studio
│   │   ├── data/                     # palettes.json + palettes.db
│   │   ├── types/                    # TypeScript types
│   │   └── utils/                    # db, contrast, audio, toast
│   └── public/                       # Brand assets + PWA icons
│       ├── icon.svg                  # App icon (SVG)
│       ├── logo.svg                  # Full wordmark
│       ├── logo-dark.svg             # Dark-mode wordmark
│       ├── og-image.png              # OpenGraph social card (1200×630)
│       ├── icon-192.png              # PWA icon
│       ├── icon-512.png              # PWA icon
│       ├── apple-touch-icon.png      # iOS home screen (180×180)
│       └── site.webmanifest          # PWA manifest
│
├── archive/
│   └── showcase/                     # Retired legacy static gallery (kept for reference)
│
├── generated/                        # Canonical palette dataset (single source of truth)
│   └── palettes.db                   # Normalized SQLite (~3,056 palettes)
│
├── tools/
│   └── zoho-one-click-phone-search.user.js   # Userscript: phone-number search helper
│
├── docs/                             # Additional documentation and plans
│
├── _index.scss                       # npm package entry point
├── build_index.py                    # Regenerates archive data from SCSS sources
├── sync_palettes.py                  # Syncs generated/ dataset → web-showcase/src/data/
├── append_to_generated.py            # Appends new palettes to the canonical dataset
├── enrich_palettes.py                # Enriches palette metadata (tags, descriptions, scores)
├── refine_palettes.py                # Refines and deduplicates palette entries
├── update_index_scss.py              # Regenerates _index.scss from palette sources
├── palettes.db                       # Root SQLite mirror (built by build_index.py)
├── master_index.csv                  # CSV export of all palette metadata
├── color-names.csv                   # Reference color-name dataset
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
# regenerates archive/showcase/palettes.json, PALETTES.md, master_index.csv
```

### Sync palettes to the web app

```bash
python sync_palettes.py
# copies generated/palettes.db → web-showcase/src/data/
```

### Serve the retired static gallery (archived)

```bash
python -m http.server 8000
# open http://localhost:8000/archive/showcase/
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
