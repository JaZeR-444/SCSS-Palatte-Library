import { Palette } from "@/types";

/**
 * WCAG 2.0 Color Contrast Utilities
 */


function getLuminance(hex: string): number {
  // Clean hex string
  let c = hex.replace(/^#/, "");
  
  // Expand shorthand formats (e.g. "FFF" -> "FFFFFF", "F00F" -> "FF0000FF")
  if (c.length === 3 || c.length === 4) {
    c = c.split("").map((x) => x + x).join("");
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
export function getContrastResult(color1: string, color2: string): ContrastResult {
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
    c = c.split("").map((x) => x + x).join("");
  }
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return [0, 0, 0];
  }
  return [r, g, b];
}

export function getPaletteDistance(palette: Palette, targetHex: string): number {
  const targetRgb = hexToRgb(targetHex);
  let minDistance = Infinity;

  for (const color of palette.colors) {
    const colorRgb = hexToRgb(color.hex);
    const distance = Math.sqrt(
      Math.pow(targetRgb[0] - colorRgb[0], 2) +
      Math.pow(targetRgb[1] - colorRgb[1], 2) +
      Math.pow(targetRgb[2] - colorRgb[2], 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

export function getLuminanceValue(hex: string): number {
  let c = hex.replace(/^#/, "");
  if (c.length === 3 || c.length === 4) c = c.split("").map((x) => x + x).join("");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return 0;
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return lin(r) * 0.2126 + lin(g) * 0.7152 + lin(b) * 0.0722;
}

export function hexToHsl(hex: string): [number, number, number] {
  const [rInt, gInt, bInt] = hexToRgb(hex);
  const r = rInt / 255, g = gInt / 255, b = bInt / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
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

