import { Palette } from "@/types";

export type UISelection =
  "dashboard" | "social" | "landing" | "commerce" | "mobile" | "typography";

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
  dashboard:
    "Your palette applied to a real analytics dashboard — sidebar, stat cards, charts.",
  social:
    "Your palette on a social feed — post cards, avatars, and interactions.",
  landing: "Your palette across a marketing hero and feature grid.",
  commerce: "Your palette on product listings and a shopping cart.",
  mobile: "Your palette in a compact mobile app shell and navigation.",
  typography:
    "Your palette applied to headings, body copy, and links for readability.",
};

/** How a role's contrast should be judged. */
export type RoleKind =
  "surface" | "border" | "text" | "large" | "brand" | "state";

/** Semantic grouping used both for smart assignment and the Roles UI. */
export type RoleGroup = "Surfaces" | "Borders" | "Text" | "Brand" | "States";

export interface RoleMeta {
  name: string;
  group: RoleGroup;
  kind: RoleKind;
  /** 0-based index of the role this one is contrast-tested against. */
  compareIndex: number;
  /** Plain-language description of where the token is used. */
  description: string;
}

/**
 * Ordered role definitions. Index i maps to CSS var `--ui-color-${i + 1}`.
 * Order is load-bearing: scenarios and the mapping engine reference it by index.
 */
export const ROLE_META: RoleMeta[] = [
  {
    name: "Bg Canvas",
    group: "Surfaces",
    kind: "surface",
    compareIndex: 7,
    description: "The page background — the lowest layer everything sits on.",
  },
  {
    name: "Bg Surface",
    group: "Surfaces",
    kind: "surface",
    compareIndex: 7,
    description: "Cards, panels, and raised containers on top of the canvas.",
  },
  {
    name: "Bg Elevated",
    group: "Surfaces",
    kind: "surface",
    compareIndex: 7,
    description: "Popovers, dropdowns, and menus that float above surfaces.",
  },
  {
    name: "Bg Overlay",
    group: "Surfaces",
    kind: "surface",
    compareIndex: 7,
    description: "Scrims and modal backdrops behind dialogs and drawers.",
  },
  {
    name: "Border Subtle",
    group: "Borders",
    kind: "border",
    compareIndex: 0,
    description: "Hairline dividers and quiet card outlines.",
  },
  {
    name: "Border Strong",
    group: "Borders",
    kind: "border",
    compareIndex: 0,
    description: "Input outlines and emphasized separators.",
  },
  {
    name: "Text Muted",
    group: "Text",
    kind: "large",
    compareIndex: 0,
    description: "Secondary labels, captions, and placeholder text.",
  },
  {
    name: "Text Base",
    group: "Text",
    kind: "text",
    compareIndex: 0,
    description: "Default body copy — must stay readable on the canvas.",
  },
  {
    name: "Text Strong",
    group: "Text",
    kind: "text",
    compareIndex: 0,
    description: "Headings and high-emphasis text.",
  },
  {
    name: "Primary",
    group: "Brand",
    kind: "brand",
    compareIndex: 0,
    description: "Primary buttons and the main brand action color.",
  },
  {
    name: "Primary Hover",
    group: "Brand",
    kind: "brand",
    compareIndex: 0,
    description: "Hover / pressed state of the primary color.",
  },
  {
    name: "Secondary",
    group: "Brand",
    kind: "brand",
    compareIndex: 0,
    description: "Secondary buttons and supporting brand accents.",
  },
  {
    name: "Secondary Hover",
    group: "Brand",
    kind: "brand",
    compareIndex: 0,
    description: "Hover / pressed state of the secondary color.",
  },
  {
    name: "Accent",
    group: "Brand",
    kind: "brand",
    compareIndex: 0,
    description: "Highlights, badges, and decorative pops of color.",
  },
  {
    name: "Accent Soft",
    group: "Brand",
    kind: "brand",
    compareIndex: 0,
    description: "Tinted backgrounds behind accented content.",
  },
  {
    name: "Success",
    group: "States",
    kind: "state",
    compareIndex: 0,
    description: "Positive status — confirmations and healthy metrics.",
  },
  {
    name: "Warning",
    group: "States",
    kind: "state",
    compareIndex: 0,
    description: "Caution status — needs-attention messaging.",
  },
  {
    name: "Danger",
    group: "States",
    kind: "state",
    compareIndex: 0,
    description: "Errors, destructive actions, and failures.",
  },
  {
    name: "Info",
    group: "States",
    kind: "state",
    compareIndex: 0,
    description: "Neutral informational messaging.",
  },
  {
    name: "Link",
    group: "States",
    kind: "text",
    compareIndex: 0,
    description: "Inline hyperlinks — read as text, so held to text contrast.",
  },
  {
    name: "Focus Ring",
    group: "States",
    kind: "border",
    compareIndex: 0,
    description: "Keyboard focus outline around interactive elements.",
  },
];

export const DEFAULT_ROLES = ROLE_META.map((r) => r.name);

export const ROLE_COUNT = ROLE_META.length;

export const ROLE_GROUPS: { label: RoleGroup; range: number[] }[] = (() => {
  const groups: Record<string, number[]> = {};
  ROLE_META.forEach((r, i) => {
    (groups[r.group] ||= []).push(i);
  });
  return (
    ["Surfaces", "Borders", "Text", "Brand", "States"] as RoleGroup[]
  ).map((label) => ({ label, range: groups[label] ?? [] }));
})();
