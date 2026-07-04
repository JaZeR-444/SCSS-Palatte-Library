"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  X,
  RotateCcw,
  Wand2,
  Layers,
  Palette as PaletteIcon,
  Code2,
  ShieldCheck,
  Eye,
  Component,
  BookOpen,
  Compass,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useStudio } from "@/components/studio/studio-context";
import { Palette } from "@/types";
import {
  BrandInputs,
  BrandSystem,
  BrandSystemRecord,
  DEFAULT_INPUTS,
} from "@/types/brand-system";
import { generateBrandSystem } from "@/utils/brand-system";
import palettesData from "@/data/palettes.json";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";
import { PaletteSelector } from "./palette-selector";
import { BrandInputPanel } from "./input-panel";
import { SemanticRoles } from "./semantic-roles";
import { TokenOutput } from "./token-output";
import { AccessibilityReview } from "./accessibility-review";
import { BrandPreview } from "./preview";

const ALL = palettesData as Palette[];
const INPUTS_KEY = "palettes.brandSystem.inputs";
const RECENTS_KEY = "palettes.brandSystem.recents";

function SectionHeader({
  icon: Icon,
  color,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-[11px] font-medium text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

export function BrandSystemModal() {
  const { isBrandSystemOpen, brandSystemPalette, closeBrandSystem } = useStudio();

  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(null);
  const [inputs, setInputs] = useState<BrandInputs>(DEFAULT_INPUTS);
  const [system, setSystem] = useState<BrandSystem | null>(null);
  const [recents, setRecents] = useState<BrandSystemRecord[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  // Hydrate persisted inputs + recents once.
  useEffect(() => {
    try {
      const storedInputs = localStorage.getItem(INPUTS_KEY);
      if (storedInputs) setInputs({ ...DEFAULT_INPUTS, ...JSON.parse(storedInputs) });
      const storedRecents = localStorage.getItem(RECENTS_KEY);
      if (storedRecents) setRecents(JSON.parse(storedRecents));
    } catch {}
  }, []);

  // Seed the palette when opened from a card / studio.
  useEffect(() => {
    if (isBrandSystemOpen && brandSystemPalette) {
      setSelectedPalette(brandSystemPalette);
      setSystem(null);
    }
  }, [isBrandSystemOpen, brandSystemPalette]);

  // Persist inputs.
  useEffect(() => {
    try {
      localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const persistRecents = useCallback((next: BrandSystemRecord[]) => {
    setRecents(next);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const canGenerate = !!selectedPalette && inputs.appName.trim().length > 0;

  const handleGenerate = useCallback(() => {
    if (!selectedPalette) {
      showToast("Select a palette first.", "error");
      return;
    }
    const result = generateBrandSystem(selectedPalette, inputs);
    setSystem(result);
    playSound("success");
    showToast(`Brand system for “${inputs.appName}” generated!`);

    const record: BrandSystemRecord = {
      id: `${selectedPalette.id}-${slugify(inputs.appName)}`,
      appName: inputs.appName,
      paletteId: selectedPalette.id,
      paletteName: selectedPalette.name,
      mode: result.mode,
      inputs,
      savedAt: new Date().toISOString(),
    };
    const next = [record, ...recents.filter((r) => r.id !== record.id)].slice(0, 6);
    persistRecents(next);

    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [selectedPalette, inputs, recents, persistRecents]);

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setSelectedPalette(null);
    setSystem(null);
    playSound("click");
    showToast("Brand System reset.");
  }, []);

  const loadRecent = useCallback((record: BrandSystemRecord) => {
    const pal = ALL.find((p) => p.id === record.paletteId);
    if (!pal) {
      showToast("That palette is no longer available.", "error");
      return;
    }
    setSelectedPalette(pal);
    setInputs(record.inputs);
    setSystem(generateBrandSystem(pal, record.inputs));
    playSound("click");
    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleClose = () => {
    playSound("close");
    closeBrandSystem();
  };

  const foundationRows = useMemo(() => {
    if (!system) return [];
    const f = system.foundation;
    return [
      { label: "Brand positioning", text: f.positioning },
      { label: "Visual direction", text: f.direction },
      { label: "Personality", text: f.personality },
      { label: "Design language", text: f.language },
      { label: "Color strategy", text: f.strategy },
      { label: "What it communicates", text: f.communicates },
    ];
  }, [system]);

  return (
    <AnimatePresence>
      {isBrandSystemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-gray-900 dark:text-white">
                    Brand System
                  </h2>
                  <p className="text-[11px] font-medium text-gray-400">
                    Turn a palette into a production-ready brand system.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-800 px-3 py-2 text-[11px] font-bold text-gray-500 hover:text-indigo-500 hover:border-indigo-300 transition-colors cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  onClick={handleClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="space-y-10 p-5 sm:p-8">
                {/* Step 1 + 2: setup */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <SectionHeader
                      icon={PaletteIcon}
                      color="bg-indigo-500 shadow-indigo-500/20"
                      title="1 · Select a palette"
                      subtitle="The foundation for every token in your system."
                    />
                    <PaletteSelector
                      selected={selectedPalette}
                      inputs={inputs}
                      onSelect={(p) => {
                        setSelectedPalette(p);
                        setSystem(null);
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <SectionHeader
                      icon={Compass}
                      color="bg-violet-500 shadow-violet-500/20"
                      title="2 · Define the brand"
                      subtitle="Shape the strategy, tone and semantic mapping."
                    />
                    <BrandInputPanel inputs={inputs} onChange={setInputs} />
                  </div>
                </div>

                {/* Recents */}
                {recents.length > 0 && !system && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Recent systems
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recents.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => loadRecent(r)}
                          className="flex items-center gap-2 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:border-indigo-300 transition-colors cursor-pointer"
                        >
                          <span className="font-black text-gray-900 dark:text-white">
                            {r.appName}
                          </span>
                          <span className="text-gray-400">· {r.paletteName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className={`group flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-sm font-black tracking-tight text-white shadow-xl transition-all ${
                      canGenerate
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        : "bg-gray-300 dark:bg-slate-700 cursor-not-allowed shadow-none"
                    }`}
                  >
                    <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-6" />
                    {system ? "Regenerate Brand System" : "Build Brand System"}
                  </button>
                  {!canGenerate && (
                    <p className="text-[11px] text-gray-400">
                      Select a palette and name your app to continue.
                    </p>
                  )}
                </div>

                {/* Output */}
                {system && (
                  <div ref={outputRef} className="space-y-12 border-t border-gray-100 dark:border-slate-800 pt-10">
                    {/* Foundation */}
                    <section className="space-y-5">
                      <SectionHeader
                        icon={BookOpen}
                        color="bg-sky-500 shadow-sky-500/20"
                        title="Brand Foundation"
                        subtitle="Strategic direction derived from your palette + inputs."
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {foundationRows.map((row) => (
                          <div
                            key={row.label}
                            className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/30 p-4"
                          >
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                              {row.label}
                            </p>
                            <p className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-300">
                              {row.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Semantic roles */}
                    <section className="space-y-5">
                      <SectionHeader
                        icon={Layers}
                        color="bg-indigo-500 shadow-indigo-500/20"
                        title="Semantic Color Roles"
                        subtitle="Click any role to copy its token. Amber = derived."
                      />
                      <SemanticRoles system={system} />
                    </section>

                    {/* Preview */}
                    <section className="space-y-5">
                      <SectionHeader
                        icon={Eye}
                        color="bg-emerald-500 shadow-emerald-500/20"
                        title="Visual Preview"
                        subtitle="Your tokens applied to a realistic interface."
                      />
                      <BrandPreview system={system} />
                    </section>

                    {/* Usage guide */}
                    <section className="space-y-5">
                      <SectionHeader
                        icon={Compass}
                        color="bg-violet-500 shadow-violet-500/20"
                        title="UI Usage Guide"
                        subtitle="Where each role belongs across real interfaces."
                      />
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {system.usage.map((u) => (
                          <div
                            key={u.area}
                            className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5"
                          >
                            <p className="mb-1 text-[11px] font-black text-gray-900 dark:text-white">
                              {u.area}
                            </p>
                            <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                              {u.guidance}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Components */}
                    <section className="space-y-5">
                      <SectionHeader
                        icon={Component}
                        color="bg-fuchsia-500 shadow-fuchsia-500/20"
                        title="Brand Components"
                        subtitle="Token recipes for the core component library."
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {system.components.map((c) => (
                          <div
                            key={c.name}
                            className="space-y-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
                          >
                            <div>
                              <p className="text-xs font-black text-gray-900 dark:text-white">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-gray-400">{c.intent}</p>
                            </div>
                            <div className="space-y-1">
                              {c.usage.map((u) => (
                                <div
                                  key={u.label}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                    {u.label}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="h-3.5 w-3.5 rounded border border-black/10"
                                      style={{
                                        backgroundColor:
                                          system.roles[u.token.replace("--", "")],
                                      }}
                                    />
                                    <code className="text-[9px] font-mono text-gray-400">
                                      {u.token}
                                    </code>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Tokens */}
                    <section className="space-y-5">
                      <SectionHeader
                        icon={Code2}
                        color="bg-slate-800 dark:bg-slate-700 shadow-slate-800/20"
                        title="Token System & Export"
                        subtitle="Copy or download CSS, SCSS, JSON or Markdown."
                      />
                      <TokenOutput system={system} />
                    </section>

                    {/* Accessibility */}
                    <section className="space-y-5">
                      <SectionHeader
                        icon={ShieldCheck}
                        color="bg-teal-500 shadow-teal-500/20"
                        title="Accessibility Review"
                        subtitle="WCAG AA contrast across critical color pairs."
                      />
                      <AccessibilityReview system={system} />
                    </section>

                    {/* Limitations */}
                    {system.limitations.length > 0 && (
                      <section className="space-y-3 rounded-3xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-5">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Notes & limitations
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {system.limitations.map((l, i) => (
                            <li
                              key={i}
                              className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300"
                            >
                              • {l}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "app"
  );
}
