# Repository Guidelines

## Project Structure & Module Organization

This repository is an SCSS color palette library with a static showcase. Palette source files live in folders named by palette size, such as `3 Color Palette/`, `5 Color Palette/`, and `10 Color Palette/`. The package entry point is `_index.scss`. The gallery lives in `showcase/` with `index.html`, `style.css`, `app.js`, and generated `palettes.json`. Docs live in `README.md`, `CONTRIBUTING.md`, `MAINTENANCE.md`, and `docs/`.

## Root File Sync Requirements

Whenever behavior, palette inventory, usage, or maintenance workflow changes, update the relevant root files in the same change. Check `_index.scss`, `README.md`, `CONTRIBUTING.md`, `MAINTENANCE.md`, `CHANGELOG.md`, `package.json`, and this `AGENTS.md` as applicable.

## Build, Test, and Development Commands

There are no npm scripts currently defined. Use these direct commands:

```bash
python build_index.py
```

Regenerates `showcase/palettes.json` from SCSS files. Run after adding, renaming, moving, or editing palette metadata. Requires Python plus `PyYAML`.

```bash
python -m http.server 8000
```

Serves the repo so you can open `http://localhost:8000/showcase/`.

```bash
npm install git+https://github.com/JaZeR-444/SCSS-Palatte-Library.git
```

Installs the package from GitHub for downstream testing.

## Coding Style & Naming Conventions

Palette filenames use Title Case with spaces, for example `Midnight Neon.scss`. CSS custom properties and SCSS variables use kebab-case, such as `--deep-sea-blue` and `$deep-sea-blue`. Keep files in the folder matching their color count. Preserve the section order in `CONTRIBUTING.md`: CSS HEX, CSS HSL, SCSS HEX, SCSS HSL, SCSS RGB, then SCSS Gradient.

## Testing Guidelines

No automated test suite is configured. Validate changes by running `python build_index.py`, then loading the showcase locally and checking search, previews, export snippets, and contrast results. For SCSS edits, confirm all expected color entries and standard gradient variables exist. New palette options are not complete until they appear in `showcase/palettes.json` and render in `showcase/`.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit style, such as `feat: ...` and `revert: ...`; keep using that pattern. Pull requests should include a summary, changed palette names or folders, validation steps, and screenshots or notes when the showcase UI changes.

## Agent-Specific Instructions

Do not hand-edit `showcase/palettes.json` unless explicitly requested; regenerate it with `build_index.py`. Keep unrelated generated or editor metadata untouched. When adding palettes, update source SCSS first, regenerate showcase data, verify the palette appears in `showcase/`, and update affected root files before finishing.
