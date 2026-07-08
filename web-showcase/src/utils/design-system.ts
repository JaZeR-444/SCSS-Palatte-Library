import {
  BrandInputs,
  BrandSystem,
  ColorMode,
  GeneratePalette,
} from "@/types/brand-system";
import {
  BrandKit,
  ColorTokens,
  DEFAULT_BORDER,
  DEFAULT_DENSITY,
  DEFAULT_RADIUS,
  DEFAULT_SHADOW,
  DEFAULT_SPACE,
  DEFAULT_TYPOGRAPHY,
  DesignSource,
  DesignSystem,
  DesignTokens,
  SavedDesignSystem,
} from "@/types/design-system";
import { ROLE_META } from "@/types/studio";
import { generateBrandSystem } from "@/utils/brand-system";

/* ------------------------------------------------------------------ *
 * Canonical color vocabulary                                         *
 *                                                                    *
 * The DesignSystem uses the Brand System role keys as its canonical  *
 * color tokens. The studio's ordered `--ui-color-N` roles map onto   *
 * that vocabulary through ROLE_TO_CANONICAL (index i → key), so the  *
 * two engines can round-trip through one object.                     *
 * ------------------------------------------------------------------ */

/**
 * ROLE_META index → canonical Brand System token key. Order is load-bearing:
 * it mirrors the ROLE_META array in `@/types/studio`. A couple of studio roles
 * (Text Strong, Secondary Hover, Accent Soft) have no exact Brand System
 * counterpart and fold onto their nearest canonical token.
 */
export const ROLE_TO_CANONICAL: string[] = [
  "bg-base", // 0  Bg Canvas
  "surface", // 1  Bg Surface
  "bg-elevated", // 2  Bg Elevated
  "overlay", // 3  Bg Overlay
  "border-subtle", // 4  Border Subtle
  "border-strong", // 5  Border Strong
  "text-muted", // 6  Text Muted
  "text-primary", // 7  Text Base
  "text-primary", // 8  Text Strong  (→ primary; no distinct token)
  "brand-primary", // 9  Primary
  "brand-primary-hover", // 10 Primary Hover
  "brand-secondary", // 11 Secondary
  "brand-secondary", // 12 Secondary Hover (→ secondary; no distinct token)
  "brand-accent", // 13 Accent
  "surface-hover", // 14 Accent Soft (→ tinted surface)
  "state-success", // 15 Success
  "state-warning", // 16 Warning
  "state-error", // 17 Danger
  "state-info", // 18 Info
  "link", // 19 Link
  "focus-ring", // 20 Focus Ring
];

const varName = (index0: number) => `--ui-color-${index0 + 1}`;

/* ------------------------------------------------------------------ *
 * Brand kit                                                          *
 * ------------------------------------------------------------------ */

/** Extract a persistent brand kit from a palette + brand inputs. */
export function brandKitFromInputs(
  palette: GeneratePalette,
  inputs: BrandInputs,
): BrandKit {
  return {
    palette: palette.colors.map((c) => c.hex.slice(0, 7)),
    personality: inputs.personality,
    tone: inputs.tone,
    industry: inputs.industry,
    audience: inputs.audience,
    voice: inputs.notes || undefined,
  };
}

/* ------------------------------------------------------------------ *
 * BrandSystem  →  DesignSystem                                       *
 * ------------------------------------------------------------------ */

function defaultTokensFrom(
  color: DesignTokens["color"],
  chart: string[],
): DesignTokens {
  return {
    color,
    chart,
    typography: { ...DEFAULT_TYPOGRAPHY },
    space: [...DEFAULT_SPACE],
    radius: { ...DEFAULT_RADIUS },
    shadow: [...DEFAULT_SHADOW],
    border: { ...DEFAULT_BORDER },
    density: DEFAULT_DENSITY,
  };
}

/**
 * Wrap an existing BrandSystem into the unified object. Color tokens come
 * straight from the generator (both themes + chart); non-color groups fall back
 * to sensible defaults until the user tunes them.
 */
export function designSystemFromBrandSystem(
  bs: BrandSystem,
  source?: DesignSource,
): DesignSystem {
  return {
    id: `${bs.paletteId}-${slug(bs.inputs.appName)}`,
    name: bs.inputs.appName,
    source: source ?? { kind: "palette", ref: bs.paletteId },
    brandKit: {
      palette: [],
      personality: bs.inputs.personality,
      tone: bs.inputs.tone,
      industry: bs.inputs.industry,
      audience: bs.inputs.audience,
      voice: bs.inputs.notes || undefined,
    },
    tokens: defaultTokensFrom(
      { light: bs.lightRoles, dark: bs.darkRoles },
      bs.chartSeries,
    ),
    mode: bs.mode,
  };
}

/**
 * Top-level entry point: derive a complete DesignSystem from a palette + brand
 * inputs. This is the unification seam — `generateBrandSystem` produces the
 * color layer; everything else is layered on with defaults.
 */
export function deriveDesignSystem(
  palette: GeneratePalette,
  inputs: BrandInputs,
  source?: DesignSource,
): DesignSystem {
  const bs = generateBrandSystem(palette, inputs);
  const ds = designSystemFromBrandSystem(bs, source);
  ds.brandKit.palette = palette.colors.map((c) => c.hex.slice(0, 7));
  return ds;
}

/* ------------------------------------------------------------------ *
 * Studio roleMapping  ↔  DesignSystem color tokens                   *
 * ------------------------------------------------------------------ */

/**
 * Convert the studio's ordered `--ui-color-N` mapping into canonical color
 * tokens. The studio is single-theme today, so the same set seeds both themes;
 * a caller that knows the resolved mode can pass it to place the set correctly.
 */
export function colorTokensFromRoleMapping(
  roleMapping: Record<string, string>,
): ColorTokens {
  const tokens: ColorTokens = {};
  ROLE_META.forEach((_, i) => {
    const hex = roleMapping[varName(i)];
    if (!hex) return;
    const key = ROLE_TO_CANONICAL[i];
    // First writer wins so genuine roles beat the "folded" duplicates
    // (e.g. Text Base sets text-primary before Text Strong reuses it).
    if (key && tokens[key] === undefined) tokens[key] = hex.slice(0, 7);
  });
  return tokens;
}

/**
 * Build a DesignSystem from a studio session (palette + edited roleMapping).
 * The studio edits a single theme, so the same color set seeds both light and
 * dark. Brand inputs are optional — pass them when available (e.g. handing off
 * to the Brand System), otherwise a minimal brand kit is derived from the
 * palette. Used to give the studio + Brand System one shared object.
 */
export function designSystemFromRoleMapping(
  palette: GeneratePalette,
  roleMapping: Record<string, string>,
  mode: ColorMode,
  opts?: { name?: string; inputs?: BrandInputs },
): DesignSystem {
  const color = colorTokensFromRoleMapping(roleMapping);
  const name = opts?.name ?? opts?.inputs?.appName ?? palette.name;
  const brandKit = opts?.inputs
    ? brandKitFromInputs(palette, opts.inputs)
    : {
        palette: palette.colors.map((c) => c.hex.slice(0, 7)),
        personality: [],
        tone: "",
      };
  return {
    id: `${palette.id}-${slug(name)}`,
    name,
    source: { kind: "palette", ref: palette.id },
    brandKit,
    tokens: defaultTokensFrom(
      { light: color, dark: color },
      palette.colors.map((c) => c.hex.slice(0, 7)),
    ),
    mode,
  };
}

/**
 * Reverse adapter: project a DesignSystem's color tokens back onto the studio's
 * ordered `--ui-color-N` mapping so the existing preview/role editor can render
 * from the unified object without a rewrite.
 */
export function roleMappingFromDesignSystem(
  ds: DesignSystem,
  mode: ColorMode = ds.mode,
): Record<string, string> {
  const color = mode === "dark" ? ds.tokens.color.dark : ds.tokens.color.light;
  const mapping: Record<string, string> = {};
  ROLE_META.forEach((_, i) => {
    const key = ROLE_TO_CANONICAL[i];
    const hex = key ? color[key] : undefined;
    if (hex) mapping[varName(i)] = hex;
  });
  return mapping;
}

/* ------------------------------------------------------------------ *
 * Persistence helpers                                                *
 * ------------------------------------------------------------------ */

/** Build a serializable SavedDesignSystem from a live system + brand inputs. */
export function toSavedDesignSystem(
  ds: DesignSystem,
  inputs: BrandInputs,
  opts?: {
    id?: string;
    name?: string;
    paletteId?: string;
    projectSlug?: string | null;
  },
): SavedDesignSystem {
  return {
    id: opts?.id ?? "",
    name: opts?.name ?? ds.name,
    paletteId: opts?.paletteId ?? ds.source?.ref,
    projectSlug: opts?.projectSlug ?? null,
    inputs,
    tokens: ds.tokens,
    presetId: ds.presetId,
    mode: ds.mode,
  };
}

/* ------------------------------------------------------------------ *
 * Utilities                                                          *
 * ------------------------------------------------------------------ */

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "app"
  );
}
