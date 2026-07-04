"use client";

import { useState } from "react";
import { useStudio } from "./studio-context";
import { DEFAULT_ROLES } from "@/types/studio";
import { getContrastRatio } from "@/utils/contrast-utils";
import { showToast } from "@/utils/toast";
import { GripVertical, Wand2 } from "lucide-react";

const ROLE_GROUPS = [
  { label: "Surfaces", range: [0, 1, 2, 3] },
  { label: "Borders", range: [4, 5] },
  { label: "Text", range: [6, 7, 8] },
  { label: "Brand", range: [9, 10, 11, 12, 13, 14] },
  { label: "States", range: [15, 16, 17, 18, 19, 20] },
];

function getComparisonIndex(index: number) {
  if (index <= 5) return 7;
  if (index <= 8) return 0;
  return 0;
}

export function RoleConfigurator() {
  const { roleMapping, updateRole, selectedPalette, swapRoles } = useStudio();
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  if (!selectedPalette) return null;

  return (
    <div id="roles" className="scroll-mt-28 flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
            Color Roles
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Grouped by UI purpose. Drag chips to swap roles, click a swatch to override, or fix low-contrast pairings.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Fixable failures</span>
        </div>
      </div>

      <div className="space-y-4">
        {ROLE_GROUPS.map((group) => (
          <section key={group.label} className="space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {group.label}
              </h4>
              <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {group.range.map((index) => {
                const roleName = DEFAULT_ROLES[index];
                const varName = `--ui-color-${index + 1}`;
                const currentHex = roleMapping[varName];

                const comparisonIndex = getComparisonIndex(index);
                const comparisonColor = roleMapping[`--ui-color-${comparisonIndex + 1}`];
                const comparisonRole = DEFAULT_ROLES[comparisonIndex];

                const ratio =
                  currentHex && comparisonColor
                    ? getContrastRatio(currentHex, comparisonColor)
                    : 1;

                let badgeClass =
                  "bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20";
                let grade = "Fail";
                if (ratio >= 7.0) {
                  badgeClass =
                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20";
                  grade = "AAA";
                } else if (ratio >= 4.5) {
                  badgeClass =
                    "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-500/20";
                  grade = "AA";
                } else if (ratio >= 3.0) {
                  badgeClass =
                    "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20";
                  grade = "AA Lg";
                }

                const isDragSource = dragFromIdx === index;
                const isDragTarget = dragOverIdx === index;
                const canFix = ratio < 4.5 && comparisonColor;

                const handleFix = () => {
                  const best = selectedPalette.colors
                    .map((color) => ({
                      hex: color.hex,
                      ratio: getContrastRatio(color.hex, comparisonColor),
                    }))
                    .sort((a, b) => b.ratio - a.ratio)[0];

                  if (best) {
                    updateRole(varName, best.hex);
                    showToast(`Updated ${roleName} to ${best.ratio.toFixed(1)}:1 against ${comparisonRole}`);
                  }
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
                          `Swapped ${DEFAULT_ROLES[dragFromIdx]} with ${DEFAULT_ROLES[index]}`
                        );
                      }
                      setDragFromIdx(null);
                      setDragOverIdx(null);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border transition-all cursor-grab active:cursor-grabbing select-none ${
                      isDragTarget
                        ? "border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.02]"
                        : "border-gray-100 dark:border-slate-800"
                    } ${isDragSource ? "opacity-40" : ""}`}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    <div className="relative group flex-shrink-0">
                      <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={(currentHex || "#000000").slice(0, 7)}
                        onChange={(e) => updateRole(varName, e.target.value)}
                        aria-label={`Override ${roleName}`}
                      />
                      <div
                        className="w-10 h-10 rounded-xl border border-white dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: currentHex }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 truncate"
                        title={roleName}
                      >
                        {roleName}
                      </p>
                      <p className="text-[11px] font-mono text-gray-600 dark:text-gray-300 uppercase">
                        {currentHex?.slice(0, 7)}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <div
                        className={`px-1.5 py-0.5 rounded-md border text-[8px] font-black tracking-wider uppercase ${badgeClass}`}
                        title={`WCAG contrast ratio against ${comparisonRole}`}
                      >
                        {ratio.toFixed(1)} {grade}
                      </div>
                      {canFix && (
                        <button
                          type="button"
                          onClick={handleFix}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                          title={`Fix contrast against ${comparisonRole}`}
                        >
                          <Wand2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
