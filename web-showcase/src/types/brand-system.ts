import { Palette } from "@/types";

export type ColorMode = "light" | "dark";

/** User-defined description of the app/brand being designed. */
export interface BrandInputs {
  appName: string;
  productType: string;
  industry: string;
  audience: string;
  personality: string[];
  tone: string;
  useCase: string;
  platform: string;
  interfaceStyle: string; // "Light" | "Dark" | "Auto"
  notes: string;
}

/** A single semantic UI role mapped to a concrete color. */
export interface SemanticRole {
  /** CSS custom property name without the leading `--`. */
  key: string;
  label: string;
  group: RoleGroup;
  hex: string; // #rrggbb or #rrggbbaa
  description: string;
  /** True when the color was synthesized/derived rather than taken directly from the palette. */
  derived: boolean;
}

export type RoleGroup =
  | "Brand"
  | "Surface"
  | "Text"
  | "Line"
  | "State"
  | "Utility";

export interface ComponentGuide {
  name: string;
  intent: string;
  usage: { label: string; token: string }[];
}

export interface UsageGuide {
  area: string;
  guidance: string;
}

export interface ContrastPair {
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  grade: "AAA" | "AA" | "AA Large" | "Fail";
  pass: boolean;
}

export interface AccessibilityReport {
  safe: ContrastPair[];
  unsafe: ContrastPair[];
  warnings: string[];
  score: number; // 0-100 share of passing critical pairs
}

export interface BrandFoundation {
  positioning: string;
  direction: string;
  personality: string;
  language: string;
  strategy: string;
  communicates: string;
}

export interface BrandSystem {
  paletteId: string;
  paletteName: string;
  category: string;
  inputs: BrandInputs;
  mode: ColorMode;
  /** key -> hex map for quick token/style lookups. */
  roles: Record<string, string>;
  rolesList: SemanticRole[];
  foundation: BrandFoundation;
  components: ComponentGuide[];
  usage: UsageGuide[];
  accessibility: AccessibilityReport;
  limitations: string[];
}

export interface BrandSystemRecord {
  id: string;
  appName: string;
  paletteId: string;
  paletteName: string;
  mode: ColorMode;
  inputs: BrandInputs;
  savedAt: string;
}

export const PRODUCT_TYPES = [
  "SaaS Application",
  "Mobile App",
  "Dashboard",
  "AI Tool",
  "Music App",
  "Sales Tool",
  "CRM",
  "Creator Platform",
  "Ecommerce Brand",
  "Portfolio Site",
  "Internal Business Tool",
  "Marketing Site",
] as const;

export const PERSONALITY_OPTIONS = [
  "Premium",
  "Futuristic",
  "Minimal",
  "Bold",
  "Friendly",
  "Technical",
  "Creative",
  "Enterprise",
  "Luxury",
  "Playful",
  "Dark-mode first",
  "Data-heavy",
  "Conversion-focused",
] as const;

export const TONE_OPTIONS = [
  "Calm & trustworthy",
  "Energetic & vibrant",
  "Sleek & modern",
  "Warm & human",
  "Serious & precise",
  "Bold & confident",
] as const;

export const PLATFORM_OPTIONS = [
  "Web",
  "iOS",
  "Android",
  "Desktop",
  "Cross-platform",
] as const;

export const INTERFACE_STYLES = ["Auto", "Light", "Dark"] as const;

export const DEFAULT_INPUTS: BrandInputs = {
  appName: "Nimbus",
  productType: "SaaS Application",
  industry: "Productivity",
  audience: "Product teams and operators",
  personality: ["Premium", "Minimal"],
  tone: "Sleek & modern",
  useCase: "A workspace for planning and tracking product work",
  platform: "Web",
  interfaceStyle: "Auto",
  notes: "",
};

export type GeneratePalette = Pick<
  Palette,
  "id" | "name" | "category" | "colors" | "tags" | "description" | "count"
>;
