import {
  getContrastRatio,
  getLuminanceValue,
  hexToHsl,
  hexToRgb,
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
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
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
 * Role derivation                                                    *
 * ------------------------------------------------------------------ */

function contrastGrade(ratio: number): ContrastPair["grade"] {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

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
  avgSat: number,
): { hex: string; derived: boolean } {
  const targetHue = STATE_HUES[name];
  // Find the nearest palette color by hue that is saturated enough to read as a state.
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
  if (best && bestDist <= 26) {
    // Nudge lightness so it stays legible in the chosen mode.
    const targetL = mode === "dark" ? clamp(best.l, 55, 72) : clamp(best.l, 40, 55);
    return { hex: hslToHex(best.h, Math.max(best.s, 45), targetL), derived: false };
  }
  // Synthesize a brand-consistent state color at the canonical hue.
  const sat = clamp(avgSat, 55, 78);
  const light = mode === "dark" ? 62 : 47;
  return { hex: hslToHex(targetHue, sat, light), derived: true };
}

interface RoleSpec {
  key: string;
  label: string;
  group: RoleGroup;
  hex: string;
  description: string;
  derived: boolean;
}

/**
 * Deterministically map a palette (of any size) onto a full semantic role set.
 */
export function deriveRoles(
  palette: GeneratePalette,
  inputs: BrandInputs,
): { roles: RoleSpec[]; mode: ColorMode; limitations: string[] } {
  const cols = palette.colors.map((c) => meta(c.hex));
  const limitations: string[] = [];

  const byLum = [...cols].sort((a, b) => a.lum - b.lum);
  const darkest = byLum[0];
  const lightest = byLum[byLum.length - 1];
  const avgLum = cols.reduce((s, c) => s + c.lum, 0) / cols.length;
  const avgSat = cols.reduce((s, c) => s + c.s, 0) / cols.length;

  // Mode resolution.
  let mode: ColorMode;
  if (inputs.interfaceStyle === "Light") mode = "light";
  else if (inputs.interfaceStyle === "Dark") mode = "dark";
  else mode = avgLum < 0.38 ? "dark" : "light";

  const personalityDark = inputs.personality.includes("Dark-mode first");
  if (inputs.interfaceStyle === "Auto" && personalityDark) mode = "dark";

  // Brand colors: score for saturation + mid-lightness "vividness".
  const vivid = [...cols].sort((a, b) => {
    const score = (c: ColorMeta) => (c.s / 100) * (1 - Math.abs(c.l - 55) / 100);
    return score(b) - score(a);
  });
  const primary = vivid[0] ?? darkest;

  let secondary =
    vivid.find((c) => c.hex !== primary.hex && hueDistance(c.h, primary.h) > 22) ??
    vivid.find((c) => c.hex !== primary.hex) ??
    { ...primary, hex: lighten(primary.hex, 12) };

  const bySat = [...cols].sort((a, b) => b.s - a.s);
  let accent =
    bySat.find(
      (c) => c.hex !== primary.hex && c.hex !== secondary.hex && c.s >= 30,
    ) ??
    bySat.find((c) => c.hex !== primary.hex && c.hex !== secondary.hex) ??
    { ...primary, hex: lighten(primary.hex, 18) };

  if (palette.colors.length < 4) {
    limitations.push(
      `This palette only has ${palette.colors.length} colors, so surfaces, borders and states were derived by generating tints, shades and hue-matched signals from the base colors.`,
    );
  }

  // Surfaces + text anchored to the chosen mode.
  let bgBase: string;
  let bgElevated: string;
  let surface: string;
  let surfaceHover: string;
  let textPrimary: string;

  if (mode === "dark") {
    bgBase = darkest.l > 16 ? hslToHex(darkest.h, Math.min(darkest.s, 40), 9) : darkest.hex;
    bgElevated = lighten(bgBase, 5);
    surface = lighten(bgBase, 8);
    surfaceHover = lighten(bgBase, 12);
    textPrimary =
      getContrastRatio(lightest.hex, bgBase) >= 7 ? lightest.hex : "#F8FAFC";
  } else {
    bgBase = lightest.l < 92 ? hslToHex(lightest.h, Math.min(lightest.s, 30), 97) : lightest.hex;
    bgElevated = "#FFFFFF";
    surface = "#FFFFFF";
    surfaceHover = darken(bgBase, 3);
    textPrimary =
      getContrastRatio(darkest.hex, bgBase) >= 7 ? darkest.hex : "#0F172A";
  }

  const textSecondary = mixHex(textPrimary, bgBase, 0.28);
  const textMuted = mixHex(textPrimary, bgBase, 0.48);
  const borderSubtle = mixHex(surface, textPrimary, 0.1);
  const borderStrong = mixHex(surface, textPrimary, 0.24);
  const disabled = mixHex(textMuted, bgBase, 0.5);
  const overlay = withAlpha(mode === "dark" ? "#020617" : "#0F172A", 0.6);

  // Link: prefer a brand color that reads on the base background, then
  // guarantee legibility by nudging lightness until it clears AA.
  const linkCandidates = [accent.hex, primary.hex, secondary.hex];
  const link = ensureContrast(
    linkCandidates.find((c) => getContrastRatio(c, bgBase) >= 4.5) ?? accent.hex,
    bgBase,
    mode,
    4.5,
  );

  // Ensure a primary that a button label can sit on with real contrast.
  const primaryHex = primary.hex;
  const focusRing = accent.hex;

  const success = deriveState(cols, "success", mode, avgSat);
  const warning = deriveState(cols, "warning", mode, avgSat);
  const error = deriveState(cols, "error", mode, avgSat);
  const info = deriveState(cols, "info", mode, avgSat);

  if (getContrastRatio(textPrimary, bgBase) < 7) {
    limitations.push(
      "Primary text falls slightly short of AAA on the base background — consider a darker ink or lighter surface for long-form reading.",
    );
  }

  const roles: RoleSpec[] = [
    // Brand
    d("brand-primary", "Brand Primary", "Brand", primaryHex, "Main brand color for primary actions, active nav and emphasis.", primary === vivid[0] ? false : true),
    d("brand-secondary", "Brand Secondary", "Brand", secondary.hex, "Supporting brand color for secondary actions and accents.", false),
    d("brand-accent", "Brand Accent", "Brand", accent.hex, "High-energy accent for highlights, badges and focus.", false),
    d("on-brand", "On Brand", "Brand", readableOn(primaryHex), "Text/icon color that sits legibly on the brand primary.", true),
    // Surfaces
    d("bg-base", "Background Base", "Surface", bgBase, "App canvas / deepest background layer.", true),
    d("bg-elevated", "Background Elevated", "Surface", bgElevated, "Raised background for panels and app shell.", true),
    d("surface", "Surface", "Surface", surface, "Cards, sheets and menu surfaces.", true),
    d("surface-hover", "Surface Hover", "Surface", surfaceHover, "Hover / pressed state for interactive surfaces.", true),
    // Text
    d("text-primary", "Text Primary", "Text", textPrimary, "Headings and primary body copy.", true),
    d("text-secondary", "Text Secondary", "Text", textSecondary, "Secondary copy, labels and captions.", true),
    d("text-muted", "Text Muted", "Text", textMuted, "Placeholder, metadata and de-emphasized text.", true),
    d("link", "Link", "Text", link, "Inline links and navigational text.", true),
    // Lines
    d("border-subtle", "Border Subtle", "Line", borderSubtle, "Hairline dividers and default input borders.", true),
    d("border-strong", "Border Strong", "Line", borderStrong, "Emphasized borders and focused field outlines.", true),
    d("focus-ring", "Focus Ring", "Line", focusRing, "Keyboard focus outline for accessibility.", false),
    // States
    d("state-success", "Success", "State", success.hex, "Positive confirmations and healthy status.", success.derived),
    d("state-warning", "Warning", "State", warning.hex, "Cautions and pending states.", warning.derived),
    d("state-error", "Error", "State", error.hex, "Destructive actions and error messaging.", error.derived),
    d("state-info", "Info", "State", info.hex, "Neutral informational messaging.", info.derived),
    // Utility
    d("disabled", "Disabled", "Utility", disabled, "Disabled controls and inert elements.", true),
    d("overlay", "Overlay", "Utility", overlay, "Scrims behind modals and drawers.", true),
  ];

  return { roles, mode, limitations };
}

function d(
  key: string,
  label: string,
  group: RoleGroup,
  hex: string,
  description: string,
  derived: boolean,
): RoleSpec {
  return { key, label, group, hex: normalizeHexKeepAlpha(hex), description, derived };
}

function normalizeHexKeepAlpha(hex: string): string {
  const c = hex.replace(/^#/, "");
  if (c.length === 8) return "#" + c.toUpperCase();
  return normalizeHex(hex);
}

/* ------------------------------------------------------------------ *
 * Narrative + guidance (deterministic templates)                     *
 * ------------------------------------------------------------------ */

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

function buildFoundation(
  palette: GeneratePalette,
  inputs: BrandInputs,
  mode: ColorMode,
): BrandSystem["foundation"] {
  const temp = temperature(palette);
  const personality =
    inputs.personality.length > 0 ? inputs.personality : ["Modern"];
  const persText = personality.slice(0, 3).join(", ").toLowerCase();
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
    strategy: `Color strategy: one dominant brand hue, one supporting hue and a single accent, layered over a neutral surface ramp. Roughly 60% neutral surfaces, 30% brand, 10% accent keeps ${inputs.platform.toLowerCase()} interfaces legible and on-brand.`,
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
        { label: "Hover", token: "--brand-secondary" },
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
        { label: "Label", token: "--on-brand" },
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
        { label: "Label", token: "--on-brand" },
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
        { label: "Trend up", token: "--state-success" },
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
      intent: "Toasts and inline alerts.",
      usage: [
        { label: "Success", token: "--state-success" },
        { label: "Warning", token: "--state-warning" },
        { label: "Error", token: "--state-error" },
        { label: "Info", token: "--state-info" },
      ],
    },
  ];
}

function buildUsage(inputs: BrandInputs, mode: ColorMode): UsageGuide[] {
  return [
    { area: "App shell", guidance: `Use --bg-base for the outermost canvas and --bg-elevated for the shell/sidebar to create a clear ${mode} elevation hierarchy.` },
    { area: "Sidebar", guidance: "Idle items use --text-secondary; the active item uses --brand-primary with an --on-brand icon and a subtle --surface-hover background." },
    { area: "Header", guidance: "Keep the header on --bg-elevated with a --border-subtle bottom divider; place primary actions using --brand-primary." },
    { area: "Dashboard cards", guidance: "Render cards on --surface with --border-subtle. Reserve --brand-accent for the single most important metric." },
    { area: "Buttons", guidance: "Primary → --brand-primary/--on-brand, secondary → --surface/--border-strong, destructive → --state-error." },
    { area: "Forms & inputs", guidance: "Inputs sit on --bg-base with --border-subtle, shifting to --border-strong and a --focus-ring on focus. Placeholders use --text-muted." },
    { area: "Tables", guidance: "Column headers use --text-secondary, rows divide with --border-subtle and hover with --surface-hover." },
    { area: "Charts & data-viz", guidance: "Sequence brand → secondary → accent → states for categorical series; verify adjacent series clear 3:1 against each other." },
    { area: "Empty states", guidance: "Lean on --text-muted illustrations and a single --brand-primary call to action to guide the next step." },
    { area: "Alerts", guidance: "Tint the surface with the matching state color at low alpha and use the solid state color for the icon and border." },
    { area: "Modals", guidance: "Dim the page with --overlay, float the dialog on --bg-elevated with --border-subtle." },
    { area: "Navigation", guidance: "Only one active color at a time — --brand-primary — so wayfinding stays unambiguous." },
    { area: "Hero sections", guidance: `For ${inputs.productType.toLowerCase()} marketing, pair a --text-primary headline with a --brand-primary CTA and an --brand-accent highlight.` },
    { area: "Pricing pages", guidance: "Highlight the recommended tier with a --brand-primary border and a --brand-accent badge; keep other tiers on --surface." },
    { area: "Onboarding", guidance: "Progress indicators use --brand-primary; completed steps use --state-success." },
    { area: "Settings", guidance: "Group controls on --surface cards; destructive zones use --state-error text and borders." },
    { area: "Dark mode", guidance: mode === "dark" ? "This system is already tuned dark-first — brand colors glow against --bg-base." : "Invert the surface ramp (deep --bg-base, lighter surfaces) and re-check contrast when shipping a dark theme." },
    { area: "Light mode", guidance: mode === "light" ? "This system is tuned light-first with crisp neutral surfaces." : "Provide a light counterpart by flipping the surface ramp and darkening text roles." },
  ];
}

/* ------------------------------------------------------------------ *
 * Accessibility review                                               *
 * ------------------------------------------------------------------ */

function buildAccessibility(roles: Record<string, string>): BrandSystem["accessibility"] {
  const pair = (label: string, fg: string, bg: string): ContrastPair => {
    const ratio = getContrastRatio(fg, bg);
    return { label, fg, bg, ratio, grade: contrastGrade(ratio), pass: ratio >= 4.5 };
  };

  const checks: ContrastPair[] = [
    pair("Primary text on base", roles["text-primary"], roles["bg-base"]),
    pair("Primary text on surface", roles["text-primary"], roles["surface"]),
    pair("Secondary text on surface", roles["text-secondary"], roles["surface"]),
    pair("Muted text on surface", roles["text-muted"], roles["surface"]),
    pair("Button label on primary", roles["on-brand"], roles["brand-primary"]),
    pair("Badge label on accent", roles["on-brand"], roles["brand-accent"]),
    pair("Link on base", roles["link"], roles["bg-base"]),
    pair("Success on surface", roles["state-success"], roles["surface"]),
    pair("Warning on surface", roles["state-warning"], roles["surface"]),
    pair("Error on surface", roles["state-error"], roles["surface"]),
    pair("Info on surface", roles["state-info"], roles["surface"]),
  ];

  const safe = checks.filter((c) => c.pass);
  const unsafe = checks.filter((c) => !c.pass);
  const warnings: string[] = [];

  for (const u of unsafe) {
    warnings.push(
      `${u.label} is ${u.ratio.toFixed(2)}:1 (needs 4.5:1). ${
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
  const { roles: rolesList, mode, limitations } = deriveRoles(palette, inputs);
  const roles: Record<string, string> = {};
  for (const r of rolesList) roles[r.key] = r.hex;

  const accessibility = buildAccessibility(roles);
  if (accessibility.score < 100) {
    limitations.push(
      `${accessibility.unsafe.length} of ${
        accessibility.safe.length + accessibility.unsafe.length
      } critical color pairs fall below WCAG AA — see the Accessibility review for exact fixes.`,
    );
  }

  return {
    paletteId: palette.id,
    paletteName: palette.name,
    category: palette.category ?? "Uncategorized",
    inputs,
    mode,
    roles,
    rolesList: rolesList as SemanticRole[],
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
  return `${system.inputs.appName} — Brand System\nGenerated by Palattes from the “${system.paletteName}” palette\nMode: ${system.mode}`;
}

export function exportCss(system: BrandSystem): string {
  const lines = system.rolesList
    .map((r) => `  --${r.key}: ${r.hex.toLowerCase()};`)
    .join("\n");
  const header = tokenComment(system)
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
  return `:root {\n  /*\n${header}\n  */\n${lines}\n}`;
}

export function exportScss(system: BrandSystem): string {
  const vars = system.rolesList
    .map((r) => `$${r.key}: ${r.hex.toLowerCase()};`)
    .join("\n");
  const map = system.rolesList
    .map((r) => `  "${r.key}": ${r.hex.toLowerCase()},`)
    .join("\n");
  const header = tokenComment(system)
    .split("\n")
    .map((l) => `// ${l}`)
    .join("\n");
  return `${header}\n\n/* Brand tokens */\n${vars}\n\n/* Brand map */\n$brand-system: (\n${map}\n);`;
}

export function exportJson(system: BrandSystem): string {
  const tokens: Record<string, { value: string; group: string; role: string }> = {};
  for (const r of system.rolesList) {
    tokens[r.key] = { value: r.hex.toLowerCase(), group: r.group, role: r.label };
  }
  return JSON.stringify(
    {
      name: `${system.inputs.appName} Brand System`,
      palette: system.paletteName,
      mode: system.mode,
      generatedBy: "Palattes",
      tokens,
    },
    null,
    2,
  );
}

export function exportMarkdown(system: BrandSystem): string {
  const { inputs, foundation, rolesList, usage, components, accessibility, limitations } =
    system;
  const rolesTable = rolesList
    .map((r) => `| ${r.label} | \`--${r.key}\` | \`${r.hex.toLowerCase()}\` | ${r.derived ? "derived" : "palette"} |`)
    .join("\n");
  const usageList = usage.map((u) => `- **${u.area}** — ${u.guidance}`).join("\n");
  const compList = components
    .map(
      (c) =>
        `### ${c.name}\n${c.intent}\n\n${c.usage
          .map((u) => `- ${u.label}: \`${u.token}\``)
          .join("\n")}`,
    )
    .join("\n\n");
  const a11ySafe = accessibility.safe
    .map((p) => `- ✅ ${p.label} — ${p.ratio.toFixed(2)}:1 (${p.grade})`)
    .join("\n");
  const a11yUnsafe =
    accessibility.unsafe.length > 0
      ? accessibility.unsafe
          .map((p) => `- ⚠️ ${p.label} — ${p.ratio.toFixed(2)}:1 (needs 4.5:1)`)
          .join("\n")
      : "- None — all critical pairs pass WCAG AA.";
  const limits =
    limitations.length > 0
      ? limitations.map((l) => `- ${l}`).join("\n")
      : "- None.";

  return `# ${inputs.appName} — Brand System

Generated by **Palattes** from the **${system.paletteName}** palette (${system.category}) · Mode: **${system.mode}**

## Brand Foundation
- **Positioning:** ${foundation.positioning}
- **Visual direction:** ${foundation.direction}
- **Personality:** ${foundation.personality}
- **Design language:** ${foundation.language}
- **Color strategy:** ${foundation.strategy}
- **What it communicates:** ${foundation.communicates}

## Semantic Color Roles
| Role | Token | Value | Source |
| --- | --- | --- | --- |
${rolesTable}

## UI Usage Guide
${usageList}

## Brand Components
${compList}

## Accessibility Review — Score ${accessibility.score}/100
**Safe pairings**
${a11ySafe}

**Needs attention**
${a11yUnsafe}

## Limitations
${limits}

---
_Tokens available as CSS, SCSS and JSON via the Palattes Brand System exporter._
`;
}
