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
  SlidersHorizontal,
} from "lucide-react";
import { useStudio } from "@/components/studio/studio-context";
import { Palette } from "@/types";
import {
  BrandInputs,
  BrandSystem,
  BrandSystemRecord,
  DEFAULT_INPUTS,
} from "@/types/brand-system";
import {
  DesignTokens,
  ImportResult,
  SavedDesignSystem,
} from "@/types/design-system";
import { generateBrandSystem } from "@/utils/brand-system";
import {
  designSystemFromBrandSystem,
  toSavedDesignSystem,
} from "@/utils/design-system";
import {
  DESIGN_PRESETS,
  applyPreset,
  makeRadius,
} from "@/utils/design-presets";
import {
  listDesignSystemsAction,
  getDesignSystemAction,
  saveDesignSystemAction,
  duplicateDesignSystemAction,
  deleteDesignSystemAction,
  listWorkspacesAction,
  setDesignSystemProjectAction,
} from "@/app/actions";
import palettesData from "@/data/palettes.json";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";
import { PaletteSelector } from "./palette-selector";
import { BrandInputPanel } from "./input-panel";
import { SemanticRoles } from "./semantic-roles";
import { TokenControls } from "./token-controls";
import { TokenOutput } from "./token-output";
import { AccessibilityReview } from "./accessibility-review";
import { BrandPreview } from "./preview";
import { SavedSystemsBar } from "./saved-systems-bar";

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
  const {
    isBrandSystemOpen,
    brandSystemPalette,
    closeBrandSystem,
    brandSystemLoadId,
    clearBrandSystemLoadId,
    brandSystemWorkspaceSlug,
    clearBrandSystemWorkspaceSlug,
  } = useStudio();

  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(null);
  const [inputs, setInputs] = useState<BrandInputs>(DEFAULT_INPUTS);
  const [system, setSystem] = useState<BrandSystem | null>(null);
  const [recents, setRecents] = useState<BrandSystemRecord[]>([]);
  // Live-editable non-color tokens (type/space/radius/shadow/density). Null
  // until a system is generated; reset whenever a fresh system is built.
  const [tokenEdits, setTokenEdits] = useState<DesignTokens | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  // Bumped whenever tokens are replaced wholesale (regenerate / preset) so the
  // TokenControls remount and re-read the new values into their sliders.
  const [tokenNonce, setTokenNonce] = useState(0);
  // Non-color hints detected by an import (font / radius / shadow).
  const [importHints, setImportHints] = useState<ImportResult | null>(null);
  // Saved (DB-backed) design systems + the one currently loaded, if any.
  const [savedSystems, setSavedSystems] = useState<SavedDesignSystem[]>([]);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState(DEFAULT_INPUTS.appName);
  // Workspaces (projects + collections) this system can be attached to.
  const [workspaces, setWorkspaces] = useState<
    { slug: string; name: string; kind: "collection" | "project" }[]
  >([]);
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  // Carries a loaded system's tokens through the baseDs reset effect so a
  // restore isn't wiped when the regenerated system swaps in.
  const pendingRestoreRef = useRef<{
    tokens: DesignTokens;
    presetId: string | null;
  } | null>(null);

  // Base unified system derived from the generated color system.
  const baseDs = useMemo(
    () => (system ? designSystemFromBrandSystem(system) : null),
    [system],
  );
  // When a new base system swaps in: apply a pending restore if one is queued,
  // otherwise reset token edits + preset (fresh generate).
  useEffect(() => {
    const pending = pendingRestoreRef.current;
    if (pending) {
      setTokenEdits(pending.tokens);
      setActivePresetId(pending.presetId);
      pendingRestoreRef.current = null;
    } else {
      setTokenEdits(null);
      setActivePresetId(null);
    }
    setTokenNonce((n) => n + 1);
  }, [baseDs]);
  // The active design system = base color layer + any live token edits.
  const designSystem = useMemo(
    () => (baseDs ? { ...baseDs, tokens: tokenEdits ?? baseDs.tokens } : null),
    [baseDs, tokenEdits],
  );

  // Manual slider edit → drop the "applied preset" highlight.
  const handleTokenChange = useCallback((tokens: DesignTokens) => {
    setTokenEdits(tokens);
    setActivePresetId(null);
  }, []);

  // Apply a full-system preset over the current color layer.
  const handleApplyPreset = useCallback(
    (presetId: string) => {
      if (!designSystem) return;
      const preset = DESIGN_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      setTokenEdits(applyPreset(designSystem, preset).tokens);
      setActivePresetId(presetId);
      setTokenNonce((n) => n + 1);
      playSound("click");
    },
    [designSystem],
  );

  // Inline canvas edit → override a single color token for the shown mode.
  const handleColorChange = useCallback(
    (mode: "light" | "dark", key: string, hex: string) => {
      if (!designSystem) return;
      const t = designSystem.tokens;
      setTokenEdits({
        ...t,
        color: { ...t.color, [mode]: { ...t.color[mode], [key]: hex } },
      });
    },
    [designSystem],
  );

  // Apply the detected type + shape from an import onto the live tokens.
  const handleApplyImportStyle = useCallback(() => {
    if (!designSystem || !importHints) return;
    const t = designSystem.tokens;
    setTokenEdits({
      ...t,
      typography: importHints.fontSans
        ? { ...t.typography, sans: importHints.fontSans }
        : t.typography,
      radius:
        importHints.radius != null ? makeRadius(importHints.radius) : t.radius,
    });
    setActivePresetId(null);
    setTokenNonce((n) => n + 1);
    playSound("click");
    showToast("Applied detected type & shape.");
  }, [designSystem, importHints]);

  // --- Saved (DB-backed) design systems ---------------------------------

  const refreshSaved = useCallback(async () => {
    try {
      setSavedSystems(await listDesignSystemsAction());
    } catch {
      /* offline / no db — leave list as-is */
    }
  }, []);

  // Load the saved list whenever the modal opens.
  useEffect(() => {
    if (isBrandSystemOpen) refreshSaved();
  }, [isBrandSystemOpen, refreshSaved]);

  // Load attachable workspaces (projects + collections) when the modal opens.
  useEffect(() => {
    if (!isBrandSystemOpen) return;
    (async () => {
      try {
        setWorkspaces(await listWorkspacesAction());
      } catch {
        /* offline / no db — leave list empty */
      }
    })();
  }, [isBrandSystemOpen]);

  // If opened targeting a specific workspace (e.g. from a workspace card),
  // pre-select it as the attach target, then consume the one-shot signal.
  useEffect(() => {
    if (isBrandSystemOpen && brandSystemWorkspaceSlug) {
      setWorkspaceSlug(brandSystemWorkspaceSlug);
      clearBrandSystemWorkspaceSlug();
    }
  }, [
    isBrandSystemOpen,
    brandSystemWorkspaceSlug,
    clearBrandSystemWorkspaceSlug,
  ]);

  // Keep the name field tracking the app name until the system is saved.
  useEffect(() => {
    if (!currentSavedId) setCurrentName(inputs.appName);
  }, [inputs.appName, currentSavedId]);

  const handleSaveSystem = useCallback(
    async (asNew: boolean) => {
      if (!designSystem || !selectedPalette) return;
      const rec = {
        ...toSavedDesignSystem(designSystem, inputs, {
          id: asNew ? "" : (currentSavedId ?? ""),
          name: currentName.trim() || inputs.appName,
          paletteId: selectedPalette.id,
        }),
        // Carry the chosen workspace so a fresh save is attached immediately.
        projectSlug: workspaceSlug,
      };
      try {
        const saved = await saveDesignSystemAction(rec);
        setCurrentSavedId(saved.id);
        setCurrentName(saved.name);
        setWorkspaceSlug(saved.projectSlug ?? null);
        await refreshSaved();
        playSound("success");
        showToast(asNew ? "Saved as a new system!" : "Design system saved!");
      } catch {
        showToast("Couldn't save the system.", "error");
      }
    },
    [
      designSystem,
      selectedPalette,
      inputs,
      currentSavedId,
      currentName,
      workspaceSlug,
      refreshSaved,
    ],
  );

  // Attach the current system to a workspace. Persists immediately when the
  // system is already saved; otherwise the choice is applied on the next save.
  const handleAssignWorkspace = useCallback(
    async (slug: string | null) => {
      setWorkspaceSlug(slug);
      if (!currentSavedId) return;
      try {
        await setDesignSystemProjectAction(currentSavedId, slug);
        await refreshSaved();
        playSound("click");
        showToast(
          slug
            ? `Attached to ${workspaces.find((w) => w.slug === slug)?.name ?? "workspace"}`
            : "Detached from workspace",
        );
      } catch {
        showToast("Couldn't update the attachment.", "error");
      }
    },
    [currentSavedId, refreshSaved, workspaces],
  );

  const handleDuplicateSystem = useCallback(async () => {
    if (!currentSavedId) return;
    try {
      const dup = await duplicateDesignSystemAction(currentSavedId);
      if (dup) {
        setCurrentSavedId(dup.id);
        setCurrentName(dup.name);
        await refreshSaved();
        playSound("success");
        showToast("Duplicated!");
      }
    } catch {
      showToast("Couldn't duplicate.", "error");
    }
  }, [currentSavedId, refreshSaved]);

  const handleDeleteSystem = useCallback(
    async (id: string) => {
      try {
        await deleteDesignSystemAction(id);
        if (id === currentSavedId) setCurrentSavedId(null);
        await refreshSaved();
        showToast("Deleted.");
      } catch {
        showToast("Couldn't delete.", "error");
      }
    },
    [currentSavedId, refreshSaved],
  );

  const handleLoadSystem = useCallback((saved: SavedDesignSystem) => {
    const pal =
      ALL.find((p) => p.id === saved.paletteId) ?? syntheticPalette(saved);
    const mergedInputs = { ...DEFAULT_INPUTS, ...saved.inputs };
    // Queue the saved tokens so the baseDs effect applies them post-regenerate.
    pendingRestoreRef.current = {
      tokens: saved.tokens,
      presetId: saved.presetId ?? null,
    };
    setCurrentSavedId(saved.id);
    setCurrentName(saved.name);
    setWorkspaceSlug(saved.projectSlug ?? null);
    setSelectedPalette(pal);
    setInputs(mergedInputs);
    setImportHints(null);
    setSystem(generateBrandSystem(pal, mergedInputs));
    playSound("click");
    showToast(`Loaded “${saved.name}”`);
    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // Apply-from-project: when opened with a target saved-system id, load it.
  useEffect(() => {
    if (!isBrandSystemOpen || !brandSystemLoadId) return;
    let active = true;
    (async () => {
      try {
        const saved = await getDesignSystemAction(brandSystemLoadId);
        if (active && saved) handleLoadSystem(saved);
      } finally {
        clearBrandSystemLoadId();
      }
    })();
    return () => {
      active = false;
    };
  }, [
    isBrandSystemOpen,
    brandSystemLoadId,
    handleLoadSystem,
    clearBrandSystemLoadId,
  ]);

  // Hydrate persisted inputs + recents once.
  useEffect(() => {
    try {
      const storedInputs = localStorage.getItem(INPUTS_KEY);
      if (storedInputs)
        setInputs({ ...DEFAULT_INPUTS, ...JSON.parse(storedInputs) });
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
    const next = [record, ...recents.filter((r) => r.id !== record.id)].slice(
      0,
      6,
    );
    persistRecents(next);

    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [selectedPalette, inputs, recents, persistRecents]);

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setSelectedPalette(null);
    setSystem(null);
    setCurrentSavedId(null);
    setWorkspaceSlug(null);
    setImportHints(null);
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
                        setImportHints(null);
                        setCurrentSavedId(null);
                        // Keep any workspace attach target (may be seeded when
                        // opened from a workspace card); Reset clears it.
                      }}
                      onImport={setImportHints}
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
                          <span className="text-gray-400">
                            · {r.paletteName}
                          </span>
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

                {/* Save / Load / Duplicate reusable systems */}
                <SavedSystemsBar
                  saved={savedSystems}
                  currentSavedId={currentSavedId}
                  name={currentName}
                  onNameChange={setCurrentName}
                  canSave={!!designSystem}
                  onSave={handleSaveSystem}
                  onDuplicate={handleDuplicateSystem}
                  onLoad={handleLoadSystem}
                  onDelete={handleDeleteSystem}
                  onOpenList={refreshSaved}
                  workspaces={workspaces}
                  currentWorkspaceSlug={workspaceSlug}
                  onAssignWorkspace={handleAssignWorkspace}
                />

                {/* Output */}
                {system && (
                  <div
                    ref={outputRef}
                    className="space-y-12 border-t border-gray-100 dark:border-slate-800 pt-10"
                  >
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
                      <SemanticRoles
                        system={system}
                        overrides={
                          designSystem?.tokens.color[designSystem.mode]
                        }
                      />
                    </section>

                    {/* Design tokens (type / space / radius / shadow / density) */}
                    {designSystem && (
                      <section className="space-y-5">
                        <SectionHeader
                          icon={SlidersHorizontal}
                          color="bg-amber-500 shadow-amber-500/20"
                          title="Design Tokens"
                          subtitle="Start from a preset, then tune type, spacing, shape and elevation — the preview and exports update live."
                        />

                        {/* Detected style from an import */}
                        {importHints &&
                          (importHints.fontSans ||
                            importHints.radius != null) && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-3 py-2.5 dark:border-indigo-950/50 dark:bg-indigo-950/20">
                              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                Detected from{" "}
                                <span className="font-black text-indigo-500">
                                  {importHints.source.ref}
                                </span>
                                :{" "}
                                {importHints.fontSans && (
                                  <span className="font-bold">
                                    {importHints.fontSans
                                      .split(",")[0]
                                      .replace(/["']/g, "")}
                                  </span>
                                )}
                                {importHints.fontSans &&
                                  importHints.radius != null &&
                                  " · "}
                                {importHints.radius != null && (
                                  <span className="font-bold">
                                    {importHints.radius}px radius
                                  </span>
                                )}
                              </p>
                              <button
                                type="button"
                                onClick={handleApplyImportStyle}
                                className="rounded-xl bg-indigo-500 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-indigo-600 cursor-pointer"
                              >
                                Apply detected style
                              </button>
                            </div>
                          )}

                        {/* Preset rail — restyle the whole system in one click */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {DESIGN_PRESETS.map((preset) => {
                            const active = activePresetId === preset.id;
                            const t = preset.tokens;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleApplyPreset(preset.id)}
                                title={preset.description}
                                className={`group flex w-40 flex-shrink-0 flex-col gap-2 rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                                  active
                                    ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500/30 dark:bg-indigo-950/30"
                                    : "border-gray-100 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900"
                                }`}
                              >
                                {/* Mini shape/elevation swatch */}
                                <div className="flex h-8 items-center gap-1.5">
                                  <span
                                    className="h-7 w-7 border border-black/10 bg-gradient-to-br from-indigo-400 to-violet-500"
                                    style={{
                                      borderRadius: `${t.radius?.md ?? 8}px`,
                                      boxShadow: t.shadow?.[1] ?? "none",
                                    }}
                                  />
                                  <span
                                    className="text-[13px] font-black text-gray-700 dark:text-gray-200"
                                    style={{ fontFamily: t.typography?.sans }}
                                  >
                                    Aa
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[11px] font-black text-gray-900 dark:text-white">
                                    {preset.name}
                                  </p>
                                  <p className="line-clamp-2 text-[10px] leading-snug text-gray-400">
                                    {preset.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <TokenControls
                          key={`${designSystem.id}-${tokenNonce}`}
                          tokens={designSystem.tokens}
                          onChange={handleTokenChange}
                        />
                      </section>
                    )}

                    {/* Preview */}
                    <section className="space-y-5">
                      <SectionHeader
                        icon={Eye}
                        color="bg-emerald-500 shadow-emerald-500/20"
                        title="Visual Preview"
                        subtitle="Your tokens applied to a realistic interface."
                      />
                      {designSystem && (
                        <BrandPreview
                          designSystem={designSystem}
                          onColorChange={handleColorChange}
                        />
                      )}
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
                              <p className="text-[10px] text-gray-400">
                                {c.intent}
                              </p>
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
                                          system.roles[
                                            u.token.replace("--", "")
                                          ],
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
                      <TokenOutput
                        system={system}
                        designSystem={designSystem ?? undefined}
                      />
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

/**
 * Rebuild a Palette for a saved system whose source palette isn't in the
 * dataset (e.g. an imported one). Colors come from the saved chart series or
 * brand tokens; the saved tokens are overlaid on load, so exact colors are
 * preserved regardless — this only feeds the regenerated narrative/roles.
 */
function syntheticPalette(saved: SavedDesignSystem): Palette {
  const light = saved.tokens.color.light;
  const hexes = (
    saved.tokens.chart?.length
      ? saved.tokens.chart
      : [
          light["brand-primary"],
          light["brand-secondary"],
          light["brand-accent"],
        ]
  ).filter(Boolean);
  return {
    id: saved.paletteId ?? `saved-${saved.id}`,
    name: saved.name,
    category: "Saved",
    count: hexes.length,
    colors: hexes.map((hex, i) => ({ name: `Color ${i + 1}`, hex })),
    tags: { mood: [], aesthetic: [] },
  };
}
