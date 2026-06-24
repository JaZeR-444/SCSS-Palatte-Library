"use client";

import { useStudio } from "./studio-context";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Shuffle,
  ArrowLeft,
  ArrowRight,
  Layout,
  ZoomIn,
  ZoomOut,
  Eye,
  Copy,
  Flame,
  Edit3,
  FolderPlus,
  Clock,
  Code2,
  Download,
  Layers,
} from "lucide-react";
import { ScenarioTabs } from "./scenario-tabs";
import { RoleConfigurator } from "./role-configurator";
import { ColorLab } from "./color-lab";
import { MoodScore } from "./mood-score";
import { DashboardScenario } from "./scenarios/dashboard";
import { SocialScenario } from "./scenarios/social";
import { LandingScenario } from "./scenarios/landing";
import { CommerceScenario } from "./scenarios/commerce";
import { MobileScenario } from "./scenarios/mobile";
import { TypographyScenario } from "./scenarios/typography";
import { SCENARIO_DESCRIPTIONS } from "@/types/studio";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";
import { getContrastRatio } from "@/utils/contrast-utils";
import palettesData from "@/data/palettes.json";
import { Palette } from "@/types";
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  getCollectionsAction,
  addPaletteToCollectionAction,
  getPaletteHistoryAction,
} from "@/app/actions";
import type { Collection, HistoryEntry } from "@/utils/db";

const VISION_OPTIONS = [
  { value: "", label: "Normal Vision" },
  { value: "protanopia", label: "Protanopia (Red-Blind)" },
  { value: "deuteranopia", label: "Deuteranopia (Green-Blind)" },
  { value: "tritanopia", label: "Tritanopia (Blue-Blind)" },
  { value: "achromatopsia", label: "Achromatopsia (No Color)" },
];

type CodeTab = "scss" | "css" | "tailwind";

function nameToVar(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateScss(palette: Palette): string {
  const mapName = nameToVar(palette.name) + "-map";
  const vars = palette.colors
    .map((c) => `$${nameToVar(c.name)}: ${c.hex.slice(0, 7)};`)
    .join("\n");
  const mapEntries = palette.colors
    .map((c) => `  "${nameToVar(c.name)}": ${c.hex.slice(0, 7)},`)
    .join("\n");
  return `// ${palette.name} — ${palette.count} Colors\n// SCSS Palette Library\n\n/* SCSS Variables */\n${vars}\n\n/* SCSS Map */\n$${mapName}: (\n${mapEntries}\n);`;
}

function generateCss(palette: Palette): string {
  const vars = palette.colors
    .map((c) => `  --${nameToVar(c.name)}: ${c.hex.slice(0, 7)};`)
    .join("\n");
  return `:root {\n${vars}\n}`;
}

function generateTailwind(palette: Palette): string {
  const entries = palette.colors
    .map((c) => `        '${nameToVar(c.name)}': '${c.hex.slice(0, 7)}',`)
    .join("\n");
  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries}\n      },\n    },\n  },\n};`;
}

function formatTimestamp(ts: string) {
  try {
    const utcStr = ts.includes("Z") || ts.includes("UTC") ? ts : `${ts} UTC`;
    const d = new Date(utcStr);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    return ts;
  }
}

function DiffViewer({ action, changesJson }: { action: string; changesJson: string }) {
  let changes: any = null;
  try {
    changes = JSON.parse(changesJson);
  } catch (e) {
    return <p className="text-red-400 italic text-[11px]">Invalid history data</p>;
  }

  if (action === "create") {
    return (
      <div className="space-y-2 mt-1">
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          Created palette <span className="font-bold text-gray-900 dark:text-white">{changes.name}</span> in category <span className="font-bold text-gray-900 dark:text-white">{changes.category || "None"}</span>.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(changes.colors || []).map((c: any, i: number) => (
            <div key={i} className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-slate-700/60 shadow-sm text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
              <span className="font-mono text-gray-500 dark:text-gray-400">{c.hex}</span>
              <span className="text-gray-400">({c.name})</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const before = changes?.before || {};
  const after = changes?.after || {};

  const diffs: React.ReactNode[] = [];

  if (before.name !== after.name) {
    diffs.push(
      <div key="name" className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 text-xs">
        <span className="font-bold shrink-0">Name:</span>
        <span className="line-through text-red-500 bg-red-500/10 px-1 rounded">{before.name}</span>
        <span className="text-gray-400">➔</span>
        <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded font-semibold">{after.name}</span>
      </div>
    );
  }

  if (before.category !== after.category) {
    diffs.push(
      <div key="category" className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 text-xs">
        <span className="font-bold shrink-0">Category:</span>
        <span className="line-through text-red-500 bg-red-500/10 px-1 rounded">{before.category || "None"}</span>
        <span className="text-gray-400">➔</span>
        <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded font-semibold">{after.category || "None"}</span>
      </div>
    );
  }

  if (before.description !== after.description) {
    diffs.push(
      <div key="description" className="text-gray-600 dark:text-gray-400 text-xs">
        <span className="font-bold mr-1.5">Description updated</span>
      </div>
    );
  }

  const beforeColors = before.colors || [];
  const afterColors = after.colors || [];
  const colorChanges: React.ReactNode[] = [];

  const maxLen = Math.max(beforeColors.length, afterColors.length);
  for (let i = 0; i < maxLen; i++) {
    const bCol = beforeColors[i];
    const aCol = afterColors[i];

    if (!bCol && aCol) {
      colorChanges.push(
        <div key={`col-add-${i}`} className="flex items-center gap-1 text-[10px] text-emerald-500">
          <span className="font-bold">Added:</span>
          <div className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: aCol.hex }} />
          <span className="font-mono">{aCol.hex}</span>
          <span>({aCol.name})</span>
        </div>
      );
    } else if (bCol && !aCol) {
      colorChanges.push(
        <div key={`col-rem-${i}`} className="flex items-center gap-1 text-[10px] text-red-500 line-through">
          <span className="font-bold">Removed:</span>
          <div className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: bCol.hex }} />
          <span className="font-mono">{bCol.hex}</span>
          <span>({bCol.name})</span>
        </div>
      );
    } else if (bCol.hex !== aCol.hex || bCol.name !== aCol.name) {
      colorChanges.push(
        <div key={`col-mod-${i}`} className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="font-bold text-gray-500">Color {i + 1}:</span>
          <div className="flex items-center gap-1 bg-red-500/10 text-red-500 line-through px-1.5 py-0.5 rounded-lg border border-red-500/10">
            <div className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: bCol.hex }} />
            <span className="font-mono">{bCol.hex}</span>
            <span className="opacity-70">({bCol.name})</span>
          </div>
          <span className="text-gray-400">➔</span>
          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-lg border border-emerald-500/10 font-medium">
            <div className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: aCol.hex }} />
            <span className="font-mono">{aCol.hex}</span>
            <span className="opacity-80">({aCol.name})</span>
          </div>
        </div>
      );
    }
  }

  if (colorChanges.length > 0) {
    diffs.push(
      <div key="colors" className="space-y-1.5">
        <span className="font-bold text-gray-600 dark:text-gray-400 block text-xs">Color Changes:</span>
        <div className="pl-3 border-l border-indigo-500/30 dark:border-indigo-500/20 space-y-1.5">
          {colorChanges}
        </div>
      </div>
    );
  }

  if (diffs.length === 0) {
    return <p className="text-gray-400 italic text-[11px]">No visible metadata or color changes detected.</p>;
  }

  return <div className="space-y-3 mt-2">{diffs}</div>;
}

export function StudioModal() {
  const {
    isOpen,
    closeStudio,
    openStudio,
    selectedPalette,
    activeScenario,
    shuffleRoles,
    zoom,
    setZoom,
    heatmapActive,
    toggleHeatmap,
    visionFilter,
    setVisionFilter,
    openCreator,
  } = useStudio();

  const palettes = palettesData as Palette[];
  const [codeTab, setCodeTab] = useState<CodeTab>("scss");

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const collectionsDropdownRef = useRef<HTMLDivElement>(null);

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Close collections dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        collectionsDropdownRef.current &&
        !collectionsDropdownRef.current.contains(e.target as Node)
      ) {
        setCollectionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Fetch collections when dropdown opens
  const handleToggleCollections = async () => {
    if (!collectionsOpen) {
      setLoadingCollections(true);
      try {
        const data = await getCollectionsAction();
        setCollections(data || []);
      } catch (err) {
        console.error("Failed to fetch collections:", err);
      } finally {
        setLoadingCollections(false);
      }
    }
    setCollectionsOpen(!collectionsOpen);
    playSound("click");
  };

  const handleAddToCollection = async (colId: string, colName: string) => {
    if (!selectedPalette) return;
    playSound("click");
    try {
      const res = await addPaletteToCollectionAction(colId, selectedPalette.id);
      if (res.success) {
        showToast(`Added to "${colName}"!`);
        playSound("success");
        setCollectionsOpen(false);
      } else {
        showToast(`Failed to add: ${res.error}`, "error");
      }
    } catch (err: any) {
      showToast(`Error adding to collection: ${err.message}`, "error");
    }
  };

  // Fetch history log for the active palette
  useEffect(() => {
    if (!selectedPalette) return;
    let active = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await getPaletteHistoryAction(selectedPalette.id);
        if (active) {
          setHistoryEntries(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch palette history:", err);
      } finally {
        if (active) {
          setLoadingHistory(false);
        }
      }
    };
    fetchHistory();
    return () => {
      active = false;
    };
  }, [selectedPalette?.id]);

  const currentIndex = useMemo(() => {
    if (!selectedPalette) return -1;
    return palettes.findIndex((p) => p.id === selectedPalette.id);
  }, [selectedPalette, palettes]);

  const relatedPalettes = useMemo(() => {
    if (!selectedPalette) return [];
    const categoryMatches = palettes.filter(
      (p) => p.id !== selectedPalette.id && p.category === selectedPalette.category
    );
    const tagMatches = palettes.filter((p) => {
      if (p.id === selectedPalette.id) return false;
      const moodIntersection = (p.tags?.mood ?? []).filter((t) =>
        (selectedPalette.tags?.mood ?? []).includes(t)
      );
      const aestheticIntersection = (p.tags?.aesthetic ?? []).filter((t) =>
        (selectedPalette.tags?.aesthetic ?? []).includes(t)
      );
      return moodIntersection.length > 0 || aestheticIntersection.length > 0;
    });
    const combined = Array.from(new Set([...tagMatches, ...categoryMatches]));
    return combined.slice(0, 6);
  }, [selectedPalette, palettes]);

  if (!selectedPalette) return null;

  const handleClose = () => {
    playSound("close");
    closeStudio();
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex !== -1) {
      playSound("open");
      openStudio(palettes[(currentIndex - 1 + palettes.length) % palettes.length]);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex !== -1) {
      playSound("open");
      openStudio(palettes[(currentIndex + 1) % palettes.length]);
    }
  };

  const handleRandom = () => {
    playSound("open");
    const target = palettes[Math.floor(Math.random() * palettes.length)];
    openStudio(target);
    showToast("Jumped to random palette!");
  };

  const downloadCode = () => {
    const ext = codeTab === "scss" ? "scss" : codeTab === "css" ? "css" : "js";
    const filename = `${nameToVar(selectedPalette.name)}.${ext}`;
    const blob = new Blob([codeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}!`);
    playSound("success");
  };

  const codeContent =
    codeTab === "scss"
      ? generateScss(selectedPalette)
      : codeTab === "css"
        ? generateCss(selectedPalette)
        : generateTailwind(selectedPalette);

  const scenarioFilterStyle =
    visionFilter ? { filter: `url(#filter-${visionFilter})` } : {};

  const renderScenario = () => {
    switch (activeScenario) {
      case "dashboard": return <DashboardScenario />;
      case "social": return <SocialScenario />;
      case "landing": return <LandingScenario />;
      case "commerce": return <CommerceScenario />;
      case "mobile": return <MobileScenario />;
      case "typography": return <TypographyScenario />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[95vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header Tools */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
              {/* Vision Simulator */}
              <div className="relative">
                <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 backdrop-blur-md border border-white/30 transition-all">
                  <Eye className="h-4 w-4 text-white" />
                  <select
                    value={visionFilter}
                    onChange={(e) => {
                      setVisionFilter(e.target.value);
                      playSound("click");
                    }}
                    className="bg-transparent text-white text-[11px] font-bold border-none outline-none cursor-pointer pr-1 max-w-[120px]"
                    title="Vision Simulator"
                  >
                    {VISION_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="text-gray-900 bg-white"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add to Collection Dropdown */}
              <div className="relative" ref={collectionsDropdownRef}>
                <button
                  onClick={handleToggleCollections}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/30 cursor-pointer flex items-center justify-center"
                  title="Add to Collection"
                >
                  <FolderPlus className="h-5 w-5" />
                </button>
                {collectionsOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800/80 shadow-2xl p-4 z-50 text-slate-800 dark:text-white text-xs space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                    <p className="font-black text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                      Add to Collection
                    </p>
                    {loadingCollections ? (
                      <div className="flex items-center justify-center py-4">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                      </div>
                    ) : collections.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 py-2 italic text-center text-[11px]">
                        No collections found. Create one on the main page!
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {collections.map((col) => (
                          <button
                            key={col.id}
                            onClick={() => handleAddToCollection(col.id, col.name)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-200 cursor-pointer font-bold flex items-center justify-between"
                          >
                            <span className="truncate mr-2">{col.name}</span>
                            <span className="text-[9px] opacity-60 font-medium shrink-0">
                              {col.palette_count} {col.palette_count === 1 ? "palette" : "palettes"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edit Palette */}
              <button
                onClick={() => {
                  playSound("click");
                  openCreator(selectedPalette);
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/30 cursor-pointer"
                title="Edit Palette"
              >
                <Edit3 className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  playSound("click");
                  shuffleRoles();
                  showToast("Roles shuffled!");
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/30 cursor-pointer"
                title="Shuffle Roles"
              >
                <Shuffle className="h-5 w-5" />
              </button>

              <button
                onClick={handleClose}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/30 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Mood Hero */}
              <div className="relative h-64 sm:h-80 bg-slate-950 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                <div className="absolute inset-0 flex">
                  {selectedPalette.colors.map((c, i) => (
                    <div
                      key={i}
                      className="flex-1 h-full"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <div className="absolute inset-0 bg-slate-950/40" />
                </div>

                <div className="relative z-10 space-y-4">
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                    {selectedPalette.name}
                  </h2>
                  <p className="text-white/80 max-w-lg mx-auto text-sm font-medium leading-relaxed">
                    {selectedPalette.description}
                  </p>
                  <MoodScore />
                </div>

                <button
                  onClick={handlePrev}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-md text-white transition-all cursor-pointer"
                  title="Previous Palette"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-md text-white transition-all cursor-pointer"
                  title="Next Palette"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 sm:p-10 space-y-12">
                {/* Palette Metadata */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {selectedPalette.count} Colors
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    {selectedPalette.category}
                  </span>
                  {(selectedPalette.tags?.mood ?? []).slice(0, 3).map((tag, i) => (
                    <span
                      key={`mood-${tag}-${i}`}
                      className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-[10px] font-bold capitalize text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50"
                    >
                      {tag}
                    </span>
                  ))}
                  {(selectedPalette.tags?.aesthetic ?? []).slice(0, 2).map((tag, i) => (
                    <span
                      key={`aesthetic-${tag}-${i}`}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold capitalize text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Scenario Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Layout className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold tracking-tight">
                          Thematic Studio
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {SCENARIO_DESCRIPTIONS[activeScenario]}
                        </p>
                      </div>
                    </div>
                    <ScenarioTabs />
                  </div>

                  {/* Scenario Toolbar */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-2xl p-1">
                      <button
                        onClick={() => { setZoom(zoom - 10); playSound("click"); }}
                        className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-all cursor-pointer"
                        title="Zoom Out"
                        disabled={zoom <= 50}
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 w-10 text-center">
                        {zoom}%
                      </span>
                      <button
                        onClick={() => { setZoom(zoom + 10); playSound("click"); }}
                        className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-all cursor-pointer"
                        title="Zoom In"
                        disabled={zoom >= 150}
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Heatmap Toggle */}
                      <button
                        onClick={() => { toggleHeatmap(); playSound("click"); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-[11px] font-bold border transition-all cursor-pointer ${
                          heatmapActive
                            ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-orange-300"
                        }`}
                        title="Toggle Contrast Heatmap"
                      >
                        <Flame className="h-3.5 w-3.5" />
                        Heatmap
                      </button>

                      {/* Random */}
                      <button
                        onClick={handleRandom}
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl text-[11px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-transparent hover:border-indigo-300 transition-all cursor-pointer"
                        title="Random Palette"
                      >
                        <Shuffle className="h-3.5 w-3.5" />
                        Random
                      </button>
                    </div>
                  </div>

                  {/* Scenario Preview */}
                  <div className="overflow-hidden rounded-[2.5rem] bg-gray-50/50 dark:bg-slate-950/30 border border-gray-100 dark:border-slate-800">
                    <div
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "top center",
                        transition: "transform 0.2s ease",
                        marginBottom: zoom < 100 ? `${(zoom - 100) * 3}px` : "0",
                        ...scenarioFilterStyle,
                      }}
                    >
                      <div className="p-8">{renderScenario()}</div>
                    </div>
                  </div>

                  {/* Heatmap: Contrast Matrix Panel */}
                  {heatmapActive && (
                    <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                        Contrast Matrix — Palette Pairs
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {selectedPalette.colors.flatMap((a, ai) =>
                          selectedPalette.colors.slice(ai + 1).map((b, bi) => {
                            const ratio: number = getContrastRatio(a.hex, b.hex);
                            const pass = ratio >= 4.5;
                            const aa = ratio >= 4.5 && ratio < 7;
                            const aaa = ratio >= 7;
                            return (
                              <div
                                key={`${ai}-${ai + 1 + bi}`}
                                className={`flex items-center gap-2 p-2 rounded-xl border ${
                                  aaa
                                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
                                    : aa
                                      ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50"
                                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
                                }`}
                              >
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10"
                                  style={{ background: a.hex }}
                                />
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10"
                                  style={{ background: b.hex }}
                                />
                                <span
                                  className={`text-[9px] font-black ${
                                    aaa
                                      ? "text-emerald-600"
                                      : aa
                                        ? "text-indigo-600"
                                        : "text-red-500"
                                  }`}
                                >
                                  {ratio.toFixed(1)}:1{" "}
                                  {aaa ? "AAA" : aa ? "AA" : "FAIL"}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Configuration */}
                <RoleConfigurator />

                {/* Code Export */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 flex-shrink-0">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">Code Export</h3>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Copy or download SCSS, CSS Variables, or Tailwind config.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20">
                      {(["scss", "css", "tailwind"] as CodeTab[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => { setCodeTab(tab); playSound("click"); }}
                          className={`px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                            codeTab === tab
                              ? "border-indigo-500 text-indigo-500 bg-white dark:bg-slate-900"
                              : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          }`}
                        >
                          {tab === "scss"
                            ? "SCSS"
                            : tab === "css"
                              ? "CSS Vars"
                              : "Tailwind"}
                        </button>
                      ))}
                      <div className="flex-1" />
                      <button
                        onClick={downloadCode}
                        className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold text-gray-400 hover:text-violet-500 transition-colors cursor-pointer border-r border-gray-100 dark:border-slate-800"
                        title="Download as file"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(codeContent);
                          showToast(
                            `${codeTab.toUpperCase()} copied to clipboard!`
                          );
                          playSound("success");
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>

                    {/* Code Block */}
                    <div className="bg-gray-950 rounded-b-3xl p-5 overflow-x-auto no-scrollbar">
                      <pre className="text-[11px] font-mono text-gray-300 leading-relaxed whitespace-pre">
                        {codeContent}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Color Lab */}
                <ColorLab />

                {/* History Log */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">
                        History Log
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Chronological changes and edit history.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[2.5rem] border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 p-6">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                      </div>
                    ) : historyEntries.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs italic">
                        No history logs found for this palette. Edits made in the Creator will appear here.
                      </div>
                    ) : (
                      <div className="relative pl-6 border-l border-indigo-500/20 dark:border-indigo-500/10 space-y-6">
                        {historyEntries.map((entry) => {
                          const isCreate = entry.action === "create";
                          return (
                            <div key={entry.id} className="relative">
                              {/* Timeline indicator node */}
                              <div
                                className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow flex items-center justify-center ${
                                  isCreate ? "bg-emerald-500" : "bg-indigo-500"
                                }`}
                              />
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                    {isCreate ? "Palette Created" : "Palette Edited"}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                    {formatTimestamp(entry.timestamp)}
                                  </span>
                                </div>
                                <DiffViewer action={entry.action} changesJson={entry.changes_json} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Palettes */}
                {relatedPalettes.length > 0 && (
                  <div className="space-y-6 pt-10 border-t border-gray-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold tracking-tight">
                          Related Palettes
                        </h4>
                        <p className="text-[11px] text-gray-400 font-medium">
                          Explore other palettes in the same style, mood, or category.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
                      {relatedPalettes.map((p) => (
                        <div
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound("open");
                            openStudio(p);
                          }}
                          className="flex-shrink-0 snap-start group cursor-pointer bg-gray-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-4 w-48 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 mb-3 shadow-inner">
                            {p.colors.map((c, idx) => (
                              <div
                                key={idx}
                                className="flex-1 h-full"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-black text-gray-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">
                            {p.category}
                          </p>
                        </div>
                      ))}
                    </div>
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
