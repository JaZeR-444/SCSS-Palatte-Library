"use client";

import { BrandSystem, ContrastPair } from "@/types/brand-system";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

function gradeCls(grade: ContrastPair["grade"]): string {
  if (grade === "AAA")
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (grade === "AA")
    return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
  if (grade === "AA Large")
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-red-500/10 text-red-500 border-red-500/20";
}

function PairRow({ pair }: { pair: ContrastPair }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex flex-shrink-0">
          <span
            className="h-6 w-6 rounded-l-md border border-black/10"
            style={{ backgroundColor: pair.bg.slice(0, 7) }}
          />
          <span
            className="-ml-2 flex h-6 w-6 items-center justify-center rounded-r-md border border-black/10 text-[9px] font-black"
            style={{ backgroundColor: pair.bg.slice(0, 7), color: pair.fg.slice(0, 7) }}
          >
            Aa
          </span>
        </div>
        <span className="truncate text-[11px] font-bold text-gray-600 dark:text-gray-300">
          {pair.label}
        </span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <span className="text-[10px] font-mono text-gray-400">
          {pair.ratio.toFixed(2)}:1
        </span>
        <span
          className={`rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase ${gradeCls(pair.grade)}`}
        >
          {pair.grade}
        </span>
      </div>
    </div>
  );
}

export function AccessibilityReview({ system }: { system: BrandSystem }) {
  const { accessibility } = system;
  const scoreColor =
    accessibility.score >= 90
      ? "text-emerald-500"
      : accessibility.score >= 70
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-3xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/30 p-5">
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
          <ShieldCheck className={`h-8 w-8 ${scoreColor}`} />
        </div>
        <div>
          <p className={`text-2xl font-black ${scoreColor}`}>
            {accessibility.score}
            <span className="text-sm text-gray-400">/100</span>
          </p>
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {accessibility.safe.length} of{" "}
            {accessibility.safe.length + accessibility.unsafe.length} critical
            pairs meet WCAG AA. Muted text is intentionally reserved for
            secondary use.
          </p>
        </div>
      </div>

      {accessibility.warnings.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">
              Unsafe pairings to fix
            </span>
          </div>
          <ul className="space-y-1">
            {accessibility.warnings.map((w, i) => (
              <li
                key={i}
                className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Safe pairings
            </span>
          </div>
          {accessibility.safe.map((p) => (
            <PairRow key={p.label} pair={p} />
          ))}
        </div>
        {accessibility.unsafe.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Below AA
              </span>
            </div>
            {accessibility.unsafe.map((p) => (
              <PairRow key={p.label} pair={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
