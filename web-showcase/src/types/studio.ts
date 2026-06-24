import { Palette } from "@/types";

export type UISelection = "dashboard" | "social" | "landing" | "commerce" | "mobile" | "typography";

export interface StudioState {
  isOpen: boolean;
  selectedPalette: Palette | null;
  activeScenario: UISelection;
  roleMapping: Record<string, string>;
  recents: string[];
  zoom: number;
  heatmapActive: boolean;
  visionFilter: string;
}

export const SCENARIO_DESCRIPTIONS: Record<UISelection, string> = {
  dashboard: "Multi-layout analytics and system monitoring interfaces.",
  social: "Social media post cards and interaction previews.",
  landing: "Marketing hero sections and feature grids.",
  commerce: "Product listings and shopping cart UI.",
  mobile: "Compact mobile app shells and navigation.",
  typography: "In-depth readability and document hierarchy lab.",
};

export const DEFAULT_ROLES = [
  "Brand Primary",
  "Accent Secondary",
  "Deep Background",
  "Card Surface",
  "Subtle Border",
  "Primary Text",
  "Muted Text",
  "Success State",
  "Warning State",
  "Danger State",
];
