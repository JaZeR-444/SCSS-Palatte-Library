import {
  DEFAULT_TYPOGRAPHY,
  DesignPreset,
  DesignSystem,
  DesignTokens,
} from "@/types/design-system";

/* ------------------------------------------------------------------ *
 * Shared token generators + style vocabulary.                        *
 *                                                                    *
 * Single source of truth for the token math used by both the manual  *
 * controls (token-controls.tsx) and the full-system presets below.   *
 * ------------------------------------------------------------------ */

export const FONT_PRESETS: { label: string; value: string }[] = [
  {
    label: "System",
    value:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {
    label: "Humanist",
    value: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    label: "Geometric",
    value: 'Verdana, "Trebuchet MS", "Segoe UI", sans-serif',
  },
  { label: "Serif", value: 'Georgia, "Times New Roman", Times, serif' },
  {
    label: "Rounded",
    value: 'ui-rounded, "SF Pro Rounded", "Segoe UI", sans-serif',
  },
  {
    label: "Monospace",
    value:
      'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace',
  },
];

const FONT = Object.fromEntries(
  FONT_PRESETS.map((f) => [f.label, f.value]),
) as Record<string, string>;

export const SHADOW_PRESETS: Record<string, string[]> = {
  None: ["none", "none", "none", "none"],
  Subtle: [
    "0 1px 1px 0 rgb(15 23 42 / 0.04)",
    "0 2px 4px -1px rgb(15 23 42 / 0.06)",
    "0 6px 12px -3px rgb(15 23 42 / 0.08)",
    "0 12px 24px -6px rgb(15 23 42 / 0.12)",
  ],
  Soft: [
    "0 1px 2px 0 rgb(15 23 42 / 0.05)",
    "0 4px 8px -2px rgb(15 23 42 / 0.10)",
    "0 12px 24px -6px rgb(15 23 42 / 0.14)",
    "0 24px 48px -12px rgb(15 23 42 / 0.20)",
  ],
  Strong: [
    "0 2px 4px 0 rgb(15 23 42 / 0.08)",
    "0 8px 16px -3px rgb(15 23 42 / 0.16)",
    "0 18px 36px -8px rgb(15 23 42 / 0.22)",
    "0 32px 64px -16px rgb(15 23 42 / 0.30)",
  ],
};

/** Modular type scale from a ratio, centered so index 2 = 16px. */
export function makeScale(ratio: number, base = 16): number[] {
  return [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
    Math.round(base * Math.pow(ratio, i)),
  );
}

/** 10-step spacing ramp from a base unit. */
export function makeSpace(base: number): number[] {
  return [0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24].map((m) => Math.round(m * base));
}

export function makeRadius(md: number) {
  return { sm: Math.round(md * 0.5), md, lg: Math.round(md * 1.6), full: 9999 };
}

/** Recover the geometric scale ratio from an existing size ramp. */
export function inferRatio(scale: number[]): number {
  if (scale.length < 2 || scale[0] <= 0) return 1.2;
  const r = Math.pow(
    scale[scale.length - 1] / scale[0],
    1 / (scale.length - 1),
  );
  return Math.min(1.414, Math.max(1.1, +r.toFixed(3)));
}

/* ------------------------------------------------------------------ *
 * Presets — full non-color "feel" packs.                             *
 *                                                                    *
 * Presets restyle type / spacing / shape / elevation / density while *
 * preserving the palette-derived color layer, so switching one       *
 * transforms the whole product feel without discarding the brand.    *
 * ------------------------------------------------------------------ */

interface Pack {
  font: string;
  ratio: number;
  lineHeight: number;
  tracking: number;
  spaceBase: number;
  radius: number;
  shadow: keyof typeof SHADOW_PRESETS;
  density: DesignTokens["density"];
}

function pack(p: Pack): Partial<DesignTokens> {
  return {
    typography: {
      sans: p.font,
      mono: DEFAULT_TYPOGRAPHY.mono,
      scale: makeScale(p.ratio),
      weights: DEFAULT_TYPOGRAPHY.weights,
      lineHeight: p.lineHeight,
      tracking: p.tracking,
    },
    space: makeSpace(p.spaceBase),
    radius: makeRadius(p.radius),
    shadow: SHADOW_PRESETS[p.shadow],
    density: p.density,
  };
}

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "premium-saas",
    name: "Premium SaaS",
    description: "Refined humanist type, soft elevation, confident spacing.",
    personality: ["Premium", "Minimal"],
    mode: "light",
    tokens: pack({
      font: FONT.Humanist,
      ratio: 1.25,
      lineHeight: 1.55,
      tracking: -0.01,
      spaceBase: 4,
      radius: 12,
      shadow: "Soft",
      density: "cozy",
    }),
  },
  {
    id: "minimal-apple",
    name: "Minimal",
    description: "Neutral system type, quiet shadows, generous whitespace.",
    personality: ["Minimal", "Premium"],
    mode: "light",
    tokens: pack({
      font: FONT.System,
      ratio: 1.2,
      lineHeight: 1.6,
      tracking: -0.005,
      spaceBase: 5,
      radius: 10,
      shadow: "Subtle",
      density: "comfortable",
    }),
  },
  {
    id: "dev-tool",
    name: "Sharp Technical",
    description: "Tight grotesque type, hard corners, dense dev-tool layout.",
    personality: ["Technical", "Data-heavy"],
    mode: "dark",
    tokens: pack({
      font: FONT.Geometric,
      ratio: 1.15,
      lineHeight: 1.45,
      tracking: 0,
      spaceBase: 3,
      radius: 4,
      shadow: "None",
      density: "compact",
    }),
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Serif headings, airy leading, dramatic type scale.",
    personality: ["Creative", "Premium"],
    mode: "light",
    tokens: pack({
      font: FONT.Serif,
      ratio: 1.333,
      lineHeight: 1.7,
      tracking: 0,
      spaceBase: 5,
      radius: 4,
      shadow: "Subtle",
      density: "comfortable",
    }),
  },
  {
    id: "playful",
    name: "Playful",
    description: "Rounded type, big radii, bouncy elevation.",
    personality: ["Playful", "Friendly"],
    mode: "light",
    tokens: pack({
      font: FONT.Rounded,
      ratio: 1.25,
      lineHeight: 1.55,
      tracking: 0.01,
      spaceBase: 4,
      radius: 24,
      shadow: "Strong",
      density: "comfortable",
    }),
  },
  {
    id: "dense-dashboard",
    name: "Dense Dashboard",
    description: "Compact, data-first spacing with restrained shape.",
    personality: ["Data-heavy", "Enterprise"],
    mode: "light",
    tokens: pack({
      font: FONT.Humanist,
      ratio: 1.15,
      lineHeight: 1.4,
      tracking: 0,
      spaceBase: 3,
      radius: 6,
      shadow: "Subtle",
      density: "compact",
    }),
  },
  {
    id: "neubrutalist",
    name: "Neubrutalist",
    description: "Zero radius, hard shadows, bold display type.",
    personality: ["Bold", "Creative"],
    mode: "light",
    tokens: pack({
      font: FONT.Geometric,
      ratio: 1.333,
      lineHeight: 1.45,
      tracking: 0,
      spaceBase: 4,
      radius: 0,
      shadow: "Strong",
      density: "cozy",
    }),
  },
  {
    id: "command-center",
    name: "Command Center",
    description: "Dark-first, compact, monospaced accents for ops UIs.",
    personality: ["Technical", "Dark-mode first"],
    mode: "dark",
    tokens: pack({
      font: FONT.Monospace,
      ratio: 1.2,
      lineHeight: 1.5,
      tracking: 0,
      spaceBase: 3,
      radius: 8,
      shadow: "Soft",
      density: "compact",
    }),
  },
];

/**
 * Apply a preset to a design system: merge its token pack over the current
 * tokens (preserving the color + chart layer), set the default mode, and stamp
 * the preset id.
 */
export function applyPreset(
  ds: DesignSystem,
  preset: DesignPreset,
): DesignSystem {
  const p = preset.tokens;
  return {
    ...ds,
    tokens: {
      ...ds.tokens,
      ...p,
      typography: { ...ds.tokens.typography, ...(p.typography ?? {}) },
      radius: { ...ds.tokens.radius, ...(p.radius ?? {}) },
      border: { ...ds.tokens.border, ...(p.border ?? {}) },
    },
    presetId: preset.id,
    mode: preset.mode ?? ds.mode,
  };
}
