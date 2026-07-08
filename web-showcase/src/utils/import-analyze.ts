/* ------------------------------------------------------------------ *
 * Static CSS analysis — reverse-engineer design decisions from the    *
 * raw HTML + stylesheet text of an existing site.                     *
 *                                                                    *
 * Pure + isomorphic (no DOM / Node APIs) so it runs on the server     *
 * inside the fetch action and is trivially unit-testable. It does NOT *
 * execute JS, so runtime CSS-in-JS styles won't be seen — callers     *
 * surface that limitation to users.                                   *
 * ------------------------------------------------------------------ */

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

function toHex(n: number): string {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(255 * f(0), 255 * f(8), 255 * f(4));
}

function hexRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** HSL saturation (0-100) of a #rrggbb — used to prefer chromatic colors. */
function chroma(hex: string): number {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return Math.round((l > 0.5 ? d / (2 - max - min) : d / (max + min)) * 100);
}

function dist(a: string, b: string): number {
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Collect every color literal (hex / rgb(a) / hsl(a)) in the text with an
 * occurrence count. Fully-transparent colors are skipped.
 */
export function collectColors(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (hex: string) => counts.set(hex, (counts.get(hex) ?? 0) + 1);

  // Hex (#rgb, #rgba, #rrggbb, #rrggbbaa)
  for (const m of text.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    let c = m[1];
    if (c.length === 4 || c.length === 8) {
      // has alpha as last 1 or 2 chars
      const alpha = c.length === 4 ? c[3] : c.slice(6, 8);
      if (/^0+$/.test(alpha)) continue; // fully transparent
      c = c.length === 4 ? c.slice(0, 3) : c.slice(0, 6);
    }
    if (c.length === 3)
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    if (c.length !== 6) continue;
    add(`#${c.toUpperCase()}`);
  }

  // rgb() / rgba()
  for (const m of text.matchAll(
    /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)/gi,
  )) {
    const a = m[4];
    if (a !== undefined) {
      const av = a.endsWith("%") ? parseFloat(a) / 100 : parseFloat(a);
      if (av === 0) continue;
    }
    add(rgbToHex(+m[1], +m[2], +m[3]));
  }

  // hsl() / hsla()
  for (const m of text.matchAll(
    /hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.%]+))?\s*\)/gi,
  )) {
    const a = m[4];
    if (a !== undefined) {
      const av = a.endsWith("%") ? parseFloat(a) / 100 : parseFloat(a);
      if (av === 0) continue;
    }
    add(hslToHex(+m[1], +m[2], +m[3]));
  }

  return counts;
}

/** Rank colors by frequency, dedupe near-identical, and guarantee some hue. */
export function rankColors(counts: Map<string, number>, max = 8): string[] {
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([h]) => h);
  const picked: string[] = [];
  const tryAdd = (hex: string) => {
    if (picked.length >= max) return;
    if (picked.some((p) => dist(p, hex) < 24)) return; // too close to an existing pick
    picked.push(hex);
  };
  for (const hex of sorted) tryAdd(hex);
  // Ensure at least a couple of chromatic colors lead the set for brand use.
  const chromatic = sorted.filter((h) => chroma(h) >= 25);
  if (!picked.some((h) => chroma(h) >= 25) && chromatic.length) {
    picked.unshift(...chromatic.slice(0, 2));
  }
  return picked.slice(0, max);
}

/** Most common `font-family` declaration that names a real (non-generic) face. */
export function extractFontFamily(text: string): string | undefined {
  const GENERIC = new Set([
    "sans-serif",
    "serif",
    "monospace",
    "system-ui",
    "ui-sans-serif",
    "ui-serif",
    "ui-monospace",
    "inherit",
    "initial",
    "unset",
    "cursive",
    "fantasy",
    "ui-rounded",
    "revert",
  ]);
  const counts = new Map<string, number>();
  for (const m of text.matchAll(
    /font-family\s*:\s*([^;}{"']*(?:"[^"]*"[^;}{]*)*)/gi,
  )) {
    const value = m[1].trim().replace(/\s+/g, " ");
    if (!value) continue;
    const first = value
      .split(",")[0]
      .trim()
      .replace(/^["']|["']$/g, "")
      .toLowerCase();
    if (!first || GENERIC.has(first)) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best?.[0];
}

function pxValues(text: string, prop: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(
    new RegExp(`${prop}\\s*:\\s*([^;}{]+)`, "gi"),
  )) {
    const first = m[1].match(/(-?[\d.]+)px/);
    if (first) out.push(parseFloat(first[1]));
  }
  return out;
}

/** Representative corner radius — the most common non-trivial px value. */
export function extractRadius(text: string): number | undefined {
  const vals = pxValues(text, "border-radius").filter((v) => v > 0 && v <= 64);
  if (!vals.length) return undefined;
  const counts = new Map<number, number>();
  for (const v of vals) {
    const r = Math.round(v);
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Most common non-none box-shadow value. */
export function extractShadow(text: string): string | undefined {
  const counts = new Map<string, number>();
  for (const m of text.matchAll(/box-shadow\s*:\s*([^;}{]+)/gi)) {
    const v = m[1]
      .trim()
      .replace(/\s+/g, " ")
      .replace(/!important/gi, "")
      .trim();
    if (!v || /^none$/i.test(v) || /^inset none$/i.test(v)) continue;
    if (v.length > 120) continue; // skip layered monsters
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best?.[0];
}

export interface CssAnalysis {
  colors: string[];
  fontSans?: string;
  radius?: number;
  shadow?: string;
}

/** Run the full static analysis over combined HTML + CSS text. */
export function analyzeCss(text: string): CssAnalysis {
  return {
    colors: rankColors(collectColors(text)),
    fontSans: extractFontFamily(text),
    radius: extractRadius(text),
    shadow: extractShadow(text),
  };
}
