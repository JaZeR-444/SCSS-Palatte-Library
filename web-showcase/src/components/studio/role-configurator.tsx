"use client";

import { useMemo, useState } from "react";
import { useStudio } from "./studio-context";
import { ROLE_META, ROLE_GROUPS, RoleKind } from "@/types/studio";
import {
  getContrastRatio,
  wcagGrade,
  bestContrastColor,
  SurfaceKind,
  WcagGrade,
} from "@/utils/contrast-utils";
import { showToast } from "@/utils/toast";
import {
  GripVertical,
  Wand2,
  RotateCcw,
  ChevronDown,
  Check,
  AlertTriangle,
  X,
  Replace,
} from "lucide-react";

function kindToSurface(kind: RoleKind): SurfaceKind {
  if (kind === "text" || kind === "surface") return "text";
  if (kind === "large") return "large";
  return "ui"; // border, brand, state
}

const LEVEL_STYLES: Record<WcagGrade["level"], string> = {
  AAA: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  AA: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  "AA-Large":
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  UI: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Fail: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40",
};

function GradeIcon({ tone }: { tone: WcagGrade["tone"] }) {
  if (tone === "pass") return <Check className="h-2.5 w-2.5" />;
  if (tone === "warn") return <AlertTriangle className="h-2.5 w-2.5" />;
  return <X className="h-2.5 w-2.5" />;
}

export function RoleConfigurator() {
  const {
    roleMapping,
    updateRole,
    selectedPalette,
    swapRoles,
    resetRoles,
    hasRoleEdits,
  } = useStudio();
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [menuIdx, setMenuIdx] = useState<number | null>(null);

  // Groups start expanded; users collapse to declutter on small screens.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const failureCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ROLE_GROUPS.forEach((g) => {
      counts[g.label] = g.range.reduce((n, i) => {
        const cur = roleMapping[`--ui-color-${i + 1}`];
        const cmp = roleMapping[`--ui-color-${ROLE_META[i].compareIndex + 1}`];
        if (!cur || !cmp) return n;
        const pass = wcagGrade(
          getContrastRatio(cur, cmp),
          kindToSurface(ROLE_META[i].kind),
        ).pass;
        return pass ? n : n + 1;
      }, 0);
    });
    return counts;
  }, [roleMapping]);

  const totalFailures = Object.values(failureCounts).reduce((a, b) => a + b, 0);

  if (!selectedPalette) return null;

  return (
    <div id="roles" className="scroll-mt-28 flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
            Color Roles
          </h3>
          <p className="mt-0.5 max-w-md text-[11px] text-gray-400">
            Every color mapped to a design-system token. Reassign with the swap
            menu, fine-tune the swatch, or auto-fix low-contrast pairings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalFailures > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-500">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {totalFailures} to fix
            </span>
          )}
          {hasRoleEdits && (
            <button
              type="button"
              onClick={() => {
                resetRoles();
                showToast("Roles reset to smart defaults");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-400"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* WCAG legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-[9px] font-bold text-gray-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-gray-400">
        <span className="uppercase tracking-widest text-gray-400">
          Contrast
        </span>
        <LegendChip cls={LEVEL_STYLES.AAA} label="AAA — best" />
        <LegendChip cls={LEVEL_STYLES.AA} label="AA — passes" />
        <LegendChip
          cls={LEVEL_STYLES["AA-Large"]}
          label="AA Lg — large text only"
        />
        <LegendChip cls={LEVEL_STYLES.Fail} label="Fail — below minimum" />
      </div>

      <div className="space-y-3">
        {ROLE_GROUPS.map((group) => {
          const isCollapsed = collapsed[group.label];
          const fails = failureCounts[group.label] ?? 0;
          return (
            <section
              key={group.label}
              className="rounded-2xl border border-gray-100 dark:border-slate-800"
            >
              <button
                type="button"
                onClick={() =>
                  setCollapsed((c) => ({
                    ...c,
                    [group.label]: !c[group.label],
                  }))
                }
                aria-expanded={!isCollapsed}
                className={`flex w-full items-center gap-3 bg-gray-50/60 px-3 py-2.5 text-left transition-colors hover:bg-gray-100/70 dark:bg-slate-950/30 dark:hover:bg-slate-800/50 ${
                  isCollapsed ? "rounded-2xl" : "rounded-t-2xl"
                }`}
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
                  {group.label}
                </h4>
                {fails > 0 ? (
                  <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[9px] font-black text-red-500">
                    {fails} fail
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-500">
                    <Check className="h-2.5 w-2.5" /> all pass
                  </span>
                )}
                <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.range.map((index) => {
                    const meta = ROLE_META[index];
                    const varName = `--ui-color-${index + 1}`;
                    const currentHex = roleMapping[varName];
                    const compareVar = `--ui-color-${meta.compareIndex + 1}`;
                    const comparisonColor = roleMapping[compareVar];
                    const comparisonRole = ROLE_META[meta.compareIndex].name;

                    const ratio =
                      currentHex && comparisonColor
                        ? getContrastRatio(currentHex, comparisonColor)
                        : 1;
                    const grade = wcagGrade(ratio, kindToSurface(meta.kind));

                    const proposal =
                      !grade.pass && comparisonColor
                        ? bestContrastColor(
                            selectedPalette.colors.map((c) => c.hex),
                            comparisonColor,
                            { min: 4.5, exclude: currentHex },
                          )
                        : null;
                    const canFix =
                      proposal &&
                      proposal.hex.toLowerCase() !==
                        (currentHex || "").slice(0, 7).toLowerCase() &&
                      proposal.ratio > ratio;

                    const isDragSource = dragFromIdx === index;
                    const isDragTarget = dragOverIdx === index;

                    const handleFix = () => {
                      if (!proposal) return;
                      updateRole(varName, proposal.hex);
                      showToast(
                        `${meta.name}: ${currentHex?.slice(0, 7)} → ${proposal.hex} (${proposal.ratio.toFixed(1)}:1 vs ${comparisonRole})`,
                      );
                    };

                    return (
                      <div
                        key={varName}
                        draggable
                        onDragStart={() => setDragFromIdx(index)}
                        onDragEnd={() => {
                          setDragFromIdx(null);
                          setDragOverIdx(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverIdx(index);
                        }}
                        onDragLeave={() => setDragOverIdx(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragFromIdx !== null && dragFromIdx !== index) {
                            swapRoles(dragFromIdx + 1, index + 1);
                            showToast(
                              `Swapped ${ROLE_META[dragFromIdx].name} with ${meta.name}`,
                            );
                          }
                          setDragFromIdx(null);
                          setDragOverIdx(null);
                        }}
                        className={`relative flex items-center gap-2.5 rounded-2xl border bg-gray-50 p-3 transition-all select-none dark:bg-slate-800/50 ${
                          isDragTarget
                            ? "border-indigo-500 ring-2 ring-indigo-500/20"
                            : "border-gray-100 dark:border-slate-800"
                        } ${isDragSource ? "opacity-40" : ""}`}
                      >
                        <GripVertical
                          className="h-3.5 w-3.5 flex-shrink-0 cursor-grab text-gray-300 active:cursor-grabbing dark:text-gray-600"
                          aria-hidden
                        />

                        {/* Swatch + native color override */}
                        <div className="group relative flex-shrink-0">
                          <input
                            type="color"
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            value={(currentHex || "#000000").slice(0, 7)}
                            onChange={(e) =>
                              updateRole(varName, e.target.value)
                            }
                            aria-label={`Fine-tune ${meta.name}`}
                          />
                          <div
                            className="h-10 w-10 rounded-xl border border-white shadow-sm transition-transform group-hover:scale-105 dark:border-slate-700"
                            style={{ backgroundColor: currentHex }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-[10px] font-black uppercase text-gray-600 dark:text-gray-300"
                            title={`${meta.name} — ${meta.description}`}
                          >
                            {meta.name}
                          </p>
                          <p className="font-mono text-[11px] uppercase text-gray-500 dark:text-gray-400">
                            {currentHex?.slice(0, 7)}
                          </p>
                          <p className="mt-0.5 truncate text-[9px] leading-tight text-gray-400 dark:text-gray-500">
                            {meta.description}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <div
                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${LEVEL_STYLES[grade.level]}`}
                            title={`${ratio.toFixed(1)}:1 vs ${comparisonRole} — ${
                              grade.pass ? "passes" : "below minimum"
                            }`}
                          >
                            <GradeIcon tone={grade.tone} />
                            {ratio.toFixed(1)} {grade.label}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuIdx(menuIdx === index ? null : index)
                              }
                              className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                              title={`Reassign ${meta.name} to another palette color`}
                              aria-label={`Reassign ${meta.name}`}
                            >
                              <Replace className="h-3 w-3" />
                            </button>
                            {canFix && (
                              <button
                                type="button"
                                onClick={handleFix}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                                title={`Fix: set to ${proposal!.hex} (${proposal!.ratio.toFixed(1)}:1 vs ${comparisonRole})`}
                              >
                                <Wand2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tap-to-reassign menu (keyboard/touch accessible) */}
                        {menuIdx === index && (
                          <div className="absolute right-2 top-full z-30 mt-1 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                            <p className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-gray-400">
                              Set {meta.name} to
                            </p>
                            <div className="max-h-52 space-y-0.5 overflow-y-auto subtle-scrollbar">
                              {selectedPalette.colors.map((c) => {
                                const r = comparisonColor
                                  ? getContrastRatio(c.hex, comparisonColor)
                                  : 1;
                                const g = wcagGrade(
                                  r,
                                  kindToSurface(meta.kind),
                                );
                                const active =
                                  (currentHex || "")
                                    .slice(0, 7)
                                    .toLowerCase() ===
                                  c.hex.slice(0, 7).toLowerCase();
                                return (
                                  <button
                                    key={c.hex + c.name}
                                    type="button"
                                    onClick={() => {
                                      updateRole(varName, c.hex);
                                      setMenuIdx(null);
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 ${
                                      active
                                        ? "bg-indigo-50 dark:bg-indigo-950/40"
                                        : ""
                                    }`}
                                  >
                                    <span
                                      className="h-5 w-5 flex-shrink-0 rounded-md border border-black/10"
                                      style={{ backgroundColor: c.hex }}
                                    />
                                    <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-gray-700 dark:text-gray-200">
                                      {c.name}
                                    </span>
                                    <span
                                      className={`rounded px-1 py-0.5 text-[8px] font-black ${LEVEL_STYLES[g.level]}`}
                                    >
                                      {g.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LegendChip({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-sm border ${cls}`} />
      {label}
    </span>
  );
}
