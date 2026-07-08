import type { RoleGroup } from "@/types/brand-system";

/**
 * The canonical brand-system role vocabulary — the single source of truth for
 * the 34 role keys produced by `buildRoleSet`/`deriveRoles` in
 * `@/utils/brand-system`. Kept as a tiny, dependency-free data module so both
 * server and client code (the in-project composer) can enumerate roles without
 * pulling in the full generator.
 *
 * `assign`:
 *   - "assignable" — the role expects a picked palette swatch (brand identity,
 *     base surfaces, state fills, chart series). ~19 roles.
 *   - "derived"    — the role is normally computed (contrast/blend) from the
 *     assignable ones; users may still override it.
 *
 * `modeless`: the role's value is conceptually mode-independent (brand / state /
 * chart identity), so it seeds light + dark identically (but may still diverge).
 *
 * Labels + descriptions are lifted verbatim from the `d(...)` calls in
 * `brand-system.ts`; a guard test locks this list to the generator's output.
 */

export type AssignKind = "assignable" | "derived";

export interface BrandRoleMeta {
  key: string;
  label: string;
  group: RoleGroup;
  description: string;
  assign: AssignKind;
  modeless?: boolean;
}

export const BRAND_ROLE_GROUPS: RoleGroup[] = [
  "Brand",
  "Surface",
  "Text",
  "Line",
  "State",
  "Utility",
  "Data-viz",
];

export const BRAND_ROLE_META: BrandRoleMeta[] = [
  // Brand
  {
    key: "brand-primary",
    label: "Brand Primary",
    group: "Brand",
    description:
      "Main brand color for primary actions, active nav and emphasis.",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "brand-primary-hover",
    label: "Brand Primary Hover",
    group: "Brand",
    description: "Hover / pressed state for the brand primary.",
    assign: "derived",
    modeless: true,
  },
  {
    key: "brand-secondary",
    label: "Brand Secondary",
    group: "Brand",
    description: "Supporting brand color for secondary accents.",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "brand-accent",
    label: "Brand Accent",
    group: "Brand",
    description: "High-energy accent for highlights, badges and focus.",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "on-brand",
    label: "On Brand",
    group: "Brand",
    description: "Text/icon color that sits legibly on the brand primary.",
    assign: "derived",
    modeless: true,
  },
  {
    key: "on-accent",
    label: "On Accent",
    group: "Brand",
    description: "Text/icon color that sits legibly on the brand accent.",
    assign: "derived",
    modeless: true,
  },
  // Surface
  {
    key: "bg-base",
    label: "Background Base",
    group: "Surface",
    description: "App canvas / deepest background layer.",
    assign: "assignable",
  },
  {
    key: "bg-elevated",
    label: "Background Elevated",
    group: "Surface",
    description: "Raised background for panels and app shell.",
    assign: "derived",
  },
  {
    key: "surface",
    label: "Surface",
    group: "Surface",
    description: "Cards, sheets and menu surfaces.",
    assign: "assignable",
  },
  {
    key: "surface-hover",
    label: "Surface Hover",
    group: "Surface",
    description: "Hover / pressed state for interactive surfaces.",
    assign: "derived",
  },
  // Text
  {
    key: "text-primary",
    label: "Text Primary",
    group: "Text",
    description: "Headings and primary body copy.",
    assign: "assignable",
  },
  {
    key: "text-secondary",
    label: "Text Secondary",
    group: "Text",
    description: "Secondary copy, labels and captions.",
    assign: "derived",
  },
  {
    key: "text-muted",
    label: "Text Muted",
    group: "Text",
    description: "Placeholder, metadata and de-emphasized text.",
    assign: "derived",
  },
  {
    key: "link",
    label: "Link",
    group: "Text",
    description: "Inline links and navigational text.",
    assign: "assignable",
    modeless: true,
  },
  // Line
  {
    key: "border-subtle",
    label: "Border Subtle",
    group: "Line",
    description: "Hairline dividers and default input borders.",
    assign: "derived",
  },
  {
    key: "border-strong",
    label: "Border Strong",
    group: "Line",
    description: "Emphasized borders and focused field outlines.",
    assign: "derived",
  },
  {
    key: "focus-ring",
    label: "Focus Ring",
    group: "Line",
    description: "Keyboard focus outline for accessibility.",
    assign: "derived",
    modeless: true,
  },
  // State
  {
    key: "state-success",
    label: "Success",
    group: "State",
    description: "Positive confirmations and healthy status (fills, icons).",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "state-warning",
    label: "Warning",
    group: "State",
    description: "Cautions and pending states (fills, icons).",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "state-error",
    label: "Error",
    group: "State",
    description: "Destructive actions and error messaging (fills, icons).",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "state-info",
    label: "Info",
    group: "State",
    description: "Neutral informational messaging (fills, icons).",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "state-success-text",
    label: "Success Text",
    group: "State",
    description: "AA-legible success text/icon on surfaces.",
    assign: "derived",
  },
  {
    key: "state-warning-text",
    label: "Warning Text",
    group: "State",
    description: "AA-legible warning text/icon on surfaces.",
    assign: "derived",
  },
  {
    key: "state-error-text",
    label: "Error Text",
    group: "State",
    description: "AA-legible error text/icon on surfaces.",
    assign: "derived",
  },
  {
    key: "state-info-text",
    label: "Info Text",
    group: "State",
    description: "AA-legible info text/icon on surfaces.",
    assign: "derived",
  },
  {
    key: "on-error",
    label: "On Error",
    group: "State",
    description: "Label color for solid destructive buttons.",
    assign: "derived",
    modeless: true,
  },
  // Utility
  {
    key: "disabled",
    label: "Disabled",
    group: "Utility",
    description: "Disabled controls and inert elements.",
    assign: "derived",
  },
  {
    key: "overlay",
    label: "Overlay",
    group: "Utility",
    description: "Scrims behind modals and drawers.",
    assign: "derived",
  },
  // Data-viz
  {
    key: "chart-1",
    label: "Chart 1",
    group: "Data-viz",
    description: "Categorical data-visualization series 1.",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "chart-2",
    label: "Chart 2",
    group: "Data-viz",
    description: "Categorical data-visualization series 2.",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "chart-3",
    label: "Chart 3",
    group: "Data-viz",
    description: "Categorical data-visualization series 3.",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "chart-4",
    label: "Chart 4",
    group: "Data-viz",
    description: "Categorical data-visualization series 4.",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "chart-5",
    label: "Chart 5",
    group: "Data-viz",
    description: "Categorical data-visualization series 5.",
    assign: "assignable",
    modeless: true,
  },
  {
    key: "chart-6",
    label: "Chart 6",
    group: "Data-viz",
    description: "Categorical data-visualization series 6.",
    assign: "assignable",
    modeless: true,
  },
];

/** Fast key → metadata lookup. */
export const BRAND_ROLE_BY_KEY: Record<string, BrandRoleMeta> =
  Object.fromEntries(BRAND_ROLE_META.map((r) => [r.key, r]));

/** Roles a user picks a swatch for (the rest are derived/overridable). */
export const ASSIGNABLE_ROLES = BRAND_ROLE_META.filter(
  (r) => r.assign === "assignable",
);

/** All role keys, in canonical (grouped) order. */
export const BRAND_ROLE_KEYS = BRAND_ROLE_META.map((r) => r.key);
