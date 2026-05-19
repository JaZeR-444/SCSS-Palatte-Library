# Repository Guidelines

## Project Structure & Module Organization

This repository is an SCSS color palette library with a static showcase. Palette source files live in folders named by palette size, such as `3 Color Palette/`, `5 Color Palette/`, and `10 Color Palette/`. The package entry point is `_index.scss`, which aggregates library imports. The interactive gallery lives in `showcase/` with `index.html`, `style.css`, `app.js`, and generated `palettes.json`. Project docs and planning notes live in `README.md`, `CONTRIBUTING.md`, `MAINTENANCE.md`, and `docs/`.

## Build, Test, and Development Commands

There are no npm scripts currently defined. Use these direct commands:

```bash
python build_index.py
```

Regenerates `showcase/palettes.json` from the SCSS palette files. Requires Python plus `PyYAML`.

```bash
python -m http.server 8000
```

Serves the repository locally so you can open `http://localhost:8000/showcase/` and inspect the gallery.

```bash
npm install git+https://github.com/JaZeR-444/SCSS-Palatte-Library.git
```

Installs the package from GitHub for downstream usage testing.

## Coding Style & Naming Conventions

Palette filenames use Title Case with spaces, for example `Midnight Neon.scss`. CSS custom properties and SCSS variables use kebab-case, such as `--deep-sea-blue` and `$deep-sea-blue`. Keep palette files in the folder matching their color count. Preserve the section order documented in `CONTRIBUTING.md`: CSS HEX, CSS HSL, SCSS HEX, SCSS HSL, SCSS RGB, then SCSS Gradient. Use descriptive color names instead of numbered placeholders.

## Testing Guidelines

No automated test suite is configured. Validate changes by running `python build_index.py`, then loading the showcase locally and checking search, color previews, export snippets, and contrast results for the changed palettes. For SCSS edits, confirm each palette includes all expected color entries and the standard gradient variables.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit style, such as `feat: ...` and `revert: ...`; keep using that pattern when possible. Pull requests should include a short summary, changed palette names or folders, validation steps run, and screenshots or notes when the showcase UI changes. Link related issues or planning docs when applicable.

## Agent-Specific Instructions

Do not hand-edit `showcase/palettes.json` unless explicitly requested; regenerate it from source with `build_index.py`. Keep unrelated generated or editor metadata untouched. When adding palettes, update source SCSS first, then verify generated showcase data.
