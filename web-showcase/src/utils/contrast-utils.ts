import { Palette } from "@/types";

/**
 * WCAG 2.0 Color Contrast Utilities
 */

function getLuminance(hex: string): number {
  // Clean hex string
  let c = hex.replace(/^#/, "");

  // Expand shorthand formats (e.g. "FFF" -> "FFFFFF", "F00F" -> "FF0000FF")
  if (c.length === 3 || c.length === 4) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  }

  // Extract RGB (ignore alpha if present)
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error("Invalid hex color");
  }

  const [aR, aG, aB] = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return aR * 0.2126 + aG * 0.7152 + aB * 0.0722;
}

/**
 * Calculates the contrast ratio between two hex colors.
 * Returns a number between 1 and 21.
 */
export function getContrastRatio(color1: string, color2: string): number {
  try {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);

    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return Math.round(ratio * 100) / 100; // Round to 2 decimal places
  } catch (e) {
    return 1;
  }
}

export interface ContrastResult {
  ratio: number;
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
  largeAAA: boolean;
}

/**
 * Returns compliance grades based on WCAG contrast ratio.
 */
export function getContrastResult(
  color1: string,
  color2: string,
): ContrastResult {
  const ratio = getContrastRatio(color1, color2);
  return {
    ratio,
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace(/^#/, "");
  if (c.length === 3 || c.length === 4) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return [0, 0, 0];
  }
  return [r, g, b];
}

export function getPaletteDistance(
  palette: Palette,
  targetHex: string,
): number {
  const targetRgb = hexToRgb(targetHex);
  let minDistance = Infinity;

  for (const color of palette.colors) {
    const colorRgb = hexToRgb(color.hex);
    const distance = Math.sqrt(
      Math.pow(targetRgb[0] - colorRgb[0], 2) +
        Math.pow(targetRgb[1] - colorRgb[1], 2) +
        Math.pow(targetRgb[2] - colorRgb[2], 2),
    );
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

export function getLuminanceValue(hex: string): number {
  let c = hex.replace(/^#/, "");
  if (c.length === 3 || c.length === 4)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return 0;
  const lin = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return lin(r) * 0.2126 + lin(g) * 0.7152 + lin(b) * 0.0722;
}

export function hexToHsl(hex: string): [number, number, number] {
  const [rInt, gInt, bInt] = hexToRgb(hex);
  const r = rInt / 255,
    g = gInt / 255,
    b = bInt / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function getReadableTextColor(hex: string): string {
  try {
    const onWhite = getContrastRatio(hex, "#ffffff");
    const onDark = getContrastRatio(hex, "#0f172a");
    return onWhite >= onDark ? "#ffffff" : "#0f172a";
  } catch {
    return "#0f172a";
  }
}

/**
 * WCAG grading for a contrast ratio, aware of the surface being tested.
 * `kind` selects the correct threshold:
 *  - "text"  → body text (AA 4.5, AAA 7)
 *  - "large" → large/bold text (AA 3, AAA 4.5)
 *  - "ui"    → non-text UI components & borders (pass at 3.0)
 */
export type SurfaceKind = "text" | "large" | "ui";

export interface WcagGrade {
  label: string; // "AAA" | "AA" | "AA Lg" | "UI" | "Fail"
  level: "AAA" | "AA" | "AA-Large" | "UI" | "Fail";
  pass: boolean;
  tone: "pass" | "warn" | "fail";
}

export function wcagGrade(
  ratio: number,
  kind: SurfaceKind = "text",
): WcagGrade {
  if (kind === "ui") {
    return ratio >= 3
      ? { label: "UI", level: "UI", pass: true, tone: "pass" }
      : { label: "Fail", level: "Fail", pass: false, tone: "fail" };
  }
  if (ratio >= 7)
    return { label: "AAA", level: "AAA", pass: true, tone: "pass" };
  if (ratio >= 4.5)
    return { label: "AA", level: "AA", pass: true, tone: "pass" };
  if (ratio >= 3)
    return {
      label: "AA Lg",
      level: "AA-Large",
      pass: kind === "large",
      tone: "warn",
    };
  return { label: "Fail", level: "Fail", pass: false, tone: "fail" };
}

/**
 * From a set of candidate hexes, pick the one with the highest contrast against
 * `bg`. Optionally require a minimum ratio and exclude a hex (e.g. the current
 * value) so "fix" always proposes a real change when possible.
 */
export function bestContrastColor(
  candidates: string[],
  bg: string,
  opts: { min?: number; exclude?: string } = {},
): { hex: string; ratio: number } | null {
  const ranked = candidates
    .map((hex) => ({ hex: hex.slice(0, 7), ratio: getContrastRatio(hex, bg) }))
    .sort((a, b) => b.ratio - a.ratio);
  if (ranked.length === 0) return null;
  if (opts.exclude) {
    const better = ranked.find(
      (c) => c.hex.toLowerCase() !== opts.exclude!.slice(0, 7).toLowerCase(),
    );
    if (better && (!opts.min || better.ratio >= opts.min)) return better;
  }
  return ranked[0];
}

/** Perceptual-ish "colorfulness": HSL saturation weighted toward mid lightness. */
export function getChroma(hex: string): number {
  const [, s, l] = hexToHsl(hex);
  const midWeight = 1 - Math.abs(l - 50) / 50; // 1 at L=50, 0 at extremes
  return s * midWeight;
}
