import type { Palette } from "@/types";
import type {
  BrandInputs,
  BrandSystem,
  ColorMode,
  SemanticRole,
} from "@/types/brand-system";
import type {
  BrandComposition,
  ColorTokens,
  DesignSystem,
  DesignTokens,
  ModeAssignments,
  RoleAssignment,
  SavedDesignSystem,
} from "@/types/design-system";
import {
  DEFAULT_BORDER,
  DEFAULT_DENSITY,
  DEFAULT_RADIUS,
  DEFAULT_SHADOW,
  DEFAULT_SPACE,
  DEFAULT_TYPOGRAPHY,
} from "@/types/design-system";
import { BRAND_ROLE_META } from "./brand-roles";
import {
  STATE_HUES,
  buildAccessibility,
  buildComponents,
  buildUsage,
  chartSeriesFromHexes,
  deriveMissingRoles,
} from "./brand-system";
import { getLuminanceValue, hexToHsl } from "./contrast-utils";

/* ------------------------------------------------------------------ *
 * The in-project composer: seed per-color role assignments from a     *
 * project's palettes (by swatchType), then project them into the      *
 * canonical DesignSystem + a render-ready BrandSystem.                *
 * ------------------------------------------------------------------ */

/** Strip an 8-digit (#rrggbbaa) hex down to #rrggbb for role tokens. */
function norm(hex: string): string {
  const h = hex.trim();
  return h.length > 7 && h.startsWith("#") ? h.slice(0, 7) : h;
}
function hueOf(hex: string): number {
  return hexToHsl(hex)[0];
}
function satOf(hex: string): number {
  return hexToHsl(hex)[1];
}
function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

interface Swatch {
  hex: string;
  name?: string;
  paletteId: string;
}

function collect(palettes: Palette[], swatchTypes: string[]): Swatch[] {
  const out: Swatch[] = [];
  for (const p of palettes) {
    if (!p.swatchType || !swatchTypes.includes(p.swatchType)) continue;
    for (const c of p.colors) {
      out.push({ hex: norm(c.hex), name: c.name, paletteId: p.id });
    }
  }
  return out;
}

function allSwatches(palettes: Palette[]): Swatch[] {
  return palettes.flatMap((p) =>
    p.colors.map((c) => ({ hex: norm(c.hex), name: c.name, paletteId: p.id })),
  );
}

const asn = (s?: Swatch | null): RoleAssignment | undefined =>
  s
    ? { hex: s.hex, paletteId: s.paletteId, colorName: s.name, seeded: true }
    : undefined;

const put = (m: ModeAssignments, key: string, a?: RoleAssignment) => {
  if (a) m[key] = a;
};

export interface SeedOpts {
  /** Reserved for future light/dark bias; both modes are always seeded. */
  interfaceStyle?: string;
}

/**
 * Auto-seed a composition from a project's palettes. Colors are bucketed by
 * `swatchType`: brand-scale → brand-*, surfaces → bg/surface/text (per mode),
 * component-states → state-* (nearest hue), data/gradients → chart-*. Anything
 * that can't be confidently mapped is left unassigned; `composeDesignSystem`
 * gap-fills the rest. Every seeded assignment records provenance + seeded:true.
 */
export function seedComposition(
  palettes: Palette[],
  _opts: SeedOpts = {},
): BrandComposition {
  const brandPool = collect(palettes, ["brand-scale"]);
  const surfacePool = collect(palettes, ["surfaces"]);
  const statePool = collect(palettes, ["component-states"]);
  const chartPool = collect(palettes, ["data", "gradients"]);
  const anyPool = allSwatches(palettes);

  // --- Brand identity (modeless) ---
  const brandSrc = brandPool.length ? brandPool : anyPool;
  const bySat = [...brandSrc].sort((a, b) => satOf(b.hex) - satOf(a.hex));
  const primary = bySat[0] ?? null;
  const secondary =
    (primary &&
      bySat.find((s) => hueDist(hueOf(s.hex), hueOf(primary.hex)) > 22)) ||
    bySat[1] ||
    primary;
  const accent =
    bySat.find((s) => s !== primary && s !== secondary && satOf(s.hex) >= 30) ||
    bySat[2] ||
    bySat[1] ||
    primary;

  // --- Chart series (modeless) ---
  const chartSrc = (chartPool.length ? chartPool : brandSrc).slice(0, 12);
  const chartHexes = chartSeriesFromHexes(
    chartSrc.map((s) => s.hex),
    6,
  );
  const chart: RoleAssignment[] = chartHexes.map((hex) => {
    const src = chartSrc.find((s) => s.hex.toLowerCase() === hex.toLowerCase());
    return {
      hex,
      paletteId: src?.paletteId,
      colorName: src?.name,
      seeded: true,
    };
  });

  // --- States (modeless): nearest hue among saturated swatches ---
  const stateSrc = statePool.length ? statePool : anyPool;
  const nearestState = (targetHue: number): Swatch | null => {
    let best: Swatch | null = null;
    let bd = Infinity;
    for (const s of stateSrc) {
      if (satOf(s.hex) < 22) continue;
      const d = hueDist(hueOf(s.hex), targetHue);
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    return best && bd <= 40 ? best : null;
  };

  const modeless: ModeAssignments = {};
  put(modeless, "brand-primary", asn(primary));
  put(modeless, "brand-secondary", asn(secondary));
  put(modeless, "brand-accent", asn(accent));
  put(modeless, "link", asn(accent));
  put(modeless, "state-success", asn(nearestState(STATE_HUES.success)));
  put(modeless, "state-warning", asn(nearestState(STATE_HUES.warning)));
  put(modeless, "state-error", asn(nearestState(STATE_HUES.error)));
  put(modeless, "state-info", asn(nearestState(STATE_HUES.info)));
  chart.forEach((c, i) => put(modeless, `chart-${i + 1}`, c));

  // --- Surfaces + text (per mode, by luminance) ---
  const surfSrc = (surfacePool.length ? surfacePool : anyPool).slice();
  const byLum = [...surfSrc].sort(
    (a, b) => getLuminanceValue(a.hex) - getLuminanceValue(b.hex),
  );
  const darkest = byLum[0] ?? null;
  const lightest = byLum[byLum.length - 1] ?? null;

  const buildMode = (mode: ColorMode): ModeAssignments => {
    const m: ModeAssignments = { ...modeless };
    if (mode === "light") {
      put(m, "bg-base", asn(lightest));
      put(m, "surface", asn(byLum[byLum.length - 2] ?? lightest));
      put(m, "text-primary", asn(darkest));
    } else {
      put(m, "bg-base", asn(darkest));
      put(m, "surface", asn(byLum[1] ?? darkest));
      put(m, "text-primary", asn(lightest));
    }
    return m;
  };

  return { light: buildMode("light"), dark: buildMode("dark"), chart };
}

/* ------------------------------------------------------------------ */

export interface ComposeOpts {
  id?: string;
  name: string;
  mode: ColorMode;
  presetId?: string;
  /** Flat hex list for BrandKit provenance. */
  brandPalette?: string[];
  /** Timestamp source for a fresh id (Date.now-safe caller). */
  now?: number;
}

/** Project one mode's assignments (+ chart) into a complete ColorTokens map. */
function toColorTokens(
  assign: ModeAssignments,
  chart: RoleAssignment[],
  mode: ColorMode,
): ColorTokens {
  const explicit: Record<string, string> = {};
  for (const [k, v] of Object.entries(assign)) {
    if (v?.hex) explicit[k] = v.hex;
  }
  chart.forEach((c, i) => {
    if (c?.hex) explicit[`chart-${i + 1}`] = c.hex;
  });
  // deriveMissingRoles honors anything already in `explicit` and fills the
  // rest of the 28 non-chart roles; then re-apply chart keys.
  const tokens: ColorTokens = { ...deriveMissingRoles(explicit, mode) };
  for (let i = 1; i <= 6; i++) {
    const k = `chart-${i}`;
    if (explicit[k]) tokens[k] = explicit[k];
  }
  return tokens;
}

/** Compose a full DesignSystem from a per-color composition. */
export function composeDesignSystem(
  comp: BrandComposition,
  opts: ComposeOpts,
): DesignSystem {
  const chartHexes = comp.chart.map((c) => c.hex).filter(Boolean);
  const light = toColorTokens(comp.light, comp.chart, "light");
  const dark = toColorTokens(comp.dark, comp.chart, "dark");

  const tokens: DesignTokens = {
    color: { light, dark },
    chart: chartHexes.length ? chartHexes : [light["chart-1"]].filter(Boolean),
    typography: { ...DEFAULT_TYPOGRAPHY },
    space: [...DEFAULT_SPACE],
    radius: { ...DEFAULT_RADIUS },
    shadow: [...DEFAULT_SHADOW],
    border: { ...DEFAULT_BORDER },
    density: DEFAULT_DENSITY,
  };

  return {
    id: opts.id || `composed-${(opts.now ?? Date.now()).toString(36)}`,
    name: opts.name,
    source: { kind: "palette" },
    brandKit: {
      palette: opts.brandPalette ?? [],
      personality: [],
      tone: "",
    },
    tokens,
    presetId: opts.presetId,
    mode: opts.mode,
  };
}

/**
 * Synthesize a render-ready BrandSystem from a composition + its DesignSystem,
 * so the existing SemanticRoles / AccessibilityReview / TokenOutput components
 * work unchanged. There is no single-palette narrative, so `foundation` is a
 * short composed-specific blurb rather than the generated prose.
 */
export function composeBrandSystem(
  comp: BrandComposition,
  ds: DesignSystem,
  inputs: BrandInputs,
): BrandSystem {
  const light = ds.tokens.color.light;
  const dark = ds.tokens.color.dark;
  const active = ds.mode === "dark" ? dark : light;

  const listFrom = (
    tokens: ColorTokens,
    assign: ModeAssignments,
  ): SemanticRole[] =>
    BRAND_ROLE_META.map((m) => {
      const a = assign[m.key];
      return {
        key: m.key,
        label: m.label,
        group: m.group,
        hex: tokens[m.key] ?? "",
        description: m.description,
        // "derived" (amber badge) unless the user explicitly assigned it.
        derived: !a || a.seeded !== false,
      };
    });

  return {
    paletteId: ds.id,
    paletteName: ds.name,
    category: "Composed",
    inputs,
    mode: ds.mode,
    roles: active,
    rolesList: listFrom(active, ds.mode === "dark" ? comp.dark : comp.light),
    lightRoles: light,
    darkRoles: dark,
    lightRolesList: listFrom(light, comp.light),
    darkRolesList: listFrom(dark, comp.dark),
    chartSeries: ds.tokens.chart,
    foundation: {
      positioning: `${inputs.appName || ds.name} — a brand system composed from role-assigned project palettes.`,
      direction:
        "Assembled in-project: each role draws from a chosen palette swatch.",
      personality: (inputs.personality || []).join(", "),
      language: "",
      strategy:
        "Assignable roles come from picked swatches; derived roles (borders, hovers, on-colors, state text) are computed for contrast.",
      communicates: "",
    },
    components: buildComponents(),
    usage: buildUsage(inputs, ds.mode),
    accessibility: buildAccessibility(active),
    limitations: [],
  };
}

/**
 * Rehydrate a composition from a saved system. Composed systems carry
 * `assignments`; older single-palette systems fall back to their tokens
 * (no provenance, treated as user-set so nothing shows as "auto").
 */
export function compositionFromSaved(
  saved: SavedDesignSystem,
): BrandComposition {
  if (saved.assignments) return saved.assignments;
  const fromTokens = (t: ColorTokens | undefined): ModeAssignments => {
    const m: ModeAssignments = {};
    for (const [k, v] of Object.entries(t ?? {})) {
      if (v) m[k] = { hex: v, seeded: false };
    }
    return m;
  };
  const chart = (saved.tokens?.chart ?? []).map((hex) => ({
    hex,
    seeded: false,
  }));
  return {
    light: fromTokens(saved.tokens?.color?.light),
    dark: fromTokens(saved.tokens?.color?.dark),
    chart,
  };
}
