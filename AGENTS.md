# Repository Guidelines

## Project Structure & Module Organization

This repository is an SCSS color palette library plus a deployed web app. Palette source files live under `Palattes by # of Colors/` in folders named by palette size, such as `3 Color Palette/`, `5 Color Palette/`, and `10 Color Palette/` (extended through `35 Color Palette/`). The package entry point is `_index.scss`. The **one active showcase is the deployed Next.js app in `web-showcase/`** (`app-pallates.vercel.app`), whose data is synced from the canonical `generated/` dataset via `sync_palettes.py`. The retired legacy static gallery is kept at `archive/showcase/`. Docs live in `README.md`, `CONTRIBUTING.md`, `MAINTENANCE.md`, and `docs/`.

## Root File Sync Requirements

Whenever behavior, palette inventory, usage, or maintenance workflow changes, update the relevant root files in the same change. Check `_index.scss`, `README.md`, `CONTRIBUTING.md`, `MAINTENANCE.md`, `CHANGELOG.md`, `package.json`, and this `AGENTS.md` as applicable.

## Build, Test, and Development Commands

There are no npm scripts currently defined. Use these direct commands:

```bash
python build_index.py
```

Regenerates `archive/showcase/palettes.json` and the root `palettes.db` from SCSS files. Run after adding, renaming, moving, or editing palette metadata. Requires Python plus `PyYAML`. To update the deployed app, add the palette to `generated/` and run `python sync_palettes.py`.

```bash
python -m http.server 8000
```

Serves the repo so you can open the archived static gallery at `http://localhost:8000/archive/showcase/`. (The primary app runs via `cd web-showcase && npm run dev`.)

```bash
npm install git+https://github.com/JaZeR-444/SCSS-Palatte-Library.git
```

Installs the package from GitHub for downstream testing.

## Coding Style & Naming Conventions

Palette filenames use Title Case with spaces, for example `Midnight Neon.scss`. CSS custom properties and SCSS variables use kebab-case, such as `--deep-sea-blue` and `$deep-sea-blue`. Keep files in the folder matching their color count. Preserve the section order in `CONTRIBUTING.md`: CSS HEX, CSS HSL, SCSS HEX, SCSS HSL, SCSS RGB, then SCSS Gradient.

## Testing Guidelines

No automated test suite is configured. Validate changes by running `python build_index.py`, then loading the archived gallery (or the `web-showcase/` app) locally and checking search, previews, export snippets, and contrast results. For SCSS edits, confirm all expected color entries and standard gradient variables exist. New palette options are not complete until they appear in `generated/` (and, if shipped in the library, the SCSS sources) and render in the app.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit style, such as `feat: ...` and `revert: ...`; keep using that pattern. Pull requests should include a summary, changed palette names or folders, validation steps, and screenshots or notes when the showcase UI changes.

## Agent-Specific Instructions

Do not hand-edit `archive/showcase/palettes.json` or `web-showcase/src/data/palettes.json` unless explicitly requested; regenerate the former with `build_index.py` and the latter with `sync_palettes.py` (source of truth: `generated/`). Keep unrelated generated or editor metadata untouched. When adding palettes, update source SCSS first, add the palette to `generated/`, run the sync, verify it appears in the `web-showcase/` app, and update affected root files before finishing.
