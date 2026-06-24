"use client";

import { useState } from "react";
import { useStudio } from "./studio-context";
import { DEFAULT_ROLES } from "@/types/studio";
import { getContrastRatio } from "@/utils/contrast-utils";
import { showToast } from "@/utils/toast";
import { GripVertical } from "lucide-react";

export function RoleConfigurator() {
  const { roleMapping, updateRole, selectedPalette, swapRoles } = useStudio();
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  if (!selectedPalette) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
            Color Roles
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Drag chips to swap roles. Click the swatch to override.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {DEFAULT_ROLES.map((roleName, index) => {
          const varName = `--ui-color-${index + 1}`;
          const currentHex = roleMapping[varName];

          const isBackground = index === 2 || index === 3;
          const comparisonColor = isBackground
            ? roleMapping["--ui-color-6"]
            : roleMapping["--ui-color-3"];

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
                    `Swapped ${DEFAULT_ROLES[dragFromIdx]} ↔ ${DEFAULT_ROLES[index]}`
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
                  value={currentHex || "#000000"}
                  onChange={(e) => updateRole(varName, e.target.value)}
                />
                <div
                  className="w-10 h-10 rounded-xl border border-white dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: currentHex }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-black uppercase tracking-tighter text-gray-400 truncate"
                  title={roleName}
                >
                  {roleName}
                </p>
                <p className="text-[11px] font-mono text-gray-600 dark:text-gray-300 uppercase">
                  {currentHex}
                </p>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-md border text-[8px] font-black tracking-wider uppercase flex-shrink-0 ${badgeClass}`}
                title={`WCAG contrast ratio against ${isBackground ? "Primary Text" : "Deep Background"}`}
              >
                {ratio.toFixed(1)} {grade}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
