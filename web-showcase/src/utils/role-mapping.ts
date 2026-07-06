import { ROLE_COUNT, ROLE_META, RoleKind, RoleGroup } from "@/types/studio";
import {
  getChroma,
  getContrastRatio,
  getLuminanceValue,
  hexToHsl,
  wcagGrade,
  SurfaceKind,
} from "@/utils/contrast-utils";

export type RoleMapping = Record<string, string>;

const varName = (index0: number) => `--ui-color-${index0 + 1}`;

/** Map a role's semantic kind to the WCAG threshold family used to grade it. */
export function kindToSurface(kind: RoleKind): SurfaceKind {
  if (kind === "text" || kind === "surface") return "text";
  if (kind === "large") return "large";
  return "ui"; // border, brand, state
}

export interface RoleIssue {
  index: number;
  name: string;
  group: RoleGroup;
  ratio: number;
  against: string;
}

/**
 * Which role tokens fail contrast against their comparison target. Shared by the
 * Roles UI, the health summary, and the tab issue badges so every surface counts
 * failures the same way.
 */
export function computeRoleIssues(roleMapping: RoleMapping): RoleIssue[] {
  const issues: RoleIssue[] = [];
  ROLE_META.forEach((meta, i) => {
    const cur = roleMapping[varName(i)];
    const cmp = roleMapping[varName(meta.compareIndex)];
    if (!cur || !cmp) return;
    const ratio = getContrastRatio(cur, cmp);
    if (!wcagGrade(ratio, kindToSurface(meta.kind)).pass) {
      issues.push({
        index: i,
        name: meta.name,
        group: meta.group,
        ratio,
        against: ROLE_META[meta.compareIndex].name,
      });
    }
  });
  return issues;
}

/** Pick the candidate whose hue is closest to `target`, preferring chromatic ones. */
function nearestHue(
  colors: string[],
  target: number,
  maxDist = 45,
): string | null {
  let best: { hex: string; score: number } | null = null;
  for (const hex of colors) {
    const [h, s] = hexToHsl(hex);
    if (s < 12) continue; // skip near-greys for hue matching
    let dist = Math.abs(h - target);
    if (dist > 180) dist = 360 - dist;
    if (dist > maxDist) continue;
    const score = dist - s * 0.15; // closer hue + more saturation wins
    if (!best || score < best.score) best = { hex, score };
  }
  return best?.hex ?? null;
}

/**
 * Assign palette colors to semantic UI roles by luminance, chroma, and hue so a
 * palette opens *usable* — the base text/background pairing is guaranteed to be
 * the highest-contrast pairing available, brand colors are the most vivid, and
 * status colors follow hue convention where the palette allows.
 */
export function buildRoleMapping(colorsInput: string[]): RoleMapping {
  const colors = colorsInput.filter(Boolean);
  const mapping: RoleMapping = {};
  if (colors.length === 0) return mapping;

  const byLumAsc = [...colors].sort(
    (a, b) => getLuminanceValue(a) - getLuminanceValue(b),
  );
  const byChromaDesc = [...colors].sort((a, b) => getChroma(b) - getChroma(a));
  const medianLum = getLuminanceValue(
    byLumAsc[Math.floor(byLumAsc.length / 2)],
  );
  // Bias toward a light theme unless the palette is clearly dark.
  const lightTheme = medianLum >= 0.35;

  // Background pool runs from the "base" surface outward; text pool sits at the
  // opposite luminance extreme so text always reads on the canvas.
  const bgPool = lightTheme ? [...byLumAsc].reverse() : byLumAsc;
  const textPool = lightTheme ? byLumAsc : [...byLumAsc].reverse();
  const at = (pool: string[], i: number) => pool[Math.min(i, pool.length - 1)];

  const canvas = bgPool[0];

  // Surfaces 0..3 step gently away from the canvas.
  for (let i = 0; i < 4; i++) mapping[varName(i)] = at(bgPool, i);

  // Text: pick the highest-contrast color vs canvas for the base, then layer
  // strong (max contrast) and muted (mid, but as readable as possible).
  const textRanked = [...textPool].sort(
    (a, b) => getContrastRatio(b, canvas) - getContrastRatio(a, canvas),
  );
  const textStrong = textRanked[0] ?? canvas;
  const textBase = textRanked[0] ?? canvas;
  const textMuted =
    textRanked.find(
      (c) => getContrastRatio(c, canvas) < getContrastRatio(textBase, canvas),
    ) ??
    textRanked[Math.min(1, textRanked.length - 1)] ??
    textBase;
  mapping[varName(6)] = textMuted; // Text Muted
  mapping[varName(7)] = textBase; // Text Base
  mapping[varName(8)] = textStrong; // Text Strong

  // Borders: mid-luminance colors that separate from the canvas.
  const borderRanked = [...colors].sort(
    (a, b) => getContrastRatio(a, canvas) - getContrastRatio(b, canvas),
  );
  const borderSubtle =
    borderRanked.find((c) => getContrastRatio(c, canvas) >= 1.3) ??
    borderRanked[0];
  const borderStrong =
    [...colors].sort(
      (a, b) => getContrastRatio(b, canvas) - getContrastRatio(a, canvas),
    )[Math.min(1, colors.length - 1)] ?? borderSubtle;
  mapping[varName(4)] = borderSubtle;
  mapping[varName(5)] = borderStrong;

  // Brand: the most chromatic colors, kept distinct where possible.
  const brandPrimary = byChromaDesc[0] ?? canvas;
  const brandSecondary =
    byChromaDesc.find((c) => {
      const dh = Math.abs(hexToHsl(c)[0] - hexToHsl(brandPrimary)[0]);
      return Math.min(dh, 360 - dh) > 25;
    }) ?? at(byChromaDesc, 1);
  const accent = at(byChromaDesc, 2);
  mapping[varName(9)] = brandPrimary; // Primary
  mapping[varName(10)] = brandPrimary; // Primary Hover
  mapping[varName(11)] = brandSecondary; // Secondary
  mapping[varName(12)] = brandSecondary; // Secondary Hover
  mapping[varName(13)] = accent; // Accent
  mapping[varName(14)] = at(byChromaDesc, 3); // Accent Soft

  // States: follow hue convention, falling back to vivid colors.
  const success =
    nearestHue(colors, 140) ?? nearestHue(colors, 110, 60) ?? brandSecondary;
  const warning = nearestHue(colors, 45, 35) ?? accent;
  const danger =
    nearestHue(colors, 5, 30) ?? nearestHue(colors, 350, 30) ?? brandPrimary;
  const info = nearestHue(colors, 215, 45) ?? brandSecondary;
  const link = nearestHue(colors, 215, 60) ?? brandPrimary;
  mapping[varName(15)] = success;
  mapping[varName(16)] = warning;
  mapping[varName(17)] = danger;
  mapping[varName(18)] = info;
  mapping[varName(19)] = link;
  mapping[varName(20)] = brandPrimary; // Focus Ring — align with primary

  // Safety net: fill any gap by cycling the source colors.
  for (let i = 0; i < ROLE_COUNT; i++) {
    if (!mapping[varName(i)]) mapping[varName(i)] = colors[i % colors.length];
  }
  return mapping;
}

/** Even index-based mapping (the raw palette order) — used by "Shuffle". */
export function indexRoleMapping(colors: string[]): RoleMapping {
  const mapping: RoleMapping = {};
  for (let i = 0; i < ROLE_COUNT; i++) {
    mapping[varName(i)] = colors[i % colors.length];
  }
  return mapping;
}

export { ROLE_META };
