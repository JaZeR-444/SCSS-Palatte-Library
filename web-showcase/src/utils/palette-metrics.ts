import { Palette } from "@/types";
import { getContrastRatio, getLuminanceValue, hexToHsl } from "@/utils/contrast-utils";

export type Temperature = "warm" | "cool" | "balanced";
export type StructureProfile = "single-span" | "multi-hue";
export type SaturationProfile = "muted" | "balanced" | "vibrant";

export interface PaletteMetrics {
  averageLuminance: number;
  averageSaturation: number;
  hueSpread: number;
  contrastRange: number;
  wcagPassRate: number;
  uiReadiness: number;
  temperature: Temperature;
  structure: StructureProfile;
  saturationProfile: SaturationProfile;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function analyzePalette(palette: Palette): PaletteMetrics {
  const hsls = palette.colors.map((c) => hexToHsl(c.hex));
  const lums = palette.colors.map((c) => getLuminanceValue(c.hex));
  const sats = hsls.map((hsl) => hsl[1]);
  const hues = hsls.map((hsl) => hsl[0]);

  const avgLum = lums.reduce((s, n) => s + n, 0) / Math.max(1, lums.length);
  const avgSat = sats.reduce((s, n) => s + n, 0) / Math.max(1, sats.length);

  let minLum = Number.POSITIVE_INFINITY;
  let maxLum = Number.NEGATIVE_INFINITY;
  for (const l of lums) {
    if (l < minLum) minLum = l;
    if (l > maxLum) maxLum = l;
  }
  const contrastRange = (maxLum + 0.05) / (minLum + 0.05);

  let passPairs = 0;
  let totalPairs = 0;
  for (let i = 0; i < palette.colors.length; i++) {
    for (let j = i + 1; j < palette.colors.length; j++) {
      totalPairs++;
      if (getContrastRatio(palette.colors[i].hex, palette.colors[j].hex) >= 4.5) {
        passPairs++;
      }
    }
  }
  const wcagPassRate = totalPairs > 0 ? passPairs / totalPairs : 0;

  const anchor = hues[0] ?? 0;
  const hueSpread = hues.length
    ? Math.max(...hues.map((h) => hueDistance(h, anchor)))
    : 0;

  let warm = 0;
  let cool = 0;
  for (const [h, s] of hsls) {
    if (s < 20) continue;
    if ((h >= 0 && h <= 70) || h >= 330) warm++;
    else if (h >= 160 && h <= 280) cool++;
  }
  const temperature: Temperature =
    warm > cool * 1.35 ? "warm" : cool > warm * 1.35 ? "cool" : "balanced";

  const structure: StructureProfile = hueSpread <= 26 ? "single-span" : "multi-hue";
  const saturationProfile: SaturationProfile =
    avgSat < 38 ? "muted" : avgSat > 64 ? "vibrant" : "balanced";

  const uiReadiness = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        30 * wcagPassRate +
          25 * Math.min(1, contrastRange / 9) +
          20 * (1 - Math.min(1, Math.abs(avgLum - 0.5) / 0.5)) +
          15 * Math.min(1, avgSat / 70) +
          10 * (structure === "multi-hue" ? 1 : 0.8),
      ),
    ),
  );

  return {
    averageLuminance: avgLum,
    averageSaturation: avgSat,
    hueSpread,
    contrastRange,
    wcagPassRate,
    uiReadiness,
    temperature,
    structure,
    saturationProfile,
  };
}
