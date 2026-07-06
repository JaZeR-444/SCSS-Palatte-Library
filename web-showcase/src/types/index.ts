export interface Color {
  name: string;
  hex: string;
  hsl?: string;
}

/** Precomputed WCAG/usability metadata (see enrich_palettes.py). */
export interface PaletteAccessibility {
  uiReadiness: number; // 0–100
  wcagPassRate: number; // 0–1
  contrastRange: number;
  aaPairs: number;
  aaaPairs: number;
  totalPairs: number;
  hasAccessibleText: boolean;
  bestTextPair: {
    background: string;
    text: string;
    ratio: number;
    level: "AAA" | "AA" | "AA-Large" | "Fail";
  };
  roles: {
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
}

/** Precomputed perceptual character (see enrich_palettes.py). */
export interface PaletteDerived {
  hueFamily: string;
  hueFamilies: string[];
  temperature: "warm" | "cool" | "balanced";
  harmony:
    | "monochromatic"
    | "analogous"
    | "complementary"
    | "triadic"
    | "tetradic"
    | "polychrome"
    | "neutral";
  structure: "single-span" | "multi-hue";
  saturationProfile: "muted" | "balanced" | "vibrant";
  averageLuminance: number;
  averageSaturation: number;
  sortKey: number;
}

export type PaletteSource = "curated" | "procedural" | "systematic";
export type PaletteKind = "palette" | "extended" | "collection";

export interface Palette {
  id: string;
  name: string;
  author?: string;
  version?: string;
  category?: string;
  count: number;
  description?: string;
  path?: string;
  colors: Color[];
  tags?: { mood: string[]; aesthetic: string[] };
  created?: string;
  updated?: string;
  intent?: string;
  source?: PaletteSource;
  kind?: PaletteKind;
  accessibility?: PaletteAccessibility;
  derived?: PaletteDerived;
  /** Composite 0–100 curation score (see refine_palettes.py); higher ranks first. */
  qualityScore?: number;
  /** Product this palette was designed for (e.g. "WRD Leads CRM"), if any. */
  project?: string;
}
