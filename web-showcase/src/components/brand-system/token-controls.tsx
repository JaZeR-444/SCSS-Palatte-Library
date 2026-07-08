"use client";

import { useState } from "react";
import { Density, DesignTokens } from "@/types/design-system";
import {
  FONT_PRESETS,
  SHADOW_PRESETS,
  inferRatio,
  makeRadius,
  makeScale,
  makeSpace,
} from "@/utils/design-presets";
import { Type, Ruler, Square, Layers } from "lucide-react";

/* ------------------------------------------------------------------ *
 * Non-color token controls — the "adjust the whole system" surface.  *
 * Every control maps to a DesignTokens field and emits a full,       *
 * updated tokens object so the preview + exporters stay in sync.     *
 * Token math + style vocabulary live in utils/design-presets.ts.     *
 * ------------------------------------------------------------------ */

const DENSITIES: Density[] = ["compact", "cozy", "comfortable"];

/* --- local UI state derived from tokens --- */

interface Ui {
  fontFamily: string;
  typeRatio: number;
  lineHeight: number;
  tracking: number;
  spacingBase: number;
  radius: number;
  shadowPreset: string;
  density: Density;
}

function matchShadow(shadow: string[]): string {
  for (const [name, preset] of Object.entries(SHADOW_PRESETS)) {
    if (preset[1] === shadow[1]) return name;
  }
  return "Soft";
}

function initUi(t: DesignTokens): Ui {
  return {
    fontFamily: t.typography.sans,
    typeRatio: inferRatio(t.typography.scale),
    lineHeight: t.typography.lineHeight,
    tracking: t.typography.tracking,
    spacingBase: t.space[1] || 4,
    radius: t.radius.md,
    shadowPreset: matchShadow(t.shadow),
    density: t.density,
  };
}

function toTokens(base: DesignTokens, ui: Ui): DesignTokens {
  return {
    ...base,
    typography: {
      ...base.typography,
      sans: ui.fontFamily,
      scale: makeScale(ui.typeRatio),
      lineHeight: ui.lineHeight,
      tracking: ui.tracking,
    },
    space: makeSpace(ui.spacingBase),
    radius: makeRadius(ui.radius),
    shadow: SHADOW_PRESETS[ui.shadowPreset] ?? base.shadow,
    density: ui.density,
  };
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
        {value && (
          <span className="font-mono normal-case text-indigo-400">{value}</span>
        )}
      </span>
      {children}
    </label>
  );
}

export function TokenControls({
  tokens,
  onChange,
}: {
  tokens: DesignTokens;
  onChange: (tokens: DesignTokens) => void;
}) {
  const [ui, setUi] = useState<Ui>(() => initUi(tokens));

  const update = (patch: Partial<Ui>) => {
    const next = { ...ui, ...patch };
    setUi(next);
    onChange(toTokens(tokens, next));
  };

  const scale = makeScale(ui.typeRatio);
  const space = makeSpace(ui.spacingBase);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Typography */}
      <section className="space-y-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/30 p-4">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-indigo-500" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
            Typography
          </h4>
        </div>
        <Field label="Typeface">
          <select
            value={ui.fontFamily}
            onChange={(e) => update({ fontFamily: e.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            style={{ fontFamily: ui.fontFamily }}
          >
            {FONT_PRESETS.map((f) => (
              <option
                key={f.label}
                value={f.value}
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </option>
            ))}
            {!FONT_PRESETS.some((f) => f.value === ui.fontFamily) && (
              <option value={ui.fontFamily}>Custom</option>
            )}
          </select>
        </Field>
        <Field
          label="Scale ratio"
          value={`${ui.typeRatio.toFixed(3)} · ${scale[0]}–${scale[scale.length - 1]}px`}
        >
          <input
            type="range"
            min={1.1}
            max={1.414}
            step={0.008}
            value={ui.typeRatio}
            onChange={(e) => update({ typeRatio: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Line height" value={ui.lineHeight.toFixed(2)}>
            <input
              type="range"
              min={1.2}
              max={1.9}
              step={0.05}
              value={ui.lineHeight}
              onChange={(e) =>
                update({ lineHeight: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-500"
            />
          </Field>
          <Field label="Tracking" value={`${ui.tracking.toFixed(3)}em`}>
            <input
              type="range"
              min={-0.05}
              max={0.1}
              step={0.005}
              value={ui.tracking}
              onChange={(e) => update({ tracking: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </Field>
        </div>
      </section>

      {/* Layout / density */}
      <section className="space-y-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/30 p-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-indigo-500" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
            Layout
          </h4>
        </div>
        <Field
          label="Spacing base"
          value={`${ui.spacingBase}px · ${space[2]}/${space[4]}/${space[6]}…`}
        >
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={ui.spacingBase}
            onChange={(e) =>
              update({ spacingBase: parseInt(e.target.value, 10) })
            }
            className="w-full accent-indigo-500"
          />
        </Field>
        <Field label="Density">
          <div className="inline-flex w-full rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
            {DENSITIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update({ density: d })}
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold capitalize transition-all ${
                  ui.density === d
                    ? "bg-white text-indigo-500 shadow-sm dark:bg-slate-900"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>
      </section>

      {/* Shape / radius */}
      <section className="space-y-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/30 p-4">
        <div className="flex items-center gap-2">
          <Square className="h-4 w-4 text-indigo-500" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
            Shape
          </h4>
        </div>
        <Field label="Corner radius" value={`${ui.radius}px`}>
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={ui.radius}
            onChange={(e) => update({ radius: parseInt(e.target.value, 10) })}
            className="w-full accent-indigo-500"
          />
        </Field>
        <div className="flex items-end gap-2 pt-1">
          {[makeRadius(ui.radius).sm, ui.radius, makeRadius(ui.radius).lg].map(
            (r, i) => (
              <div
                key={i}
                className="h-10 flex-1 border border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40"
                style={{ borderRadius: `${r}px` }}
                title={`${r}px`}
              />
            ),
          )}
        </div>
      </section>

      {/* Elevation / shadow */}
      <section className="space-y-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/30 p-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
            Elevation
          </h4>
        </div>
        <Field label="Shadow">
          <div className="grid grid-cols-4 gap-1.5">
            {Object.keys(SHADOW_PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => update({ shadowPreset: name })}
                className={`rounded-lg px-1 py-1.5 text-[10px] font-bold transition-all ${
                  ui.shadowPreset === name
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-slate-800 dark:text-gray-400"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </Field>
        <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
          <div
            className="h-12 w-12 rounded-xl bg-white dark:bg-slate-800"
            style={{
              boxShadow: (SHADOW_PRESETS[ui.shadowPreset] ?? [])[1] || "none",
            }}
          />
          <div
            className="h-12 w-12 rounded-xl bg-white dark:bg-slate-800"
            style={{
              boxShadow: (SHADOW_PRESETS[ui.shadowPreset] ?? [])[3] || "none",
            }}
          />
        </div>
      </section>
    </div>
  );
}
