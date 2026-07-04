"use client";

import { useMemo, useState } from "react";
import { Palette } from "@/types";
import { BrandInputs } from "@/types/brand-system";
import { deriveRoles } from "@/utils/brand-system";
import { getContrastRatio } from "@/utils/contrast-utils";
import palettesData from "@/data/palettes.json";
import { Search, Check, Shuffle, Palette as PaletteIcon } from "lucide-react";
import { playSound } from "@/utils/audio";

const ALL = palettesData as Palette[];

interface Props {
  selected: Palette | null;
  inputs: BrandInputs;
  onSelect: (p: Palette) => void;
}

const RECS = [
  { key: "brand-primary", label: "Primary" },
  { key: "brand-secondary", label: "Secondary" },
  { key: "brand-accent", label: "Accent" },
  { key: "bg-base", label: "Neutral / BG" },
] as const;

export function PaletteSelector({ selected, inputs, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL.slice(0, 40);
    return ALL.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.tags?.mood ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (p.tags?.aesthetic ?? []).some((t) => t.toLowerCase().includes(q)),
    ).slice(0, 60);
  }, [query]);

  const recommendation = useMemo(() => {
    if (!selected) return null;
    const { roles, mode } = deriveRoles(selected, inputs);
    const map: Record<string, string> = {};
    for (const r of roles) map[r.key] = r.hex;
    return { map, mode };
  }, [selected, inputs]);

  const pickRandom = () => {
    const p = ALL[Math.floor(Math.random() * ALL.length)];
    playSound("click");
    onSelect(p);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 2,500+ palettes by name, category or mood…"
          className="w-full pl-10 pr-24 py-2.5 rounded-2xl text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-gray-800 dark:text-gray-100"
        />
        <button
          onClick={pickRandom}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 transition-colors cursor-pointer"
          title="Pick a random palette"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Random
        </button>
      </div>

      {/* Result list */}
      <div className="max-h-52 overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
        {results.map((p) => {
          const isSel = selected?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                playSound("click");
                onSelect(p);
              }}
              className={`group flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isSel
                  ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30"
                  : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800"
              }`}
            >
              <div className="flex h-9 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-black/5">
                {p.colors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-gray-900 dark:text-white">
                  {p.name}
                </p>
                <p className="truncate text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  {p.category} · {p.count} clr
                </p>
              </div>
              {isSel && (
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
        {results.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs italic text-gray-400">
            No palettes match “{query}”.
          </div>
        )}
      </div>

      {/* Selected summary + recommendations */}
      {selected && recommendation ? (
        <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/30 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                {selected.name}
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                {selected.category} · {recommendation.mode}-mode ready
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(selected.tags?.mood ?? []).slice(0, 2).map((t, i) => (
                <span
                  key={`m-${i}`}
                  className="rounded-lg bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 text-[9px] font-bold capitalize text-purple-600 dark:text-purple-400"
                >
                  {t}
                </span>
              ))}
              {(selected.tags?.aesthetic ?? []).slice(0, 2).map((t, i) => (
                <span
                  key={`a-${i}`}
                  className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-[9px] font-bold capitalize text-emerald-600 dark:text-emerald-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Full swatch strip with hex */}
          <div className="flex flex-wrap gap-1.5">
            {selected.colors.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 py-1"
              >
                <span
                  className="h-4 w-4 rounded border border-black/10"
                  style={{ backgroundColor: c.hex }}
                />
                <code className="text-[9px] font-mono text-gray-500 dark:text-gray-400">
                  {c.hex.slice(0, 7).toUpperCase()}
                </code>
              </div>
            ))}
          </div>

          {/* Role recommendations */}
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Recommended brand roles
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RECS.map((rec) => {
                const hex = recommendation.map[rec.key];
                const onBase = getContrastRatio(
                  hex,
                  recommendation.map["bg-base"],
                );
                return (
                  <div
                    key={rec.key}
                    className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5"
                  >
                    <div
                      className="mb-2 h-9 w-full rounded-lg border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                    <p className="text-[10px] font-black text-gray-700 dark:text-gray-200">
                      {rec.label}
                    </p>
                    <code className="text-[9px] font-mono text-gray-400">
                      {hex.toLowerCase()}
                    </code>
                    {rec.key !== "bg-base" && (
                      <p className="mt-0.5 text-[8px] font-bold text-gray-400">
                        {onBase.toFixed(1)}:1 vs bg
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 py-10 text-center">
          <PaletteIcon className="h-6 w-6 text-gray-300 dark:text-gray-600" />
          <p className="text-xs font-bold text-gray-400">
            Select a palette to seed your brand system.
          </p>
        </div>
      )}
    </div>
  );
}
