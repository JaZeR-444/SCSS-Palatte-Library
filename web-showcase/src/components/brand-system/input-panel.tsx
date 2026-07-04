"use client";

import { BrandInputs } from "@/types/brand-system";
import {
  INTERFACE_STYLES,
  PERSONALITY_OPTIONS,
  PLATFORM_OPTIONS,
  PRODUCT_TYPES,
  TONE_OPTIONS,
} from "@/types/brand-system";

interface Props {
  inputs: BrandInputs;
  onChange: (next: BrandInputs) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-gray-800 dark:text-gray-100";

export function BrandInputPanel({ inputs, onChange }: Props) {
  const set = <K extends keyof BrandInputs>(key: K, value: BrandInputs[K]) =>
    onChange({ ...inputs, [key]: value });

  const togglePersonality = (p: string) => {
    const has = inputs.personality.includes(p);
    const next = has
      ? inputs.personality.filter((x) => x !== p)
      : [...inputs.personality, p];
    set("personality", next);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Application / Brand name">
          <input
            className={inputCls}
            value={inputs.appName}
            onChange={(e) => set("appName", e.target.value)}
            placeholder="Nimbus"
          />
        </Field>
        <Field label="Product type">
          <select
            className={inputCls}
            value={inputs.productType}
            onChange={(e) => set("productType", e.target.value)}
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Industry">
          <input
            className={inputCls}
            value={inputs.industry}
            onChange={(e) => set("industry", e.target.value)}
            placeholder="Productivity, Fintech, Health…"
          />
        </Field>
        <Field label="Target audience">
          <input
            className={inputCls}
            value={inputs.audience}
            onChange={(e) => set("audience", e.target.value)}
            placeholder="Product teams and operators"
          />
        </Field>
        <Field label="Tone">
          <select
            className={inputCls}
            value={inputs.tone}
            onChange={(e) => set("tone", e.target.value)}
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Platform">
          <select
            className={inputCls}
            value={inputs.platform}
            onChange={(e) => set("platform", e.target.value)}
          >
            {PLATFORM_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Use case">
        <input
          className={inputCls}
          value={inputs.useCase}
          onChange={(e) => set("useCase", e.target.value)}
          placeholder="A workspace for planning and tracking product work"
        />
      </Field>

      {/* Personality multi-select */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Brand personality
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PERSONALITY_OPTIONS.map((p) => {
            const active = inputs.personality.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePersonality(p)}
                className={`rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/20"
                    : "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-indigo-300"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interface style segmented control */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Interface style
        </span>
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
          {INTERFACE_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set("interfaceStyle", s)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                inputs.interfaceStyle === s
                  ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Field label="Optional notes">
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={inputs.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Anything else that should shape the system…"
        />
      </Field>
    </div>
  );
}
