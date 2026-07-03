# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **GitHub npm Install Package Surface**: Limited the install tarball to SCSS library files and root package docs, and added Sass-aware package metadata for downstream imports.
- **License File**: Added the missing MIT `LICENSE` file referenced by package metadata and README badges.

### Added
- **Tonary Neural Indigo**: New 8-color palette derived from the Tonary.io brand icon — a deep indigo-to-cyan tech ramp.
- **New Palette Options**: Ember Dusk, Glass Aurora, Verdant Circuit, and Civic Sunrise.
- **40-Palette Expansion**: Added five new palettes each to the 3-color through 10-color folders.
- **Purple-Focused Palettes**: Added Royal Iris, Amethyst Haze, Plum Circuit, Violet Vineyard, Ultraviolet Bloom, Lavender Ledger, Mystic Spectrum, and Purple Observatory.
- **Purple Systems Expansion**: Added 40 more purple-focused palettes, five each in the 3-color through 10-color folders.
- **Blue Systems Expansion**: Added 20 curated blue-focused palettes across the 3-color through 10-color folders.
- **Green Systems Expansion**: Added 20 curated green-focused palettes across the 3-color through 10-color folders.
- **Red Systems Expansion**: Added 20 curated red-focused palettes across the 3-color through 10-color folders.
- **Orange Systems Expansion**: Added 20 curated orange-focused palettes across the 3-color through 10-color folders.
- **Yellow Systems Expansion**: Added 20 curated yellow-focused palettes across the 3-color through 10-color folders.
- **Pink Systems Expansion**: Added 20 curated pink-focused palettes across the 3-color through 10-color folders.
- **White Systems Expansion**: Added 20 curated white-focused palettes across the 3-color through 10-color folders.
- **Showcase Discovery Tools**: Added recently viewed palettes and modal "More Like This" recommendations.
- **Showcase Collections**: Added named localStorage collections with create, rename, delete, save, and drag-to-move flows.
- **Showcase PNG Export**: Added a Canvas API swatch sheet download from the modal.
- **Showcase Typography Sandbox**: Added a typography use case tab for headings, copy, links, quotes, badges, and inline code.
- **Black Systems Expansion**: Added 20 curated black-focused palettes across the 3-color through 10-color folders.
- **Showcase Sandbox Upgrade**: Refined the modal sandbox with a unified toolbar, palette role chips, contrast status, stronger active states, and improved preview framing.
- **Showcase Filter Bar Upgrade**: Simplified the primary facet row to All, Recent, Count, and Saved, and wired the search-bar color picker to sort palettes by color proximity.
- **Showcase Sort Control Upgrade**: Reworked the palette sort dropdown with a labeled icon control and wired name, recency, count, and closest-color sorting.
- **Showcase Header Upgrade**: Enhanced the sticky header with richer branding, live palette count, WCAG tooling badge, and a direct repository action.

### Changed
- **Palette Folder Hierarchy**: Moved `3 Color Palette` through `10 Color Palette` into `Palattes by # of Colors/` and added empty `11 Color Palette` through `35 Color Palette` folders for expansion.

## [2.0.0] - 2026-05-18

### Added
- **SCSS Maps**: Every palette now includes an SCSS Map (`$name-map`) for programmatic color iteration.
- **NPM Integration**: Added `package.json` for installation via GitHub URL.
- **Central Entry Point**: Added `_index.scss` at the root for easier project-wide imports.
- **Advanced Showcase**: Revamped gallery with search, semantic tagging, and live UI previews.
- **Copy Actions**: Click swatches to copy HEX; export buttons for Tailwind, CSS, and SCSS.
- **Toast Notifications**: Interactive feedback for copy actions in the showcase.

### Changed
- Major reorganization of repository files and folder structure for professional delivery.
- Updated all documentation to reflect v2.0.0 standards.

## [1.5.0] - 2026-05-18

### Added
- **Sci-Fi & Tech Palettes**: Cybernetic Steel, Nebula Void, Synthwave Horizon, Terminal Matrix.
- **Massive Expansion**: Over 40 new themed palettes including Arctic Night, Autumn Leaves, Blue Ridge, etc.

## [1.4.0] - 2026-05-18

### Changed
- Reorganized all palette files into subdirectories based on their color count (e.g., `3 Color Palette/`, `9 Color Palette/`).
- Updated documentation to reflect the new directory structure.

## [1.3.0] - 2026-05-18

### Added
- **Themed Collections**: Classic Vaporwave, Cyber Pastel, Dracula, Future Shock, Holo Noir, Midnight Cyberpunk, etc.
- **Natural Expansion**: Autumn Harvest, Enchanted Forest, Tropical Paradise, Urban Industrial.

## [1.2.0] - 2026-05-18

### Added
- **Arctic Expedition.scss**: Comprehensive 9-color icy palette.
- **Deep Forest.scss**: Lush 9-color forest green sequence.
- **Solar Flare.scss**: Vibrant 9-color sun-inspired palette.

## [1.1.0] - 2026-05-18

### Added
- **Desert Sands.scss**: Warm earth and sand tones.
- **Lavender Mist.scss**: Soft pastel shades.
- **Midnight Neon.scss**: Cyberpunk-inspired high-contrast neon.
- **Vintage Gold.scss**: Classic black, blue, and gold tones.

## [1.0.0] - 2026-05-18

### Added
- Initial release of the SCSS Color Palettes library.
- **Key Palettes**: Bold Berry, Fiery Red Sunset, Fresh Greens, Monochrome Magic, Ocean Blue Serenity, Soft Pink Delight.
- **Core Docs**: GEMINI.md, CONTRIBUTING.md, MAINTENANCE.md.
