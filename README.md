# Palattes

This repository contains the SCSS palette library plus a **Next.js App Router showcase workspace** at `web-showcase/`.

## Current state of the Next.js application (`web-showcase/`)

The directory currently contains:

- `.next/` (compiled Next.js output)
- `node_modules/`
- `public/` (present, currently empty)
- `src/app/favicon.ico`
- `next-env.d.ts`
- `tsconfig.tsbuildinfo`

There is **no checked-in `web-showcase/package.json` or app source tree** in this snapshot, so the app is represented mainly by compiled output in `.next/`.

## What the compiled app currently includes

From the manifests/chunks in `web-showcase/.next/`:

1. **Routing**
   - App Router with a single public page: `/`
   - Built-in `_not-found`, `_global-error`, and `/favicon.ico` routes

2. **Main page composition**
   - `Header`
   - Hero section (`SCSS Color Systems. Built for precision.`)
   - `LavaLamp` and `PaletteWall` visuals
   - `PaletteGrid`
   - `StudioModal`
   - `PaletteCreator`

3. **Server actions in `src/app/actions.ts`**
   - `fetchPalettes`
   - `getFavoritesAction`, `toggleFavoriteAction`
   - `getRoleMappingAction`, `saveRoleMappingAction`
   - `savePaletteAction`
   - `getCollectionsAction`, `createCollectionAction`, `deleteCollectionAction`
   - `addPaletteToCollectionAction`, `removePaletteFromCollectionAction`
   - `getCollectionPalettesAction`
   - `getPaletteHistoryAction`
   - `searchPalettesAction`, `searchPalettesByColorAction`

4. **Referenced app modules**
   - `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/actions.ts`
   - `src/components/*` including studio/scenario UI modules
   - `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `src/components/ui/toaster.tsx`
   - `src/data/palettes.json`
   - `src/utils/audio.ts`, `src/utils/contrast-utils.ts`, `src/utils/db.ts`, `src/utils/toast.ts`
   - `src/types/studio.ts`

5. **Data/storage**
   - Build traces reference SQLite usage via `better-sqlite3`
   - Tracing config expects `src/data/palettes.db`

## Palette library (root)

The SCSS palette library remains in the root palette folders (`3 Color Palette` through `10 Color Palette`) with `_index.scss` as the package entry point.

`package.json` at the repository root still publishes the SCSS library (`main: "_index.scss"`).

## License

MIT
