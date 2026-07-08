import {
  getContrastRatio,
  getLuminanceValue,
  hexToHsl,
  hexToRgb,
  wcagGrade,
} from "@/utils/contrast-utils";
import {
  BrandInputs,
  BrandSystem,
  ColorMode,
  ComponentGuide,
  ContrastPair,
  GeneratePalette,
  RoleGroup,
  SemanticRole,
  SurfaceKind,
  UsageGuide,
} from "@/types/brand-system";

/* ------------------------------------------------------------------ *
 * Color helpers (kept local; contrast-utils covers ratios/hsl/rgb).  *
 * ------------------------------------------------------------------ */

/** Strip alpha + shorthand, return a clean 6-digit #rrggbb (uppercase). */
export function normalizeHex(hex: string): string {
  let c = hex.replace(/^#/, "");
  if (c.length === 3 || c.length === 4) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  }
  return "#" + c.slice(0, 6).toUpperCase();
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const color =
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/** Linearly mix two hex colors. t=0 → a, t=1 → b. */
export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return (
    "#" +
    [r, g, bl]
      .map((v) => clamp(v, 0, 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, l + amount);
}

export function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, l - amount);
}

/** Shift a color's HSL saturation by `delta` points, keeping hue + lightness. */
export function adjustSat(hex: string, delta: number): string {
  const [h, s, l] = hexToHsl(normalizeHex(hex));
  return hslToHex(h, clamp(s + delta, 0, 100), l);
}

/** Append alpha to a hex color as an 8-digit value. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(clamp(alpha, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return normalizeHex(hex) + a.toUpperCase();
}

/** Pick readable foreground (near-white or near-ink) for a background. */
export function readableOn(bg: string): string {
  const onLight = getContrastRatio(bg, "#0F172A");
  const onDark = getContrastRatio(bg, "#F8FAFC");
  return onLight >= onDark ? "#0F172A" : "#F8FAFC";
}

/**
 * Nudge a foreground's lightness (keeping hue + saturation) until it clears a
 * target contrast ratio against a background, or we run out of headroom.
 */
export function ensureContrast(
  fg: string,
  bg: string,
  mode: ColorMode,
  target: number,
): string {
  let out = fg;
  const [h, s] = hexToHsl(fg);
  let [, , l] = hexToHsl(fg);
  const step = mode === "dark" ? 4 : -4; // lighten on dark bg, darken on light bg
  for (let i = 0; i < 22; i++) {
    if (getContrastRatio(out, bg) >= target) return out;
    l = clamp(l + step, 0, 100);
    out = hslToHex(h, s, l);
  }
  return out;
}

interface ColorMeta {
  hex: string;
  h: number;
  s: number;
  l: number;
  lum: number;
}

function meta(hex: string): ColorMeta {
  const clean = normalizeHex(hex);
  const [h, s, l] = hexToHsl(clean);
  return { hex: clean, h, s, l, lum: getLuminanceValue(clean) };
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/* ------------------------------------------------------------------ *
 * Style profile — let brand personality actually shape the tokens.   *
 * ------------------------------------------------------------------ */

interface StyleProfile {
  /** Saturation bias applied to brand + state colors (points, -20..20). */
  sat: number;
  /** >0 → push for deeper text/border contrast. */
  contrast: number;
}

function styleProfile(personality: string[]): StyleProfile {
  const has = (p: string) => personality.includes(p);
  let sat = 0;
  let contrast = 0;
  if (has("Bold")) sat += 12;
  if (has("Playful")) sat += 10;
  if (has("Creative")) sat += 8;
  if (has("Conversion-focused")) sat += 4;
  if (has("Minimal")) sat -= 12;
  if (has("Enterprise")) sat -= 8;
  if (has("Premium")) {
    sat -= 6;
    contrast += 1;
  }
  if (has("Luxury")) {
    sat -= 8;
    contrast += 1;
  }
  if (has("Technical")) contrast += 1;
  return { sat: clamp(sat, -20, 20), contrast };
}

/* ------------------------------------------------------------------ *
 * Brand identity (mode-independent primary / secondary / accent).    *
 * ------------------------------------------------------------------ */

interface BrandIdentity {
  primary: string;
  secondary: string;
  accent: string;
  onBrand: string;
  onAccent: string;
  primaryDerived: boolean;
  secondaryDerived: boolean;
  accentDerived: boolean;
  primaryMeta: ColorMeta;
}

function deriveBrandColors(cols: ColorMeta[], sp: StyleProfile): BrandIdentity {
  const byLum = [...cols].sort((a, b) => a.lum - b.lum);
  const darkest = byLum[0];
  const lightest = byLum[byLum.length - 1];

  // Brand primary: most saturated + closest to a mid "vivid" lightness.
  const score = (c: ColorMeta) => (c.s / 100) * (1 - Math.abs(c.l - 55) / 100);
  const vivid = [...cols].sort((a, b) => score(b) - score(a));
  const primaryBase = vivid[0] ?? darkest;

  // Secondary: prefer a hue-distinct vivid color, then any other color.
  let secondaryBase =
    vivid.find(
      (c) => c.hex !== primaryBase.hex && hueDistance(c.h, primaryBase.h) > 22,
    ) ?? vivid.find((c) => c.hex !== primaryBase.hex);
  let secondaryDerived = false;
  if (!secondaryBase) {
    secondaryBase = meta(lighten(primaryBase.hex, 12));
    secondaryDerived = true;
  }
  // Guard: a near-white / near-black / near-clone secondary isn't usable as a
  // brand color, so synthesize a distinct one by rotating off the primary hue.
  if (
    secondaryBase.l >= 86 ||
    secondaryBase.l <= 14 ||
    (hueDistance(secondaryBase.h, primaryBase.h) < 10 &&
      Math.abs(secondaryBase.l - primaryBase.l) < 10)
  ) {
    secondaryBase = meta(
      hslToHex(
        (primaryBase.h + 32) % 360,
        clamp(primaryBase.s, 40, 85),
        clamp(primaryBase.l, 42, 60),
      ),
    );
    secondaryDerived = true;
  }

  // Accent: the most saturated remaining color.
  const bySat = [...cols].sort((a, b) => b.s - a.s);
  let accentBase =
    bySat.find(
      (c) =>
        c.hex !== primaryBase.hex && c.hex !== secondaryBase!.hex && c.s >= 30,
    ) ??
    bySat.find(
      (c) => c.hex !== primaryBase.hex && c.hex !== secondaryBase!.hex,
    );
  let accentDerived = false;
  if (!accentBase) {
    accentBase = meta(darken(primaryBase.hex, 18));
    accentDerived = true;
  }
  // Guard against an accent that collapses into a background tone.
  if (accentBase.l >= 90 || accentBase.l <= 8) {
    accentBase = meta(
      hslToHex(
        (primaryBase.h + 332) % 360,
        clamp(primaryBase.s, 45, 90),
        clamp(
          primaryBase.l < 50 ? primaryBase.l + 18 : primaryBase.l - 18,
          20,
          72,
        ),
      ),
    );
    accentDerived = true;
  }

  const primary = adjustSat(primaryBase.hex, sp.sat);
  const secondary = adjustSat(secondaryBase.hex, sp.sat);
  const accent = adjustSat(accentBase.hex, sp.sat);

  return {
    primary,
    secondary,
    accent,
    onBrand: readableOn(primary),
    onAccent: readableOn(accent),
    primaryDerived: false,
    secondaryDerived,
    accentDerived,
    primaryMeta: meta(primary),
  };
}

/* ------------------------------------------------------------------ *
 * State colors                                                       *
 * ------------------------------------------------------------------ */

const STATE_HUES: Record<string, number> = {
  success: 145,
  warning: 40,
  error: 4,
  info: 210,
};

function deriveState(
  cols: ColorMeta[],
  name: keyof typeof STATE_HUES,
  mode: ColorMode,
  sp: StyleProfile,
  avgSat: number,
  primaryMeta: ColorMeta,
): { hex: string; derived: boolean } {
  const targetHue = STATE_HUES[name];
  let best: ColorMeta | null = null;
  let bestDist = Infinity;
  for (const c of cols) {
    if (c.s < 22) continue; // too grey to signal a state
    const d = hueDistance(c.h, targetHue);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }

  let hex: string;
  let derived: boolean;
  if (best && bestDist <= 26) {
    const targetL =
      mode === "dark" ? clamp(best.l, 55, 72) : clamp(best.l, 40, 55);
    hex = hslToHex(
      best.h,
      clamp(Math.max(best.s, 45) + sp.sat * 0.5, 30, 100),
      targetL,
    );
    derived = false;
  } else {
    const sat = clamp(avgSat + sp.sat * 0.5, 55, 82);
    const light = mode === "dark" ? 62 : 47;
    hex = hslToHex(targetHue, sat, light);
    derived = true;
  }

  // Keep the state visually distinct from the brand primary so a "success"
  // toast can't be mistaken for brand chrome.
  const m = meta(hex);
  if (
    hueDistance(m.h, primaryMeta.h) < 18 &&
    Math.abs(m.l - primaryMeta.l) < 14
  ) {
    const away =
      m.l >= primaryMeta.l ? clamp(m.l + 16, 0, 92) : clamp(m.l - 16, 8, 100);
    hex = hslToHex(m.h, m.s, away);
    derived = true;
  }

  return { hex, derived };
}

/* ------------------------------------------------------------------ *
 * Chart / data-viz series                                            *
 * ------------------------------------------------------------------ */

function deriveChartSeries(cols: ColorMeta[], count: number): string[] {
  // Start from the palette's own colors (deduped), then synthesize more by
  // rotating hue off the most saturated seed until we hit `count`.
  const seen = new Set<string>();
  const base: string[] = [];
  for (const c of cols) {
    if (!seen.has(c.hex)) {
      seen.add(c.hex);
      base.push(c.hex);
    }
  }
  const seed = [...cols].sort((a, b) => b.s - a.s)[0] ?? meta("#6366F1");
  let i = 1;
  while (base.length < count) {
    const hex = hslToHex(
      (seed.h + i * 47) % 360,
      clamp(seed.s, 45, 82),
      clamp(50 + (i % 2 ? 12 : -12), 25, 72),
    );
    if (!seen.has(hex)) {
      seen.add(hex);
      base.push(hex);
    }
    i++;
    if (i > count * 4) break; // safety
  }

  // Greedy re-order so adjacent series contrast as much as possible.
  const ordered = [base[0]];
  const rest = base.slice(1);
  while (rest.length) {
    const last = ordered[ordered.length - 1];
    let bi = 0;
    let bd = -1;
    rest.forEach((c, idx) => {
      const dd = getContrastRatio(c, last);
      if (dd > bd) {
        bd = dd;
        bi = idx;
      }
    });
    ordered.push(rest.splice(bi, 1)[0]);
  }
  return ordered.slice(0, count);
}

/* ------------------------------------------------------------------ *
 * Role derivation                                                    *
 * ------------------------------------------------------------------ */

interface RoleSpec {
  key: string;
  label: string;
  group: RoleGroup;
  hex: string;
  description: string;
  derived: boolean;
}

/** Build a complete, standalone role set for one mode. */
function buildRoleSet(
  cols: ColorMeta[],
  brand: BrandIdentity,
  mode: ColorMode,
  sp: StyleProfile,
): RoleSpec[] {
  const byLum = [...cols].sort((a, b) => a.lum - b.lum);
  const darkest = byLum[0];
  const lightest = byLum[byLum.length - 1];
  const avgSat = cols.reduce((s, c) => s + c.s, 0) / cols.length;

  let bgBase: string;
  let bgElevated: string;
  let surface: string;
  let surfaceHover: string;
  let textPrimary: string;

  if (mode === "dark") {
    bgBase =
      darkest.l > 16
        ? hslToHex(darkest.h, Math.min(darkest.s, 40), 9)
        : darkest.hex;
    bgElevated = lighten(bgBase, 5);
    surface = lighten(bgBase, 8);
    surfaceHover = lighten(bgBase, 12);
    textPrimary =
      getContrastRatio(lightest.hex, bgBase) >= 7 ? lightest.hex : "#F8FAFC";
  } else {
    bgBase =
      lightest.l < 92
        ? hslToHex(lightest.h, Math.min(lightest.s, 30), 97)
        : lightest.hex;
    bgElevated = "#FFFFFF";
    surface = "#FFFFFF";
    surfaceHover = darken(bgBase, 3);
    textPrimary =
      getContrastRatio(darkest.hex, bgBase) >= 7 ? darkest.hex : "#0F172A";
  }

  // Higher-contrast personalities keep text closer to the ink.
  const secMix = sp.contrast > 0 ? 0.24 : 0.28;
  const mutedMix = sp.contrast > 0 ? 0.44 : 0.48;
  const textSecondary = mixHex(textPrimary, bgBase, secMix);
  const textMuted = mixHex(textPrimary, bgBase, mutedMix);
  const borderSubtle = mixHex(surface, textPrimary, 0.1);
  const borderStrong = mixHex(
    surface,
    textPrimary,
    mode === "dark" ? 0.28 : 0.24,
  );
  const disabled = mixHex(textMuted, bgBase, 0.5);
  const overlay = withAlpha(mode === "dark" ? "#020617" : "#0F172A", 0.6);

  const primaryHover =
    mode === "dark" ? lighten(brand.primary, 10) : darken(brand.primary, 8);

  // Link: prefer a brand color that reads on the base, then guarantee AA.
  const linkCandidates = [brand.accent, brand.primary, brand.secondary];
  const link = ensureContrast(
    linkCandidates.find((c) => getContrastRatio(c, bgBase) >= 4.5) ??
      brand.accent,
    bgBase,
    mode,
    4.5,
  );
  // Focus ring must clear the 3:1 UI-component threshold to be visible.
  const focusRing = ensureContrast(brand.accent, bgBase, mode, 3);

  const success = deriveState(
    cols,
    "success",
    mode,
    sp,
    avgSat,
    brand.primaryMeta,
  );
  const warning = deriveState(
    cols,
    "warning",
    mode,
    sp,
    avgSat,
    brand.primaryMeta,
  );
  const error = deriveState(cols, "error", mode, sp, avgSat, brand.primaryMeta);
  const info = deriveState(cols, "info", mode, sp, avgSat, brand.primaryMeta);

  // Text-legible variants of each state for use on surfaces (not as fills).
  const stateText = (hex: string) => ensureContrast(hex, surface, mode, 4.5);

  return [
    // Brand
    d(
      "brand-primary",
      "Brand Primary",
      "Brand",
      brand.primary,
      "Main brand color for primary actions, active nav and emphasis.",
      brand.primaryDerived,
    ),
    d(
      "brand-primary-hover",
      "Brand Primary Hover",
      "Brand",
      primaryHover,
      "Hover / pressed state for the brand primary.",
      true,
    ),
    d(
      "brand-secondary",
      "Brand Secondary",
      "Brand",
      brand.secondary,
      "Supporting brand color for secondary accents.",
      brand.secondaryDerived,
    ),
    d(
      "brand-accent",
      "Brand Accent",
      "Brand",
      brand.accent,
      "High-energy accent for highlights, badges and focus.",
      brand.accentDerived,
    ),
    d(
      "on-brand",
      "On Brand",
      "Brand",
      brand.onBrand,
      "Text/icon color that sits legibly on the brand primary.",
      true,
    ),
    d(
      "on-accent",
      "On Accent",
      "Brand",
      brand.onAccent,
      "Text/icon color that sits legibly on the brand accent.",
      true,
    ),
    // Surfaces
    d(
      "bg-base",
      "Background Base",
      "Surface",
      bgBase,
      "App canvas / deepest background layer.",
      true,
    ),
    d(
      "bg-elevated",
      "Background Elevated",
      "Surface",
      bgElevated,
      "Raised background for panels and app shell.",
      true,
    ),
    d(
      "surface",
      "Surface",
      "Surface",
      surface,
      "Cards, sheets and menu surfaces.",
      true,
    ),
    d(
      "surface-hover",
      "Surface Hover",
      "Surface",
      surfaceHover,
      "Hover / pressed state for interactive surfaces.",
      true,
    ),
    // Text
    d(
      "text-primary",
      "Text Primary",
      "Text",
      textPrimary,
      "Headings and primary body copy.",
      true,
    ),
    d(
      "text-secondary",
      "Text Secondary",
      "Text",
      textSecondary,
      "Secondary copy, labels and captions.",
      true,
    ),
    d(
      "text-muted",
      "Text Muted",
      "Text",
      textMuted,
      "Placeholder, metadata and de-emphasized text.",
      true,
    ),
    d(
      "link",
      "Link",
      "Text",
      link,
      "Inline links and navigational text.",
      true,
    ),
    // Lines
    d(
      "border-subtle",
      "Border Subtle",
      "Line",
      borderSubtle,
      "Hairline dividers and default input borders.",
      true,
    ),
    d(
      "border-strong",
      "Border Strong",
      "Line",
      borderStrong,
      "Emphasized borders and focused field outlines.",
      true,
    ),
    d(
      "focus-ring",
      "Focus Ring",
      "Line",
      focusRing,
      "Keyboard focus outline for accessibility.",
      true,
    ),
    // States
    d(
      "state-success",
      "Success",
      "State",
      success.hex,
      "Positive confirmations and healthy status (fills, icons).",
      success.derived,
    ),
    d(
      "state-warning",
      "Warning",
      "State",
      warning.hex,
      "Cautions and pending states (fills, icons).",
      warning.derived,
    ),
    d(
      "state-error",
      "Error",
      "State",
      error.hex,
      "Destructive actions and error messaging (fills, icons).",
      error.derived,
    ),
    d(
      "state-info",
      "Info",
      "State",
      info.hex,
      "Neutral informational messaging (fills, icons).",
      info.derived,
    ),
    d(
      "state-success-text",
      "Success Text",
      "State",
      stateText(success.hex),
      "AA-legible success text/icon on surfaces.",
      true,
    ),
    d(
      "state-warning-text",
      "Warning Text",
      "State",
      stateText(warning.hex),
      "AA-legible warning text/icon on surfaces.",
      true,
    ),
    d(
      "state-error-text",
      "Error Text",
      "State",
      stateText(error.hex),
      "AA-legible error text/icon on surfaces.",
      true,
    ),
    d(
      "state-info-text",
      "Info Text",
      "State",
      stateText(info.hex),
      "AA-legible info text/icon on surfaces.",
      true,
    ),
    d(
      "on-error",
      "On Error",
      "State",
      readableOn(error.hex),
      "Label color for solid destructive buttons.",
      true,
    ),
    // Utility
    d(
      "disabled",
      "Disabled",
      "Utility",
      disabled,
      "Disabled controls and inert elements.",
      true,
    ),
    d(
      "overlay",
      "Overlay",
      "Utility",
      overlay,
      "Scrims behind modals and drawers.",
      true,
    ),
  ];
}

/**
 * Deterministically map a palette (of any size) onto full light + dark systems.
 */
export function deriveRoles(
  palette: GeneratePalette,
  inputs: BrandInputs,
): {
  light: RoleSpec[];
  dark: RoleSpec[];
  mode: ColorMode;
  chartSeries: string[];
  limitations: string[];
} {
  const cols = palette.colors.map((c) => meta(c.hex));
  const sp = styleProfile(inputs.personality);
  const brand = deriveBrandColors(cols, sp);
  const limitations: string[] = [];

  const avgLum = cols.reduce((s, c) => s + c.lum, 0) / cols.length;
  let mode: ColorMode;
  if (inputs.interfaceStyle === "Light") mode = "light";
  else if (inputs.interfaceStyle === "Dark") mode = "dark";
  else mode = avgLum < 0.38 ? "dark" : "light";
  if (
    inputs.interfaceStyle === "Auto" &&
    inputs.personality.includes("Dark-mode first")
  )
    mode = "dark";

  const light = buildRoleSet(cols, brand, "light", sp);
  const dark = buildRoleSet(cols, brand, "dark", sp);

  const chartSeries = deriveChartSeries(cols, 6);
  chartSeries.forEach((hex, i) => {
    const role = (list: RoleSpec[]) =>
      list.push(
        d(
          `chart-${i + 1}`,
          `Chart ${i + 1}`,
          "Data-viz",
          hex,
          `Categorical data series ${i + 1}.`,
          i >= cols.length,
        ),
      );
    role(light);
    role(dark);
  });

  if (palette.colors.length < 4) {
    limitations.push(
      `This palette only has ${palette.colors.length} colors, so surfaces, borders, states and extra chart series were derived by generating tints, shades and hue-matched signals from the base colors.`,
    );
  }

  return { light, dark, mode, chartSeries, limitations };
}

function d(
  key: string,
  label: string,
  group: RoleGroup,
  hex: string,
  description: string,
  derived: boolean,
): RoleSpec {
  return {
    key,
    label,
    group,
    hex: normalizeHexKeepAlpha(hex),
    description,
    derived,
  };
}

function normalizeHexKeepAlpha(hex: string): string {
  const c = hex.replace(/^#/, "");
  if (c.length === 8) return "#" + c.toUpperCase();
  return normalizeHex(hex);
}

/* ------------------------------------------------------------------ *
 * Narrative + guidance (deterministic templates)                     *
 * ------------------------------------------------------------------ */

function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function temperature(palette: GeneratePalette): "warm" | "cool" | "balanced" {
  let warm = 0;
  let cool = 0;
  for (const c of palette.colors) {
    const [h, s] = hexToHsl(normalizeHex(c.hex));
    if (s < 12) continue;
    if ((h >= 0 && h <= 55) || h >= 330) warm++;
    else if (h >= 160 && h <= 280) cool++;
  }
  if (warm > cool * 1.4) return "warm";
  if (cool > warm * 1.4) return "cool";
  return "balanced";
}

/** Widest hue gap among the palette's saturated colors. */
function hueSpread(palette: GeneratePalette): number {
  const hs: number[] = [];
  for (const c of palette.colors) {
    const [h, s] = hexToHsl(normalizeHex(c.hex));
    if (s >= 15) hs.push(h);
  }
  if (hs.length < 2) return 0;
  let max = 0;
  for (let i = 0; i < hs.length; i++) {
    for (let j = i + 1; j < hs.length; j++) {
      max = Math.max(max, hueDistance(hs[i], hs[j]));
    }
  }
  return max;
}

function buildFoundation(
  palette: GeneratePalette,
  inputs: BrandInputs,
  mode: ColorMode,
): BrandSystem["foundation"] {
  const temp = temperature(palette);
  const monochromatic = hueSpread(palette) < 30;
  const personality =
    inputs.personality.length > 0 ? inputs.personality : ["Modern"];
  const persText = listJoin(personality.slice(0, 3)).toLowerCase();
  const [firstP] = personality;

  const tempLanguage = {
    warm: "warm, approachable and energetic",
    cool: "calm, precise and trustworthy",
    balanced: "balanced and versatile",
  }[temp];

  const modeText =
    mode === "dark"
      ? "a dark-mode-first surface strategy that lets the brand colors glow against deep backgrounds"
      : "a light, airy surface strategy with generous whitespace and crisp contrast";

  return {
    positioning: `${inputs.appName} is a ${inputs.productType.toLowerCase()} for ${inputs.industry.toLowerCase()}, built for ${inputs.audience.toLowerCase()}. The visual identity should feel ${persText} while supporting the core use case: ${inputs.useCase.toLowerCase()}.`,
    direction: `Lead with the brand primary drawn from “${palette.name}”, reserve the accent for moments that deserve attention, and let neutral surfaces carry the majority of the interface. The result reads as ${firstP?.toLowerCase() ?? "modern"} without overwhelming the content.`,
    personality: `The palette skews ${tempLanguage}. Paired with a ${inputs.tone.toLowerCase()} tone, ${inputs.appName} should express ${persText} through restrained color, confident type and intentional spacing.`,
    language: `Design language: ${modeText}. Use rounded, tactile surfaces, a clear elevation system (base → elevated → surface), and color strictly as a signal — brand for identity, accent for emphasis, states for feedback.`,
    strategy: monochromatic
      ? `Color strategy: a single brand hue expressed as tints and shades, with one restrained accent for emphasis, layered over a neutral surface ramp. Roughly 60% neutral surfaces, 30% brand and 10% accent keeps ${inputs.platform.toLowerCase()} interfaces legible and on-brand.`
      : `Color strategy: one dominant brand hue, one supporting hue and a single accent, layered over a neutral surface ramp. Roughly 60% neutral surfaces, 30% brand and 10% accent keeps ${inputs.platform.toLowerCase()} interfaces legible and on-brand.`,
    communicates: `For a ${inputs.productType.toLowerCase()}, this palette communicates ${
      temp === "cool"
        ? "reliability, focus and technical credibility"
        : temp === "warm"
          ? "optimism, creativity and human warmth"
          : "versatility, clarity and modern polish"
    } — a strong fit for ${inputs.audience.toLowerCase()}.`,
  };
}

function buildComponents(): ComponentGuide[] {
  return [
    {
      name: "Primary Button",
      intent: "The single most important action on a view.",
      usage: [
        { label: "Background", token: "--brand-primary" },
        { label: "Label", token: "--on-brand" },
        { label: "Hover", token: "--brand-primary-hover" },
        { label: "Focus ring", token: "--focus-ring" },
      ],
    },
    {
      name: "Secondary Button",
      intent: "Supporting actions that shouldn't compete with the primary.",
      usage: [
        { label: "Background", token: "--surface" },
        { label: "Label", token: "--text-primary" },
        { label: "Border", token: "--border-strong" },
      ],
    },
    {
      name: "Destructive Button",
      intent: "Irreversible or dangerous actions.",
      usage: [
        { label: "Background", token: "--state-error" },
        { label: "Label", token: "--on-error" },
      ],
    },
    {
      name: "Card",
      intent: "Primary content container.",
      usage: [
        { label: "Surface", token: "--surface" },
        { label: "Border", token: "--border-subtle" },
        { label: "Title", token: "--text-primary" },
        { label: "Meta", token: "--text-muted" },
      ],
    },
    {
      name: "Navigation",
      intent: "App shell / sidebar.",
      usage: [
        { label: "Background", token: "--bg-elevated" },
        { label: "Active item", token: "--brand-primary" },
        { label: "Idle item", token: "--text-secondary" },
      ],
    },
    {
      name: "Badge",
      intent: "Small status and category labels.",
      usage: [
        { label: "Background", token: "--brand-accent" },
        { label: "Label", token: "--on-accent" },
      ],
    },
    {
      name: "Input",
      intent: "Text fields and form controls.",
      usage: [
        { label: "Background", token: "--bg-base" },
        { label: "Border", token: "--border-subtle" },
        { label: "Focus border", token: "--border-strong" },
        { label: "Placeholder", token: "--text-muted" },
      ],
    },
    {
      name: "Table",
      intent: "Dense data display.",
      usage: [
        { label: "Header", token: "--text-secondary" },
        { label: "Row divider", token: "--border-subtle" },
        { label: "Row hover", token: "--surface-hover" },
      ],
    },
    {
      name: "Metric Card",
      intent: "KPI / stat tiles on dashboards.",
      usage: [
        { label: "Value", token: "--text-primary" },
        { label: "Trend up", token: "--state-success-text" },
        { label: "Accent bar", token: "--brand-accent" },
      ],
    },
    {
      name: "CTA Block",
      intent: "Marketing conversion sections.",
      usage: [
        { label: "Background", token: "--brand-primary" },
        { label: "Heading", token: "--on-brand" },
        { label: "Button", token: "--brand-accent" },
      ],
    },
    {
      name: "Modal",
      intent: "Focused overlays and dialogs.",
      usage: [
        { label: "Scrim", token: "--overlay" },
        { label: "Surface", token: "--bg-elevated" },
        { label: "Border", token: "--border-subtle" },
      ],
    },
    {
      name: "Notification",
      intent: "Toasts and inline alerts (text uses the -text variants).",
      usage: [
        { label: "Success", token: "--state-success-text" },
        { label: "Warning", token: "--state-warning-text" },
        { label: "Error", token: "--state-error-text" },
        { label: "Info", token: "--state-info-text" },
      ],
    },
    {
      name: "Chart",
      intent: "Categorical data series.",
      usage: [
        { label: "Series 1", token: "--chart-1" },
        { label: "Series 2", token: "--chart-2" },
        { label: "Series 3", token: "--chart-3" },
        { label: "Series 4", token: "--chart-4" },
      ],
    },
  ];
}

function buildUsage(inputs: BrandInputs, mode: ColorMode): UsageGuide[] {
  return [
    {
      area: "App shell",
      guidance: `Use --bg-base for the outermost canvas and --bg-elevated for the shell/sidebar to create a clear ${mode} elevation hierarchy.`,
    },
    {
      area: "Sidebar",
      guidance:
        "Idle items use --text-secondary; the active item uses --brand-primary with an --on-brand icon and a subtle --surface-hover background.",
    },
    {
      area: "Header",
      guidance:
        "Keep the header on --bg-elevated with a --border-subtle bottom divider; place primary actions using --brand-primary.",
    },
    {
      area: "Dashboard cards",
      guidance:
        "Render cards on --surface with --border-subtle. Reserve --brand-accent for the single most important metric.",
    },
    {
      area: "Buttons",
      guidance:
        "Primary → --brand-primary/--on-brand (hover --brand-primary-hover), secondary → --surface/--border-strong, destructive → --state-error/--on-error.",
    },
    {
      area: "Forms & inputs",
      guidance:
        "Inputs sit on --bg-base with --border-subtle, shifting to --border-strong and a --focus-ring on focus. Placeholders use --text-muted.",
    },
    {
      area: "Tables",
      guidance:
        "Column headers use --text-secondary, rows divide with --border-subtle and hover with --surface-hover.",
    },
    {
      area: "Charts & data-viz",
      guidance:
        "Use --chart-1…--chart-6 for categorical series in order; they're pre-sequenced for adjacent contrast. Trends up use --state-success-text.",
    },
    {
      area: "Empty states",
      guidance:
        "Lean on --text-muted illustrations and a single --brand-primary call to action to guide the next step.",
    },
    {
      area: "Alerts",
      guidance:
        "Tint the surface with the matching state color at low alpha, and use the --state-*-text variant for the icon and copy so it stays legible.",
    },
    {
      area: "Modals",
      guidance:
        "Dim the page with --overlay, float the dialog on --bg-elevated with --border-subtle.",
    },
    {
      area: "Navigation",
      guidance:
        "Only one active color at a time — --brand-primary — so wayfinding stays unambiguous.",
    },
    {
      area: "Hero sections",
      guidance: `For ${inputs.productType.toLowerCase()} marketing, pair a --text-primary headline with a --brand-primary CTA and a --brand-accent highlight.`,
    },
    {
      area: "Pricing pages",
      guidance:
        "Highlight the recommended tier with a --brand-primary border and a --brand-accent badge; keep other tiers on --surface.",
    },
    {
      area: "Onboarding",
      guidance:
        "Progress indicators use --brand-primary; completed steps use --state-success.",
    },
    {
      area: "Settings",
      guidance:
        "Group controls on --surface cards; destructive zones use --state-error-text and borders.",
    },
    {
      area: "Dark mode",
      guidance:
        "A matching dark theme is generated alongside — toggle it in the preview and ship both via the CSS `prefers-color-scheme` block or a `[data-theme]` attribute.",
    },
    {
      area: "Light mode",
      guidance:
        "A matching light theme is generated alongside — both are exported together so you can switch at runtime.",
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Accessibility review                                               *
 * ------------------------------------------------------------------ */

function buildAccessibility(
  roles: Record<string, string>,
): BrandSystem["accessibility"] {
  const pair = (
    label: string,
    fg: string,
    bg: string,
    kind: SurfaceKind,
  ): ContrastPair => {
    const ratio = getContrastRatio(fg, bg);
    const g = wcagGrade(ratio, kind);
    return {
      label,
      fg,
      bg,
      ratio,
      kind,
      level: g.level,
      gradeLabel: g.label,
      pass: g.pass,
    };
  };

  const checks: ContrastPair[] = [
    pair(
      "Primary text on base",
      roles["text-primary"],
      roles["bg-base"],
      "text",
    ),
    pair(
      "Primary text on surface",
      roles["text-primary"],
      roles["surface"],
      "text",
    ),
    pair(
      "Secondary text on surface",
      roles["text-secondary"],
      roles["surface"],
      "text",
    ),
    pair(
      "Muted text on surface",
      roles["text-muted"],
      roles["surface"],
      "large",
    ),
    pair(
      "Button label on primary",
      roles["on-brand"],
      roles["brand-primary"],
      "text",
    ),
    pair(
      "Badge label on accent",
      roles["on-accent"],
      roles["brand-accent"],
      "text",
    ),
    pair(
      "Destructive label on error",
      roles["on-error"],
      roles["state-error"],
      "text",
    ),
    pair("Link on base", roles["link"], roles["bg-base"], "text"),
    // Focus ring carries the accessible UI-boundary requirement (WCAG 1.4.11);
    // the resting border-strong is a decorative hairline and isn't graded here.
    pair("Focus ring on base", roles["focus-ring"], roles["bg-base"], "ui"),
    pair(
      "Success text on surface",
      roles["state-success-text"],
      roles["surface"],
      "text",
    ),
    pair(
      "Warning text on surface",
      roles["state-warning-text"],
      roles["surface"],
      "text",
    ),
    pair(
      "Error text on surface",
      roles["state-error-text"],
      roles["surface"],
      "text",
    ),
    pair(
      "Info text on surface",
      roles["state-info-text"],
      roles["surface"],
      "text",
    ),
  ];

  const safe = checks.filter((c) => c.pass);
  const unsafe = checks.filter((c) => !c.pass);
  const warnings: string[] = [];

  for (const u of unsafe) {
    const need = u.kind === "text" ? "4.5:1" : "3:1";
    warnings.push(
      `${u.label} is ${u.ratio.toFixed(2)}:1 (needs ${need}). ${
        u.label.includes("Muted")
          ? "Acceptable for large/secondary text only — avoid for essential copy."
          : "Darken the foreground or lighten the background before shipping."
      }`,
    );
  }

  const score = Math.round((safe.length / checks.length) * 100);
  return { safe, unsafe, warnings, score };
}

/* ------------------------------------------------------------------ *
 * Public entry point                                                 *
 * ------------------------------------------------------------------ */

export function generateBrandSystem(
  palette: GeneratePalette,
  inputs: BrandInputs,
): BrandSystem {
  const { light, dark, mode, chartSeries, limitations } = deriveRoles(
    palette,
    inputs,
  );

  const toMap = (list: RoleSpec[]): Record<string, string> => {
    const m: Record<string, string> = {};
    for (const r of list) m[r.key] = r.hex;
    return m;
  };
  const lightRoles = toMap(light);
  const darkRoles = toMap(dark);
  const activeList = mode === "dark" ? dark : light;
  const roles = mode === "dark" ? darkRoles : lightRoles;

  const accessibility = buildAccessibility(roles);
  if (accessibility.score < 100) {
    limitations.push(
      `${accessibility.unsafe.length} of ${
        accessibility.safe.length + accessibility.unsafe.length
      } critical color pairs fall below their WCAG target in ${mode} mode — see the Accessibility review for exact fixes.`,
    );
  }

  return {
    paletteId: palette.id,
    paletteName: palette.name,
    category: palette.category ?? "Uncategorized",
    inputs,
    mode,
    roles,
    rolesList: activeList as SemanticRole[],
    lightRoles,
    darkRoles,
    lightRolesList: light as SemanticRole[],
    darkRolesList: dark as SemanticRole[],
    chartSeries,
    foundation: buildFoundation(palette, inputs, mode),
    components: buildComponents(),
    usage: buildUsage(inputs, mode),
    accessibility,
    limitations,
  };
}

/* ------------------------------------------------------------------ *
 * Exporters                                                          *
 * ------------------------------------------------------------------ */

function tokenComment(system: BrandSystem): string {
  return `${system.inputs.appName} — Brand System\nGenerated by Palattes from the “${system.paletteName}” palette\nModes: light + dark (default: ${system.mode})`;
}

function varLines(list: SemanticRole[], indent: string): string {
  return list
    .map((r) => `${indent}--${r.key}: ${r.hex.toLowerCase()};`)
    .join("\n");
}

export function exportCss(system: BrandSystem): string {
  const header = tokenComment(system)
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
  return `:root {
  /*
${header}
  */
${varLines(system.lightRolesList, "  ")}
}

@media (prefers-color-scheme: dark) {
  :root {
${varLines(system.darkRolesList, "    ")}
  }
}

[data-theme="dark"] {
${varLines(system.darkRolesList, "  ")}
}

[data-theme="light"] {
${varLines(system.lightRolesList, "  ")}
}`;
}

export function exportScss(system: BrandSystem): string {
  const header = tokenComment(system)
    .split("\n")
    .map((l) => `// ${l}`)
    .join("\n");
  const vars = system.lightRolesList
    .map((r) => `$${r.key}: ${r.hex.toLowerCase()};`)
    .join("\n");
  const mapOf = (list: SemanticRole[]) =>
    list.map((r) => `  "${r.key}": ${r.hex.toLowerCase()},`).join("\n");
  return `${header}

/* Brand tokens (light) */
${vars}

/* Theme maps — pick one at runtime */
$brand-system-light: (
${mapOf(system.lightRolesList)}
);

$brand-system-dark: (
${mapOf(system.darkRolesList)}
);`;
}

function tokenObject(list: SemanticRole[]) {
  const tokens: Record<string, { value: string; group: string; role: string }> =
    {};
  for (const r of list) {
    tokens[r.key] = {
      value: r.hex.toLowerCase(),
      group: r.group,
      role: r.label,
    };
  }
  return tokens;
}

export function exportJson(system: BrandSystem): string {
  return JSON.stringify(
    {
      name: `${system.inputs.appName} Brand System`,
      palette: system.paletteName,
      generatedBy: "Palattes",
      defaultMode: system.mode,
      modes: {
        light: tokenObject(system.lightRolesList),
        dark: tokenObject(system.darkRolesList),
      },
      chart: system.chartSeries.map((c) => c.toLowerCase()),
    },
    null,
    2,
  );
}

export function exportTailwind(system: BrandSystem): string {
  // Semantic tokens map to CSS vars so the config works for both themes;
  // the raw light/dark hexes ship via the CSS export above.
  const entries = system.lightRolesList
    .map((r) => `        "${r.key}": "var(--${r.key})",`)
    .join("\n");
  return `/** @type {import('tailwindcss').Config} */
// ${system.inputs.appName} Brand System — pair with the CSS export (light + dark vars).
module.exports = {
  theme: {
    extend: {
      colors: {
${entries}
      },
    },
  },
};`;
}

export function exportStyleDictionary(system: BrandSystem): string {
  const colorOf = (list: SemanticRole[]) => {
    const tokens: Record<
      string,
      { value: string; type: "color"; comment: string }
    > = {};
    for (const r of list) {
      tokens[r.key] = {
        value: r.hex.toLowerCase(),
        type: "color",
        comment: `${r.group} · ${r.label}`,
      };
    }
    return tokens;
  };
  return JSON.stringify(
    {
      source: "Palattes",
      system: `${system.inputs.appName} Brand System`,
      defaultMode: system.mode,
      color: {
        light: colorOf(system.lightRolesList),
        dark: colorOf(system.darkRolesList),
      },
    },
    null,
    2,
  );
}

export function exportMarkdown(system: BrandSystem): string {
  const {
    inputs,
    foundation,
    lightRolesList,
    darkRoles,
    usage,
    components,
    accessibility,
    chartSeries,
    limitations,
  } = system;
  const rolesTable = lightRolesList
    .map(
      (r) =>
        `| ${r.label} | \`--${r.key}\` | \`${r.hex.toLowerCase()}\` | \`${(darkRoles[r.key] ?? r.hex).toLowerCase()}\` | ${r.derived ? "derived" : "palette"} |`,
    )
    .join("\n");
  const usageList = usage
    .map((u) => `- **${u.area}** — ${u.guidance}`)
    .join("\n");
  const compList = components
    .map(
      (c) =>
        `### ${c.name}\n${c.intent}\n\n${c.usage
          .map((u) => `- ${u.label}: \`${u.token}\``)
          .join("\n")}`,
    )
    .join("\n\n");
  const a11ySafe = accessibility.safe
    .map((p) => `- ✅ ${p.label} — ${p.ratio.toFixed(2)}:1 (${p.gradeLabel})`)
    .join("\n");
  const a11yUnsafe =
    accessibility.unsafe.length > 0
      ? accessibility.unsafe
          .map(
            (p) =>
              `- ⚠️ ${p.label} — ${p.ratio.toFixed(2)}:1 (${p.gradeLabel})`,
          )
          .join("\n")
      : "- None — all critical pairs pass their WCAG target.";
  const limits =
    limitations.length > 0
      ? limitations.map((l) => `- ${l}`).join("\n")
      : "- None.";
  const chartList = chartSeries
    .map((c, i) => `- \`--chart-${i + 1}\` — \`${c.toLowerCase()}\``)
    .join("\n");

  return `# ${inputs.appName} — Brand System

Generated by **Palattes** from the **${system.paletteName}** palette (${system.category}) · Default mode: **${system.mode}** · Light + dark themes included

## Brand Foundation
- **Positioning:** ${foundation.positioning}
- **Visual direction:** ${foundation.direction}
- **Personality:** ${foundation.personality}
- **Design language:** ${foundation.language}
- **Color strategy:** ${foundation.strategy}
- **What it communicates:** ${foundation.communicates}

## Semantic Color Roles
| Role | Token | Light | Dark | Source |
| --- | --- | --- | --- | --- |
${rolesTable}

## Data-viz Series
${chartList}

## UI Usage Guide
${usageList}

## Brand Components
${compList}

## Accessibility Review — Score ${accessibility.score}/100 (${system.mode} mode)
**Safe pairings**
${a11ySafe}

**Needs attention**
${a11yUnsafe}

## Limitations
${limits}

---
_Tokens available as CSS, SCSS, JSON, Tailwind and Style Dictionary via the Palattes Brand System exporter._
`;
}
