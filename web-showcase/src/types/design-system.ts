import { BrandInputs, ColorMode, SemanticRole } from "@/types/brand-system";

/* ------------------------------------------------------------------ *
 * DesignSystem — the single canonical object for the studio.         *
 *                                                                    *
 * Import, presets, canvas edits and every exporter are pure          *
 * functions over this shape. The color vocabulary is the Brand       *
 * System role set (the richer, production-oriented one); the studio's *
 * `--ui-color-N` roles adapt in and out of it (see utils/design-     *
 * system.ts). Non-color token groups (type/space/radius/shadow) are  *
 * new in Phase 1 and ship with sensible defaults today so the object *
 * is always complete.                                                *
 * ------------------------------------------------------------------ */

/** How this system was seeded. Drives the "extracted vs. derived" UI. */
export interface DesignSource {
  kind: "url" | "screenshot" | "palette" | "preset" | "blank";
  /** URL, palette id, preset id, or file name depending on `kind`. */
  ref?: string;
  /** ISO timestamp the seed was captured (stamped by the caller). */
  capturedAt?: string;
}

/** Persistent brand direction that biases generation + preset recommendations. */
export interface BrandKit {
  /** Seed palette (raw hex, 6-digit). */
  palette: string[];
  personality: string[];
  tone: string;
  industry?: string;
  audience?: string;
  iconStyle?: "line" | "solid" | "duotone";
  logoUrl?: string;
  /** Optional voice/tone notes. */
  voice?: string;
}

/** key -> hex map for one theme (Brand System role keys, e.g. "brand-primary"). */
export type ColorTokens = Record<string, string>;

/* ------------------------------------------------------------------ *
 * Composition — the in-project builder assigns individual palette      *
 * colors to brand-system roles. This is the editable source of truth   *
 * behind a "composed" DesignSystem; `tokens.color` is its projection.  *
 * ------------------------------------------------------------------ */

/** One role's resolved color plus optional provenance back to a palette swatch. */
export interface RoleAssignment {
  hex: string;
  /** Source project palette this color came from (advisory — never required). */
  paletteId?: string;
  /** Swatch name within that palette (advisory). */
  colorName?: string;
  /** true = auto-seeded and untouched; false/undefined = user-set. */
  seeded?: boolean;
}

/** roleKey -> assignment, for a single theme. */
export type ModeAssignments = Record<string, RoleAssignment>;

/** The full per-color composition for a project brand system. */
export interface BrandComposition {
  light: ModeAssignments;
  dark: ModeAssignments;
  /** chart-1..6 provenance (modeless); mirrors tokens.chart. */
  chart: RoleAssignment[];
}

export interface TypographyTokens {
  /** Primary UI/body typeface stack. */
  sans: string;
  /** Optional monospace stack for code/data. */
  mono?: string;
  /** Ascending font-size ramp in px (caption → display). */
  scale: number[];
  /** Available font weights. */
  weights: number[];
  /** Base body line-height (unitless). */
  lineHeight: number;
  /** Base letter-spacing in em (can be negative for tight display type). */
  tracking: number;
}

export interface RadiusTokens {
  sm: number;
  md: number;
  lg: number;
  /** Pill / circular. */
  full: number;
}

export interface BorderTokens {
  width: number;
  style: "solid" | "dashed" | "none";
}

export type Density = "compact" | "cozy" | "comfortable";

/** All non-identity token groups, mode-independent unless noted. */
export interface DesignTokens {
  /** Both generated themes so callers can toggle / export either. */
  color: { light: ColorTokens; dark: ColorTokens };
  /** Ordered categorical series for charts (mode-independent). */
  chart: string[];
  typography: TypographyTokens;
  /** Spacing ramp in px. */
  space: number[];
  radius: RadiusTokens;
  /** Elevation ramp — CSS box-shadow strings, low → high. */
  shadow: string[];
  border: BorderTokens;
  density: Density;
}

/** Component keys eligible for per-component overrides (Phase 4+). */
export type ComponentKey =
  "button" | "input" | "card" | "nav" | "table" | "badge" | "modal" | "chart";

/** A future per-component token override (radius/shadow/color nudges). */
export interface TokenOverride {
  radius?: number;
  shadow?: string;
  color?: Partial<ColorTokens>;
}

export interface DesignSystem {
  id: string;
  name: string;
  source?: DesignSource;
  brandKit: BrandKit;
  tokens: DesignTokens;
  /** Per-component overrides layered on top of tokens. Empty until Phase 4. */
  components?: Partial<Record<ComponentKey, TokenOverride>>;
  /** Which preset (if any) this system was last stamped from. */
  presetId?: string;
  /** Resolved default mode for previews/exports. */
  mode: ColorMode;
}

/**
 * A full-system preset (Phase 2). Applying it overwrites `tokens` (and
 * optionally biases the brand kit) while preserving identity + source.
 */
export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  /** Personality tags this preset expresses — feeds recommendations. */
  personality: string[];
  mode: ColorMode;
  /** Partial tokens merged over a generated base when applied. */
  tokens: Partial<DesignTokens>;
}

/* ------------------------------------------------------------------ *
 * Defaults — every DesignSystem is always complete.                  *
 * ------------------------------------------------------------------ */

export const DEFAULT_TYPOGRAPHY: TypographyTokens = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace',
  // ~1.25 modular scale from 12px.
  scale: [12, 14, 16, 18, 20, 24, 30, 36, 48, 60],
  weights: [400, 500, 600, 700, 800],
  lineHeight: 1.5,
  tracking: 0,
};

/** 4px-based spacing ramp. */
export const DEFAULT_SPACE: number[] = [2, 4, 8, 12, 16, 24, 32, 48, 64, 96];

export const DEFAULT_RADIUS: RadiusTokens = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
};

export const DEFAULT_SHADOW: string[] = [
  "0 1px 2px 0 rgb(15 23 42 / 0.05)",
  "0 4px 8px -2px rgb(15 23 42 / 0.10)",
  "0 12px 24px -6px rgb(15 23 42 / 0.14)",
  "0 24px 48px -12px rgb(15 23 42 / 0.20)",
];

export const DEFAULT_BORDER: BorderTokens = { width: 1, style: "solid" };

export const DEFAULT_DENSITY: Density = "cozy";

/* ------------------------------------------------------------------ *
 * Import — reverse-engineering an existing interface into a seed.     *
 * ------------------------------------------------------------------ */

/** What an import (URL or screenshot) extracts from an existing interface. */
export interface ImportResult {
  source: { kind: "url" | "screenshot"; ref: string };
  /** Frequency-ranked, deduped brand-ish colors (6-digit hex). */
  colors: string[];
  /** Primary font-family stack, if detected. */
  fontSans?: string;
  /** Representative corner radius in px, if detected. */
  radius?: number;
  /** Representative box-shadow value, if detected. */
  shadow?: string;
  /** Honest limitations / confidence notes to surface in the UI. */
  notes: string[];
}

/* ------------------------------------------------------------------ *
 * Persistence — a saved, reusable design system.                     *
 * ------------------------------------------------------------------ */

/**
 * A full design system persisted as a standalone, reusable artifact. Holds
 * everything needed to restore the Brand System modal for re-editing: the
 * source palette, the brand inputs (form), and the edited token system
 * (colors + type/space/radius/shadow + preset + inline overrides). May be
 * optionally associated with a project, but exists independently of one.
 */
export interface SavedDesignSystem {
  id: string;
  name: string;
  /** Source palette id (for regenerating the narrative/accessibility layer). */
  paletteId?: string;
  /** Optional project association; null/undefined = unassigned. */
  projectSlug?: string | null;
  /** Brand form inputs — repopulate the modal on load. */
  inputs: BrandInputs;
  /** The edited token system (color light/dark + non-color + overrides). */
  tokens: DesignTokens;
  /** Applied preset id, if any. */
  presetId?: string;
  mode: ColorMode;
  /** True when built by the in-project composer (per-color role assignment). */
  composed?: boolean;
  /** The editable per-color composition; present iff `composed`. */
  assignments?: BrandComposition;
  createdAt?: string;
  updatedAt?: string;
}

/** Re-exported for adapters that need the role list shape. */
export type { SemanticRole };
