"use client";

import { useCallback, useMemo, useState } from "react";
import {
  X,
  Sparkles,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Check,
  Eye,
  ShieldCheck,
  Code2,
  Layers,
} from "lucide-react";
import type { Palette } from "@/types";
import type { ColorMode } from "@/types/brand-system";
import { DEFAULT_INPUTS } from "@/types/brand-system";
import type {
  BrandComposition,
  RoleAssignment,
  SavedDesignSystem,
} from "@/types/design-system";
import {
  BRAND_ROLE_META,
  BRAND_ROLE_GROUPS,
  BRAND_ROLE_BY_KEY,
} from "@/utils/brand-roles";
import {
  seedComposition,
  composeDesignSystem,
  composeBrandSystem,
  compositionFromSaved,
} from "@/utils/brand-composer";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";
import { SemanticRoles } from "./semantic-roles";
import { AccessibilityReview } from "./accessibility-review";
import { TokenOutput } from "./token-output";
import { BrandPreview } from "./preview";

function norm(hex: string): string {
  const h = (hex || "").trim();
  return h.length > 7 && h.startsWith("#") ? h.slice(0, 7) : h;
}

interface Props {
  slug: string;
  projectName: string;
  palettes: Palette[];
  initial?: SavedDesignSystem;
  onSaved?: (s: SavedDesignSystem) => void;
  onClose: () => void;
}

export function BrandSystemComposer({
  slug,
  projectName,
  palettes,
  initial,
  onSaved,
  onClose,
}: Props) {
  const [comp, setComp] = useState<BrandComposition>(() =>
    initial ? compositionFromSaved(initial) : seedComposition(palettes),
  );
  const [mode, setMode] = useState<ColorMode>(initial?.mode ?? "light");
  const [name, setName] = useState(initial?.name ?? `${projectName} System`);
  const [savedId, setSavedId] = useState<string | null>(initial?.id ?? null);
  const [activeRole, setActiveRole] = useState<string>("brand-primary");
  const [swatchTab, setSwatchTab] = useState<string>("all");

  const inputs = useMemo(
    () => ({ ...DEFAULT_INPUTS, appName: name || projectName }),
    [name, projectName],
  );

  const ds = useMemo(
    () =>
      composeDesignSystem(comp, {
        id: savedId ?? undefined,
        name: name || projectName,
        mode,
        brandPalette: palettes
          .flatMap((p) => p.colors.map((c) => norm(c.hex)))
          .slice(0, 24),
      }),
    [comp, savedId, name, mode, palettes, projectName],
  );
  const bs = useMemo(
    () => composeBrandSystem(comp, ds, inputs),
    [comp, ds, inputs],
  );
  const tokens = ds.tokens.color[mode];

  const assign = useCallback(
    (role: string, a: RoleAssignment | null) => {
      setComp((prev) => {
        const next: BrandComposition = {
          light: { ...prev.light },
          dark: { ...prev.dark },
          chart: [...prev.chart],
        };
        const meta = BRAND_ROLE_BY_KEY[role];
        if (role.startsWith("chart-")) {
          const i = Number(role.slice(6)) - 1;
          if (a) {
            next.chart[i] = a;
            next.light[role] = a;
            next.dark[role] = a;
          }
        } else if (!a) {
          delete next.light[role];
          delete next.dark[role];
        } else if (meta?.modeless) {
          next.light[role] = a;
          next.dark[role] = a;
        } else {
          next[mode] = { ...next[mode], [role]: a };
        }
        return next;
      });
    },
    [mode],
  );

  const onSwatchClick = (
    hex: string,
    paletteId: string,
    colorName?: string,
  ) => {
    if (!activeRole) {
      showToast("Select a role first, then click a swatch.", "error");
      return;
    }
    assign(activeRole, {
      hex: norm(hex),
      paletteId,
      colorName,
      seeded: false,
    });
    playSound("click");
  };

  const onColorChange = (m: ColorMode, key: string, hex: string) => {
    setComp((prev) => ({
      light:
        m === "light"
          ? { ...prev.light, [key]: { hex: norm(hex), seeded: false } }
          : prev.light,
      dark:
        m === "dark"
          ? { ...prev.dark, [key]: { hex: norm(hex), seeded: false } }
          : prev.dark,
      chart: prev.chart,
    }));
  };

  const reseed = () => {
    setComp(seedComposition(palettes));
    playSound("click");
    showToast("Re-seeded from palettes");
  };

  const assignmentFor = (role: string): RoleAssignment | undefined => {
    if (role.startsWith("chart-") || BRAND_ROLE_BY_KEY[role]?.modeless) {
      return comp[mode][role] ?? comp.light[role] ?? comp.dark[role];
    }
    return comp[mode][role];
  };

  const save = async (asNew: boolean) => {
    const { saveDesignSystemAction } = await import("@/app/actions");
    const rec: SavedDesignSystem = {
      id: asNew ? "" : (savedId ?? ""),
      name: name.trim() || projectName,
      projectSlug: slug,
      inputs,
      tokens: ds.tokens,
      mode,
      composed: true,
      assignments: comp,
    };
    try {
      const saved = await saveDesignSystemAction(rec);
      setSavedId(saved.id);
      setName(saved.name);
      playSound("success");
      showToast(asNew ? "Saved as a new system" : "Brand system saved");
      onSaved?.(saved);
    } catch {
      showToast("Couldn't save the system.", "error");
    }
  };

  // Source palettes grouped by swatchType for the right-hand picker.
  const swatchGroups = useMemo(() => {
    const groups: Record<string, Palette[]> = {};
    for (const p of palettes) {
      const t = p.swatchType || "other";
      (groups[t] ??= []).push(p);
    }
    return groups;
  }, [palettes]);
  const swatchTabIds = useMemo(
    () => ["all", ...Object.keys(swatchGroups).sort()],
    [swatchGroups],
  );
  const shownPalettes =
    swatchTab === "all" ? palettes : (swatchGroups[swatchTab] ?? []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white/80 px-5 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-56 rounded-lg border border-transparent bg-transparent text-base font-black tracking-tight text-gray-900 hover:border-gray-200 focus:border-indigo-400 focus:outline-none dark:text-white dark:hover:border-slate-700"
                aria-label="Brand system name"
              />
              <p className="text-[11px] font-medium text-gray-400">
                Composing {projectName}&rsquo;s brand system from its palettes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Light/dark */}
            <div className="flex items-center rounded-xl border border-gray-200 p-0.5 dark:border-slate-700">
              {(["light", "dark"] as ColorMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                    mode === m
                      ? "bg-indigo-500 text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {m === "light" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={reseed}
              title="Re-seed all roles from the project's palettes"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-bold text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Re-seed</span>
            </button>
            <button
              onClick={() => save(false)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-indigo-600"
            >
              <Save className="h-3.5 w-3.5" />
              {savedId ? "Update" : "Save"}
            </button>
            {savedId && (
              <button
                onClick={() => save(true)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-bold text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-800"
              >
                Save as new
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:text-gray-900 dark:bg-slate-800 dark:hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: roles */}
          <div className="border-b border-gray-100 p-5 dark:border-slate-800 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Roles
              </h3>
              <span className="text-[11px] text-gray-400">
                Select a role, then click a swatch on the right
              </span>
            </div>
            <div className="space-y-5">
              {BRAND_ROLE_GROUPS.map((group) => {
                const roles = BRAND_ROLE_META.filter((r) => r.group === group);
                if (!roles.length) return null;
                return (
                  <div key={group}>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {group}
                    </p>
                    <div className="space-y-1">
                      {roles.map((r) => {
                        const a = assignmentFor(r.key);
                        const hex = tokens[r.key] ?? "#000000";
                        const isActive = activeRole === r.key;
                        const isAuto = !a || a.seeded !== false;
                        return (
                          <div
                            key={r.key}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveRole(r.key)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setActiveRole(r.key);
                              }
                            }}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-2 py-1.5 transition-colors ${
                              isActive
                                ? "border-indigo-400 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-950/30"
                                : "border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <span
                              className="h-6 w-6 flex-shrink-0 rounded-md border border-black/10 shadow-sm"
                              style={{ backgroundColor: hex }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-gray-800 dark:text-gray-100">
                                {r.label}
                                {r.assign === "derived" && (
                                  <span className="ml-1.5 rounded bg-amber-100 px-1 text-[9px] font-black text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                    auto
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-[10px] text-gray-400">
                                {a?.colorName
                                  ? a.colorName
                                  : isAuto
                                    ? "derived"
                                    : "custom"}{" "}
                                · {hex}
                              </p>
                            </div>
                            <input
                              type="color"
                              value={
                                /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000"
                              }
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                assign(r.key, {
                                  hex: e.target.value,
                                  seeded: false,
                                })
                              }
                              title={`Set ${r.label} directly`}
                              className="h-6 w-6 flex-shrink-0 cursor-pointer rounded border border-gray-200 bg-transparent dark:border-slate-700"
                            />
                            {isActive && (
                              <Check className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: source swatches */}
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Source swatches
              </h3>
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-black text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                {BRAND_ROLE_BY_KEY[activeRole]?.label ?? activeRole}
              </span>
            </div>
            {swatchTabIds.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {swatchTabIds.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSwatchTab(t)}
                    className={`rounded-md border px-2 py-1 text-[10px] font-black transition-colors ${
                      swatchTab === t
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                        : "border-gray-200 text-gray-500 hover:border-indigo-300 dark:border-slate-800 dark:text-gray-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
              {shownPalettes.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  No palettes in this group.
                </p>
              ) : (
                shownPalettes.map((p) => (
                  <div key={p.id}>
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                      {p.name}
                      {p.swatchType && (
                        <span className="rounded bg-gray-100 px-1 text-[9px] font-black text-gray-500 dark:bg-slate-800">
                          {p.swatchType}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.colors.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => onSwatchClick(c.hex, p.id, c.name)}
                          title={`${c.name} · ${norm(c.hex)} → ${BRAND_ROLE_BY_KEY[activeRole]?.label ?? activeRole}`}
                          className="h-7 w-7 rounded-md border border-black/10 shadow-sm transition-transform hover:scale-110 hover:ring-2 hover:ring-indigo-400"
                          style={{ backgroundColor: c.hex }}
                          aria-label={`Assign ${c.name} to ${activeRole}`}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live output: preview / a11y / roles / export */}
        <div className="space-y-8 border-t border-gray-100 p-5 dark:border-slate-800 sm:p-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Preview
              </h3>
            </div>
            <BrandPreview designSystem={ds} onColorChange={onColorChange} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Semantic roles
              </h3>
            </div>
            <SemanticRoles system={bs} overrides={tokens} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-500" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Accessibility
              </h3>
            </div>
            <AccessibilityReview system={bs} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Export
              </h3>
            </div>
            <TokenOutput system={bs} designSystem={ds} />
          </section>
        </div>
      </div>
    </div>
  );
}
