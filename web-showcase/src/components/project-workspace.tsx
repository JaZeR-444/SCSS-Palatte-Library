"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Check,
  X,
  Plus,
  Search,
  Trash2,
  Wand2,
  ExternalLink,
  Layers,
  Unlink,
  Copy,
  Sparkles,
  LayoutGrid,
  Palette as PaletteIcon,
  Network,
  Target,
  LayoutDashboard,
  SlidersHorizontal,
  BarChart2,
  Sun,
  Megaphone,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { PaletteCard } from "@/components/palette-card";
import { FounderOsDemo } from "@/components/founder-os-demo";
import { BrandSystemComposer } from "@/components/brand-system/brand-system-composer";
import { useStudio } from "@/components/studio/studio-context";
import { Palette } from "@/types";
import { SavedDesignSystem } from "@/types/design-system";
import { analyzePalette } from "@/utils/palette-metrics";
import { buildRoleMapping } from "@/utils/role-mapping";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";

interface Preset {
  id: string;
  name: string;
  palette_id: string;
  mapping: Record<string, string>;
}

interface ProjectWorkspaceProps {
  slug: string;
  name: string;
  type: string;
  description: string;
  palettes: Palette[];
  manualIds: string[];
  presets: Preset[];
  designSystems: SavedDesignSystem[];
}

type SortKey = "quality" | "name" | "count";

/** Ordered swatch category tabs for design-system projects */
const SWATCH_TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: PaletteIcon },
  { id: "system-map", label: "System Map", icon: Network },
  { id: "aesthetics", label: "Aesthetics", icon: Sparkles },
  { id: "brand-scale", label: "Brand Scale", icon: Target },
  { id: "surfaces", label: "Surfaces", icon: LayoutDashboard },
  { id: "component-states", label: "Component States", icon: SlidersHorizontal },
  { id: "data", label: "Data & Charts", icon: BarChart2 },
  { id: "gradients", label: "Gradients", icon: Sun },
  { id: "marketing", label: "Marketing", icon: Megaphone },
];

export function ProjectWorkspace({
  slug,
  name,
  type,
  description,
  palettes: initialPalettes,
  manualIds: initialManualIds,
  presets: initialPresets,
  designSystems: initialDesignSystems,
}: ProjectWorkspaceProps) {
  const { openStudio, openBrandSystemWithSystem } = useStudio();

  const [palettes, setPalettes] = useState<Palette[]>(initialPalettes);
  const [manualIds, setManualIds] = useState<Set<string>>(
    new Set(initialManualIds),
  );
  const [presets, setPresets] = useState<Preset[]>(initialPresets);
  const [sort, setSort] = useState<SortKey>("quality");

  // Saved design systems: attached to this project + others available to attach.
  const [attachedSystems, setAttachedSystems] =
    useState<SavedDesignSystem[]>(initialDesignSystems);
  const [availableSystems, setAvailableSystems] = useState<SavedDesignSystem[]>(
    [],
  );
  const [attachId, setAttachId] = useState("");
  // In-project brand system composer (per-color role assignment).
  const [composer, setComposer] = useState<{
    initial?: SavedDesignSystem;
  } | null>(null);

  const reloadSystems = async () => {
    const { listDesignSystemsAction } = await import("@/app/actions");
    const all = await listDesignSystemsAction();
    setAttachedSystems(all.filter((s) => s.projectSlug === slug));
    setAvailableSystems(all.filter((s) => s.projectSlug !== slug));
  };

  useEffect(() => {
    reloadSystems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const attachSystem = async () => {
    if (!attachId) return;
    const { setDesignSystemProjectAction } = await import("@/app/actions");
    await setDesignSystemProjectAction(attachId, slug);
    setAttachId("");
    await reloadSystems();
    playSound("success");
    showToast("Design system attached");
  };

  const detachSystem = async (id: string) => {
    const { setDesignSystemProjectAction } = await import("@/app/actions");
    await setDesignSystemProjectAction(id, null);
    await reloadSystems();
    playSound("click");
    showToast("Detached from project");
  };

  // Composed (in-project) systems reopen in the composer; single-palette
  // systems open the standalone Brand System modal.
  const applySystem = (id: string) => {
    const sys = attachedSystems.find((s) => s.id === id);
    playSound("open");
    if (sys?.composed) setComposer({ initial: sys });
    else openBrandSystemWithSystem(id);
  };

  const openComposer = () => {
    playSound("open");
    setComposer({});
  };

  // meta editing
  const [meta, setMeta] = useState({ type, description });
  const [editing, setEditing] = useState(false);
  const [typeInput, setTypeInput] = useState(type);
  const [descInput, setDescInput] = useState(description);

  // add-palettes dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<Palette[]>([]);

  // preset creation
  const [presetPaletteId, setPresetPaletteId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

  // Close the add-palettes dialog on Escape (matches the app's other dialogs).
  useEffect(() => {
    if (!addOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addOpen]);

  const uiReadinessById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of palettes) map[p.id] = analyzePalette(p).uiReadiness;
    return map;
  }, [palettes]);

  const sorted = useMemo(() => {
    const arr = [...palettes];
    if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "count") arr.sort((a, b) => b.count - a.count);
    else
      arr.sort(
        (a, b) => (uiReadinessById[b.id] ?? 0) - (uiReadinessById[a.id] ?? 0),
      );
    return arr;
  }, [palettes, sort, uiReadinessById]);

  // Detect whether this project has swatch-typed palettes
  const hasSwatchTypes = useMemo(
    () => palettes.some((p) => !!p.swatchType),
    [palettes],
  );

  const [activeTab, setActiveTab] = useState("all");

  // Tabs visible for this project (only tabs that have at least 1 palette)
  const visibleTabs = useMemo(() => {
    if (!hasSwatchTypes) return [];
    const presentTypes = new Set(palettes.map((p) => p.swatchType ?? ""));
    const tabs = SWATCH_TABS.filter(
      (t) => t.id === "all" || presentTypes.has(t.id),
    );
    if (slug === "founder-os") {
      tabs.push({ id: "demo", label: "Live Dashboard Demo", icon: Monitor });
    }
    return tabs;
  }, [hasSwatchTypes, palettes, slug]);

  // Filtered + sorted list based on active tab
  const displayed = useMemo(() => {
    const base =
      activeTab === "all" || !hasSwatchTypes
        ? sorted
        : sorted.filter((p) => p.swatchType === activeTab);
    return base;
  }, [sorted, activeTab, hasSwatchTypes]);

  // Copy all CSS custom properties from a palette as a token block
  const copyCssTokens = (palette: (typeof palettes)[0]) => {
    const lines = palette.colors
      .map((c) => `  ${c.name}: ${c.hex};`)
      .join("\n");
    const block = `:root {\n/* ${palette.name} */\n${lines}\n}`;
    navigator.clipboard.writeText(block).then(() => {
      playSound("success");
      showToast(`Copied CSS tokens for ${palette.name}`);
    });
  };

  const saveMeta = async () => {
    const { updateProjectMetaAction } = await import("@/app/actions");
    const res = await updateProjectMetaAction(
      slug,
      typeInput.trim(),
      descInput.trim(),
    );
    if (res.success) {
      setMeta({ type: typeInput.trim(), description: descInput.trim() });
      setEditing(false);
      playSound("success");
      showToast("Project updated");
    } else {
      showToast(res.error || "Could not update project.", "error");
    }
  };

  const runSearch = async (q: string) => {
    setAddQuery(q);
    if (!q.trim()) {
      setAddResults([]);
      return;
    }
    const { searchPalettesAction } = await import("@/app/actions");
    const res = await searchPalettesAction(q.trim());
    const existing = new Set(palettes.map((p) => p.id));
    setAddResults(res.filter((p) => !existing.has(p.id)).slice(0, 24));
  };

  const addPalette = async (palette: Palette) => {
    const { addPaletteToProjectAction } = await import("@/app/actions");
    const res = await addPaletteToProjectAction(slug, palette.id);
    if (res.success) {
      setPalettes((prev) =>
        [...prev, palette].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setManualIds((prev) => new Set(prev).add(palette.id));
      setAddResults((prev) => prev.filter((p) => p.id !== palette.id));
      playSound("success");
      showToast(`Added ${palette.name}`);
    } else {
      showToast(res.error || "Could not add palette.", "error");
    }
  };

  const removePalette = async (id: string) => {
    const { removePaletteFromProjectAction } = await import("@/app/actions");
    const res = await removePaletteFromProjectAction(slug, id);
    if (res.success) {
      setPalettes((prev) => prev.filter((p) => p.id !== id));
      setManualIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setPresets((prev) => prev.filter((pr) => pr.palette_id !== id));
      playSound("click");
      showToast("Removed from project");
    }
  };

  const createPreset = async () => {
    const palette = palettes.find((p) => p.id === presetPaletteId);
    if (!palette || !presetName.trim()) {
      showToast("Pick a palette and name the preset.", "error");
      return;
    }
    setSavingPreset(true);
    try {
      const mapping = buildRoleMapping(
        palette.colors.map((c) => c.hex.slice(0, 7)),
      );
      const { createProjectPresetAction, getProjectPresetsAction } =
        await import("@/app/actions");
      const res = await createProjectPresetAction(
        slug,
        presetName.trim(),
        palette.id,
        mapping,
      );
      if (res.success) {
        setPresets((await getProjectPresetsAction(slug)) as Preset[]);
        setPresetName("");
        setPresetPaletteId("");
        playSound("success");
        showToast("Role preset saved");
      } else {
        showToast(res.error || "Could not save preset.", "error");
      }
    } finally {
      setSavingPreset(false);
    }
  };

  const applyPreset = async (preset: Preset) => {
    const palette = palettes.find((p) => p.id === preset.palette_id);
    if (!palette) {
      showToast("That palette is no longer in this project.", "error");
      return;
    }
    const { saveRoleMappingAction } = await import("@/app/actions");
    await saveRoleMappingAction(preset.palette_id, preset.mapping);
    playSound("open");
    openStudio(palette);
  };

  const deletePreset = async (id: string) => {
    const { deleteProjectPresetAction } = await import("@/app/actions");
    await deleteProjectPresetAction(slug, id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
    playSound("click");
  };

  const paletteName = (id: string) =>
    palettes.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="space-y-8">
      {/* Meta bar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        {editing ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex-shrink-0 sm:w-48">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Type
                </span>
                <input
                  value={typeInput}
                  onChange={(e) => setTypeInput(e.target.value)}
                  placeholder="Web App, CRM, Desktop…"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Description
                </span>
                <input
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="What is this product?"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setTypeInput(meta.type);
                  setDescInput(meta.description);
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-slate-800 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveMeta}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <Check className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400">
                  {meta.type || "Product"}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {meta.description || "No description yet."}
              </p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:text-gray-400"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Swatch type tabs (shown when project has swatchType data) */}
      {hasSwatchTypes && visibleTabs.length > 1 && (
        <div className="-mx-0.5 flex flex-wrap gap-1.5">
      {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors active:scale-95 focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                activeTab === tab.id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-400"
                  : "border-gray-200 bg-white text-gray-500 hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-cyan-500/50 dark:hover:text-cyan-400"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              {tab.label}
              <span className="rounded-md bg-gray-100 px-1 py-0.5 text-[10px] font-black text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                {tab.id === "demo"
                  ? "UI"
                  : tab.id === "all"
                    ? palettes.length
                    : palettes.filter((p) => p.swatchType === tab.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            Sort
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300"
            aria-label="Sort palettes"
          >
            <option value="quality">Best quality</option>
            <option value="name">Name (A–Z)</option>
            <option value="count">Most colors</option>
          </select>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add palettes
        </button>
      </div>

      {/* Role presets */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-black text-gray-900 dark:text-white">
            Role presets
          </h2>
          <span className="text-xs text-gray-400">
            Saved UI-role mappings for {name}
          </span>
        </div>

        {presets.length > 0 && (
          <ul className="mb-4 space-y-1.5">
            {presets.map((preset) => (
              <li
                key={preset.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    {preset.name}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    from {paletteName(preset.palette_id)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => applyPreset(preset)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/60 dark:bg-slate-900 dark:text-indigo-400"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Apply &amp; open
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                    aria-label={`Delete preset ${preset.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={presetPaletteId}
            onChange={(e) => setPresetPaletteId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs font-bold text-gray-700 dark:border-slate-800 dark:bg-slate-950 dark:text-gray-300"
            aria-label="Palette for preset"
          >
            <option value="">Choose a palette…</option>
            {palettes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name (e.g. Default tokens)"
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
          />
          <button
            onClick={createPreset}
            disabled={savingPreset}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-gray-300"
          >
            {savingPreset ? (
              <svg
                className="h-3.5 w-3.5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {savingPreset ? "Saving…" : "Save preset"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          A preset auto-maps the chosen palette&rsquo;s colors to UI roles
          (background, text, brand, states). Apply it to jump into the studio
          with that mapping.
        </p>
      </div>

      {/* Design systems (full, reusable Brand System artifacts) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-black text-gray-900 dark:text-white">
            Design systems
          </h2>
          <span className="text-xs text-gray-400">
            Full brand systems attached to {name}
          </span>
        </div>

        {attachedSystems.length > 0 ? (
          <ul className="mb-4 space-y-1.5">
            {attachedSystems.map((ds) => (
              <li
                key={ds.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    {ds.name}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    {ds.mode} mode
                    {ds.updatedAt
                      ? ` · updated ${ds.updatedAt.slice(0, 10)}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => applySystem(ds.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/60 dark:bg-slate-900 dark:text-indigo-400"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </button>
                  <button
                    onClick={() => detachSystem(ds.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                    aria-label={`Detach ${ds.name} from project`}
                    title="Detach from project"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-[11px] text-gray-400">
            No design systems attached yet. Build one in the Brand System modal
            (Save it), then attach it here.
          </p>
        )}

        {availableSystems.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={attachId}
              onChange={(e) => setAttachId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs font-bold text-gray-700 dark:border-slate-800 dark:bg-slate-950 dark:text-gray-300"
              aria-label="Design system to attach"
            >
              <option value="">Attach an existing system…</option>
              {availableSystems.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                  {ds.projectSlug ? ` (in ${ds.projectSlug})` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={attachSystem}
              disabled={!attachId}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-800 dark:text-gray-300"
            >
              <Layers className="h-3.5 w-3.5" />
              Attach
            </button>
          </div>
        )}
      </div>

      {/* Palette grid or Demo */}
      {activeTab === "demo" && slug === "founder-os" ? (
        <FounderOsDemo />
      ) : displayed.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400">
          No palettes in this project yet. Use{" "}
          <span className="font-bold">Add palettes</span> to bring some in.
        </p>
      ) : (
        <div className="space-y-8">
          {/* When tabs are active and not on 'all', show a category header */}
          {hasSwatchTypes &&
            activeTab !== "all" &&
            (() => {
              const tab = SWATCH_TABS.find((t) => t.id === activeTab);
              return tab ? (
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3 dark:border-slate-800">
                  <tab.icon className="h-4 w-4 text-indigo-500 dark:text-cyan-400" />
                  <h2 className="text-sm font-black text-gray-900 dark:text-white">{tab.label}</h2>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {displayed.length} swatch
                    {displayed.length !== 1 ? "es" : ""}
                  </span>
                </div>
              ) : null;
            })()}

          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayed.map((palette) => (
              <div key={palette.id} className="relative">
                {manualIds.has(palette.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePalette(palette.id);
                    }}
                    className="absolute -right-2 -top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-md transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-rose-950/40"
                    title="Remove from project"
                    aria-label={`Remove ${palette.name} from project`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}

                {/* Swatch type badge */}
                {palette.swatchType && (
                  <div className="absolute left-2 top-2 z-10">
                    <span className="rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-400 backdrop-blur-sm">
                      {palette.swatchType}
                    </span>
                  </div>
                )}

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    playSound("open");
                    openStudio(palette);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      playSound("open");
                      openStudio(palette);
                    }
                  }}
                  aria-label={`Open ${palette.name} palette`}
                  className="cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-500"
                >
                  <PaletteCard
                    palette={palette}
                    isFavorite={false}
                    onToggleFavorite={() => {}}
                    viewMode="grid"
                    qualityScore={uiReadinessById[palette.id]}
                  />
                </div>

                {/* Copy CSS tokens button — shown for swatch-typed palettes */}
                {palette.swatchType && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCssTokens(palette);
                    }}
                    title="Copy as CSS custom property token block"
                    className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 py-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:border-cyan-500/60 hover:text-cyan-400"
                  >
                    <Copy className="h-3 w-3" />
                    Copy CSS Tokens
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add-palettes dialog */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pt-20"
          onClick={() => setAddOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add palettes to project"
            className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Add palettes to {name}
              </h3>
              <button
                onClick={() => setAddOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={addQuery}
                onChange={(e) => runSearch(e.target.value)}
                placeholder="Search palettes to add…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
              {addResults.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  {addQuery.trim()
                    ? "No matches (or already in project)."
                    : "Type to search the full library."}
                </p>
              ) : (
                addResults.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-7 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-100 dark:border-slate-800">
                        {p.colors.slice(0, 8).map((c, i) => (
                          <span
                            key={i}
                            className="flex-1"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                          {p.name}
                        </p>
                        <p className="truncate text-[11px] text-gray-400">
                          {p.count} colors · {p.category}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addPalette(p)}
                      className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-indigo-700"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
