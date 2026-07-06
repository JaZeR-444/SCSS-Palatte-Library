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
  Check,
  Flame,
  Edit3,
  FolderPlus,
  Clock,
  Code2,
  Download,
  Layers,
  Sparkles,
  Braces,
  AlertTriangle,
  ChevronRight,
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
import { SCENARIO_DESCRIPTIONS, ROLE_META, ROLE_COUNT } from "@/types/studio";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";
import { getContrastRatio, getLuminanceValue } from "@/utils/contrast-utils";
import { computeRoleIssues } from "@/utils/role-mapping";
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

type CodeTab = "scss" | "css" | "tailwind" | "json";

const STUDIO_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "design", label: "Design" },
  { id: "contrast", label: "Contrast" },
  { id: "export", label: "Export" },
];

function nameToVar(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type TokenEntry = { key: string; hex: string };

/** Raw palette colors keyed by their descriptive names. */
function paletteEntries(palette: Palette): TokenEntry[] {
  return palette.colors.map((c) => ({
    key: nameToVar(c.name),
    hex: c.hex.slice(0, 7),
  }));
}

/** Role-mapped, semantic tokens (bg-canvas, text-base, primary, …). */
function semanticEntries(roleMapping: Record<string, string>): TokenEntry[] {
  return ROLE_META.map((role, i) => ({
    key: nameToVar(role.name),
    hex: (roleMapping[`--ui-color-${i + 1}`] || "#000000").slice(0, 7),
  }));
}

function generateScss(entries: TokenEntry[], name: string): string {
  const mapName = nameToVar(name) + "-map";
  const vars = entries.map((e) => `$${e.key}: ${e.hex};`).join("\n");
  const mapEntries = entries.map((e) => `  "${e.key}": ${e.hex},`).join("\n");
  return `// ${name}\n// SCSS Palette Library\n\n/* SCSS Variables */\n${vars}\n\n/* SCSS Map */\n$${mapName}: (\n${mapEntries}\n);`;
}

function generateCss(entries: TokenEntry[]): string {
  const vars = entries.map((e) => `  --${e.key}: ${e.hex};`).join("\n");
  return `:root {\n${vars}\n}`;
}

function generateTailwind(entries: TokenEntry[]): string {
  const lines = entries
    .map((e) => `        '${e.key}': '${e.hex}',`)
    .join("\n");
  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines}\n      },\n    },\n  },\n};`;
}

/** W3C-style design tokens JSON. */
function generateJson(entries: TokenEntry[]): string {
  const obj: Record<string, unknown> = {};
  entries.forEach((e) => {
    obj[e.key] = { $value: e.hex, $type: "color" };
  });
  return JSON.stringify({ color: obj }, null, 2);
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

function DiffViewer({
  action,
  changesJson,
}: {
  action: string;
  changesJson: string;
}) {
  let changes: any = null;
  try {
    changes = JSON.parse(changesJson);
  } catch (e) {
    return (
      <p className="text-red-400 italic text-[11px]">Invalid history data</p>
    );
  }

  if (action === "create") {
    return (
      <div className="space-y-2 mt-1">
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          Created palette{" "}
          <span className="font-bold text-gray-900 dark:text-white">
            {changes.name}
          </span>{" "}
          in category{" "}
          <span className="font-bold text-gray-900 dark:text-white">
            {changes.category || "None"}
          </span>
          .
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(changes.colors || []).map((c: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-slate-700/60 shadow-sm text-[10px]"
            >
              <div
                className="w-2.5 h-2.5 rounded-full border border-black/10"
                style={{ backgroundColor: c.hex }}
              />
              <span className="font-mono text-gray-500 dark:text-gray-400">
                {c.hex}
              </span>
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
      <div
        key="name"
        className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 text-xs"
      >
        <span className="font-bold shrink-0">Name:</span>
        <span className="line-through text-red-500 bg-red-500/10 px-1 rounded">
          {before.name}
        </span>
        <span className="text-gray-400">➔</span>
        <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded font-semibold">
          {after.name}
        </span>
      </div>,
    );
  }

  if (before.category !== after.category) {
    diffs.push(
      <div
        key="category"
        className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 text-xs"
      >
        <span className="font-bold shrink-0">Category:</span>
        <span className="line-through text-red-500 bg-red-500/10 px-1 rounded">
          {before.category || "None"}
        </span>
        <span className="text-gray-400">➔</span>
        <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded font-semibold">
          {after.category || "None"}
        </span>
      </div>,
    );
  }

  if (before.description !== after.description) {
    diffs.push(
      <div
        key="description"
        className="text-gray-600 dark:text-gray-400 text-xs"
      >
        <span className="font-bold mr-1.5">Description updated</span>
      </div>,
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
        <div
          key={`col-add-${i}`}
          className="flex items-center gap-1 text-[10px] text-emerald-500"
        >
          <span className="font-bold">Added:</span>
          <div
            className="w-2.5 h-2.5 rounded-full border border-black/10"
            style={{ backgroundColor: aCol.hex }}
          />
          <span className="font-mono">{aCol.hex}</span>
          <span>({aCol.name})</span>
        </div>,
      );
    } else if (bCol && !aCol) {
      colorChanges.push(
        <div
          key={`col-rem-${i}`}
          className="flex items-center gap-1 text-[10px] text-red-500 line-through"
        >
          <span className="font-bold">Removed:</span>
          <div
            className="w-2.5 h-2.5 rounded-full border border-black/10"
            style={{ backgroundColor: bCol.hex }}
          />
          <span className="font-mono">{bCol.hex}</span>
          <span>({bCol.name})</span>
        </div>,
      );
    } else if (bCol.hex !== aCol.hex || bCol.name !== aCol.name) {
      colorChanges.push(
        <div
          key={`col-mod-${i}`}
          className="flex flex-wrap items-center gap-1.5 text-[10px]"
        >
          <span className="font-bold text-gray-500">Color {i + 1}:</span>
          <div className="flex items-center gap-1 bg-red-500/10 text-red-500 line-through px-1.5 py-0.5 rounded-lg border border-red-500/10">
            <div
              className="w-2 h-2 rounded-full border border-black/10"
              style={{ backgroundColor: bCol.hex }}
            />
            <span className="font-mono">{bCol.hex}</span>
            <span className="opacity-70">({bCol.name})</span>
          </div>
          <span className="text-gray-400">➔</span>
          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-lg border border-emerald-500/10 font-medium">
            <div
              className="w-2 h-2 rounded-full border border-black/10"
              style={{ backgroundColor: aCol.hex }}
            />
            <span className="font-mono">{aCol.hex}</span>
            <span className="opacity-80">({aCol.name})</span>
          </div>
        </div>,
      );
    }
  }

  if (colorChanges.length > 0) {
    diffs.push(
      <div key="colors" className="space-y-1.5">
        <span className="font-bold text-gray-600 dark:text-gray-400 block text-xs">
          Color Changes:
        </span>
        <div className="pl-3 border-l border-indigo-500/30 dark:border-indigo-500/20 space-y-1.5">
          {colorChanges}
        </div>
      </div>,
    );
  }

  if (diffs.length === 0) {
    return (
      <p className="text-gray-400 italic text-[11px]">
        No visible metadata or color changes detected.
      </p>
    );
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
    openBrandSystem,
    roleMapping,
  } = useStudio();

  const palettes = palettesData as Palette[];
  const [codeTab, setCodeTab] = useState<CodeTab>("scss");
  const [useSemantic, setUseSemantic] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPalette, setCopiedPalette] = useState(false);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const collectionsDropdownRef = useRef<HTMLDivElement>(null);

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // True tabs: only the active panel renders, so each workflow is focused.
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

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

  // Close on Escape and trap-then-restore focus for accessible dialog behavior.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeStudio();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // Move focus into the dialog on open.
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, closeStudio]);

  // Switching palettes returns you to the Overview workspace.
  useEffect(() => {
    setActiveTab("overview");
  }, [selectedPalette?.id]);

  // Scroll the panel back to the top whenever the active tab changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  const currentIndex = useMemo(() => {
    if (!selectedPalette) return -1;
    return palettes.findIndex((p) => p.id === selectedPalette.id);
  }, [selectedPalette, palettes]);

  const relatedPalettes = useMemo(() => {
    if (!selectedPalette) return [];
    const categoryMatches = palettes.filter(
      (p) =>
        p.id !== selectedPalette.id && p.category === selectedPalette.category,
    );
    const tagMatches = palettes.filter((p) => {
      if (p.id === selectedPalette.id) return false;
      const moodIntersection = (p.tags?.mood ?? []).filter((t) =>
        (selectedPalette.tags?.mood ?? []).includes(t),
      );
      const aestheticIntersection = (p.tags?.aesthetic ?? []).filter((t) =>
        (selectedPalette.tags?.aesthetic ?? []).includes(t),
      );
      return moodIntersection.length > 0 || aestheticIntersection.length > 0;
    });
    const combined = Array.from(new Set([...tagMatches, ...categoryMatches]));
    return combined.slice(0, 6);
  }, [selectedPalette, palettes]);

  // Headline accessibility read: how many unique color pairs reach AA text.
  const a11ySummary = useMemo(() => {
    if (!selectedPalette) return { pass: 0, total: 0 };
    const cols = selectedPalette.colors;
    let pass = 0;
    let total = 0;
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        total++;
        if (getContrastRatio(cols[i].hex, cols[j].hex) >= 4.5) pass++;
      }
    }
    return { pass, total };
  }, [selectedPalette]);

  // The hero paints white text over the raw palette bands. A flat scrim that
  // reads well on dark palettes (0.40) fails on light/pastel ones (~2.8:1), so
  // scale the slate-950 overlay by average luminance to keep the title legible
  // across every palette while preserving vibrancy on dark sets.
  const heroOverlayAlpha = useMemo(() => {
    if (!selectedPalette || selectedPalette.colors.length === 0) return 0.45;
    const avg =
      selectedPalette.colors.reduce(
        (sum, c) => sum + getLuminanceValue(c.hex),
        0,
      ) / selectedPalette.colors.length;
    return Math.min(0.66, Math.max(0.4, 0.4 + avg * 0.28));
  }, [selectedPalette]);

  // Role tokens that fail contrast — powers the health summary + tab badges.
  const roleFailures = useMemo(
    () => computeRoleIssues(roleMapping),
    [roleMapping],
  );

  useEffect(() => {
    if (!copiedCode) return;
    const timeout = window.setTimeout(() => setCopiedCode(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedCode]);

  useEffect(() => {
    if (!copiedPalette) return;
    const timeout = window.setTimeout(() => setCopiedPalette(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedPalette]);

  if (!selectedPalette) return null;

  const handleClose = () => {
    playSound("close");
    closeStudio();
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex !== -1) {
      playSound("open");
      openStudio(
        palettes[(currentIndex - 1 + palettes.length) % palettes.length],
      );
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

  const copyPalette = async () => {
    const value = selectedPalette.colors
      .map((color) => color.hex.slice(0, 7))
      .join(", ");
    await navigator.clipboard.writeText(value);
    setCopiedPalette(true);
    showToast("Palette colors copied!");
    playSound("success");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(codeContent);
    setCopiedCode(true);
    showToast(`${codeTab.toUpperCase()} copied to clipboard!`);
    playSound("success");
  };

  const exportEntries = useSemantic
    ? semanticEntries(roleMapping)
    : paletteEntries(selectedPalette);

  const exportFilename = `${nameToVar(selectedPalette.name)}${
    useSemantic ? "-tokens" : ""
  }.${
    codeTab === "scss"
      ? "scss"
      : codeTab === "css"
        ? "css"
        : codeTab === "json"
          ? "json"
          : "js"
  }`;

  const downloadCode = () => {
    const blob = new Blob([codeContent], {
      type: codeTab === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${exportFilename}`);
    playSound("success");
  };

  const codeContent =
    codeTab === "scss"
      ? generateScss(
          exportEntries,
          useSemantic
            ? `${selectedPalette.name} — Design Tokens`
            : `${selectedPalette.name} — ${selectedPalette.count} Colors`,
        )
      : codeTab === "css"
        ? generateCss(exportEntries)
        : codeTab === "json"
          ? generateJson(exportEntries)
          : generateTailwind(exportEntries);

  const scenarioFilterStyle = visionFilter
    ? { filter: `url(#filter-${visionFilter})` }
    : {};

  const renderScenario = () => {
    switch (activeScenario) {
      case "dashboard":
        return <DashboardScenario />;
      case "social":
        return <SocialScenario />;
      case "landing":
        return <LandingScenario />;
      case "commerce":
        return <CommerceScenario />;
      case "mobile":
        return <MobileScenario />;
      case "typography":
        return <TypographyScenario />;
      default:
        return null;
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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedPalette.name} palette studio`}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[95vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col outline-none"
          >
            {/* Header Tools — float over the persistent dark hero, so the
                white controls stay legible and never overlap the section tabs. */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-1.5 rounded-full p-1.5 sm:top-6 sm:right-6 sm:gap-2">
              {/* Vision Simulator — icon-only on mobile, labelled from sm up */}
              <div className="relative">
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-2.5 backdrop-blur-md border transition-all sm:px-3 sm:py-2 ${
                    visionFilter
                      ? "bg-indigo-500/90 border-indigo-300"
                      : "bg-white/10 hover:bg-white/20 border-white/30"
                  }`}
                  title="Simulate color-vision deficiencies across the preview"
                >
                  <Eye className="h-4 w-4 text-white" />
                  {visionFilter && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-slate-900 bg-emerald-400 sm:hidden" />
                  )}
                  <select
                    value={visionFilter}
                    onChange={(e) => {
                      setVisionFilter(e.target.value);
                      playSound("click");
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer border-none bg-transparent text-transparent opacity-0 outline-none sm:relative sm:inset-auto sm:h-auto sm:w-auto sm:max-w-[120px] sm:pr-1 sm:text-[11px] sm:font-bold sm:text-white sm:opacity-100"
                    aria-label="Vision simulator — preview the palette as color-blind users see it"
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
                  className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/30 cursor-pointer flex items-center justify-center"
                  title="Add to Collection"
                >
                  <FolderPlus className="h-5 w-5" />
                </button>
                {collectionsOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800/80 shadow-2xl p-4 z-50 text-slate-800 dark:text-white text-xs space-y-2 max-h-60 overflow-y-auto subtle-scrollbar">
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
                            onClick={() =>
                              handleAddToCollection(col.id, col.name)
                            }
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-200 cursor-pointer font-bold flex items-center justify-between"
                          >
                            <span className="truncate mr-2">{col.name}</span>
                            <span className="text-[9px] opacity-60 font-medium shrink-0">
                              {col.palette_count}{" "}
                              {col.palette_count === 1 ? "palette" : "palettes"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Build Brand System */}
              <button
                onClick={() => {
                  playSound("open");
                  closeStudio();
                  openBrandSystem(selectedPalette);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2.5 sm:px-3 sm:py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-full transition-all backdrop-blur-md border border-white/20 cursor-pointer shadow-lg shadow-indigo-500/20"
                title="Build a brand system from this palette"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline text-[11px] font-bold">
                  Brand System
                </span>
              </button>

              {/* Edit Palette */}
              <button
                onClick={() => {
                  playSound("click");
                  openCreator(selectedPalette);
                }}
                className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/30 cursor-pointer"
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
                className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/30 cursor-pointer"
                title="Shuffle role assignments"
                aria-label="Shuffle role assignments"
              >
                <Shuffle className="h-5 w-5" />
              </button>

              <button
                onClick={handleClose}
                className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/30 cursor-pointer"
                title="Close (Esc)"
                aria-label="Close palette studio"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Persistent palette header — identity, mood + primary actions
                stay put across every tab; the floating toolbar sits over this
                dark hero so it never competes with the section tabs below. */}
            <div className="relative shrink-0 overflow-hidden bg-slate-950 px-12 pt-16 pb-6 text-center sm:px-20">
              <div className="absolute inset-0 flex">
                {selectedPalette.colors.map((c, i) => (
                  <div
                    key={i}
                    className="h-full flex-1"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: `rgba(2, 6, 23, ${heroOverlayAlpha})`,
                  }}
                />
              </div>

              <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-3">
                <h2 className="text-3xl font-black tracking-tighter text-white drop-shadow-2xl sm:text-5xl">
                  {selectedPalette.name}
                </h2>
                <MoodScore />
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={copyPalette}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {copiedPalette ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedPalette ? "Copied" : "Copy Palette"}
                  </button>
                  <button
                    onClick={() => {
                      playSound("click");
                      setActiveTab("export");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                  <button
                    onClick={() => {
                      playSound("click");
                      openCreator(selectedPalette);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>

              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur-md transition-all hover:bg-white/20 sm:left-5 sm:p-3"
                title="Previous palette"
                aria-label="Previous palette"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur-md transition-all hover:bg-white/20 sm:right-5 sm:p-3"
                title="Next palette"
                aria-label="Next palette"
              >
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Section tabs — real tabs: each selects a focused workspace */}
            <nav
              role="tablist"
              aria-label="Palette studio sections"
              className="shrink-0 border-b border-gray-100 bg-white px-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6"
            >
              <div className="flex gap-1 overflow-x-auto subtle-scrollbar">
                {STUDIO_SECTIONS.map((section) => {
                  const active = activeTab === section.id;
                  const badge =
                    section.id === "design"
                      ? roleFailures.length
                      : section.id === "contrast"
                        ? a11ySummary.total - a11ySummary.pass
                        : 0;
                  return (
                    <button
                      key={section.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setActiveTab(section.id);
                        playSound("click");
                      }}
                      className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        active
                          ? "border-indigo-500 text-indigo-500"
                          : "border-transparent text-gray-500 hover:text-indigo-500 dark:text-gray-400"
                      }`}
                    >
                      {section.label}
                      {badge > 0 && (
                        <span
                          className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black leading-none ${
                            active
                              ? "bg-red-500 text-white"
                              : "bg-red-500/15 text-red-500"
                          }`}
                          title={`${badge} contrast ${badge === 1 ? "issue" : "issues"}`}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Active panel */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto subtle-scrollbar"
            >
              <div className="p-6 sm:p-10">
                {/* ---------------------------------- OVERVIEW ------------- */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {selectedPalette.description && (
                      <p className="max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        {selectedPalette.description}
                      </p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        {selectedPalette.count} Colors
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                        {selectedPalette.category}
                      </span>
                      {(selectedPalette.tags?.mood ?? [])
                        .slice(0, 3)
                        .map((tag, i) => (
                          <span
                            key={`mood-${tag}-${i}`}
                            className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-[10px] font-bold capitalize text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50"
                          >
                            {tag}
                          </span>
                        ))}
                      {(selectedPalette.tags?.aesthetic ?? [])
                        .slice(0, 2)
                        .map((tag, i) => (
                          <span
                            key={`aesthetic-${tag}-${i}`}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold capitalize text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>

                    {/* Palette health summary */}
                    <div>
                      <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Palette Health
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <HealthStat
                          label="Colors"
                          value={selectedPalette.count}
                        />
                        <HealthStat label="Role tokens" value={ROLE_COUNT} />
                        <HealthStat
                          label="AA color pairs"
                          value={`${a11ySummary.pass}/${a11ySummary.total}`}
                          tone={
                            a11ySummary.total === 0
                              ? "neutral"
                              : a11ySummary.pass / a11ySummary.total >= 0.4
                                ? "good"
                                : "warn"
                          }
                          onClick={() => setActiveTab("contrast")}
                        />
                        <HealthStat
                          label="Role issues"
                          value={roleFailures.length}
                          tone={roleFailures.length === 0 ? "good" : "bad"}
                          onClick={
                            roleFailures.length > 0
                              ? () => setActiveTab("roles")
                              : undefined
                          }
                        />
                      </div>
                    </div>

                    {/* Actionable issue summary */}
                    {roleFailures.length > 0 ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <p className="text-xs font-black text-red-600 dark:text-red-400">
                              {roleFailures.length} role{" "}
                              {roleFailures.length === 1 ? "token" : "tokens"}{" "}
                              fail contrast
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab("roles");
                              playSound("click");
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-transform hover:scale-[1.02]"
                          >
                            Fix in Roles
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {roleFailures.slice(0, 6).map((f) => (
                            <button
                              key={f.index}
                              onClick={() => setActiveTab("roles")}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2 py-1 text-[10px] font-bold text-gray-600 transition-colors hover:border-red-400 dark:border-red-900/40 dark:bg-slate-900 dark:text-gray-300"
                              title={`${f.name} vs ${f.against}: ${f.ratio.toFixed(1)}:1`}
                            >
                              {f.name}
                              <span className="font-mono text-red-500">
                                {f.ratio.toFixed(1)}
                              </span>
                            </button>
                          ))}
                          {roleFailures.length > 6 && (
                            <span className="inline-flex items-center px-1.5 text-[10px] font-bold text-red-500">
                              +{roleFailures.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Every role token meets its contrast target.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------ DESIGN (Preview + Roles) ------------ */}
                {activeTab === "design" && (
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
                    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/90 p-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between">
                      {/* Zoom Controls */}
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-2xl p-1">
                        <button
                          onClick={() => {
                            setZoom(zoom - 10);
                            playSound("click");
                          }}
                          className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-all cursor-pointer disabled:opacity-40"
                          title="Zoom out"
                          aria-label="Zoom out"
                          disabled={zoom <= 50}
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setZoom(100);
                            playSound("click");
                          }}
                          className="w-12 text-center text-[11px] font-black text-gray-500 transition-colors hover:text-indigo-500 dark:text-gray-400"
                          title="Reset zoom to 100%"
                          aria-label="Reset zoom to 100 percent"
                        >
                          {zoom}%
                        </button>
                        <button
                          onClick={() => {
                            setZoom(zoom + 10);
                            playSound("click");
                          }}
                          className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-all cursor-pointer disabled:opacity-40"
                          title="Zoom in"
                          aria-label="Zoom in"
                          disabled={zoom >= 150}
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Heatmap Toggle */}
                        <button
                          onClick={() => {
                            toggleHeatmap();
                            playSound("click");
                          }}
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
                    <div className="overflow-hidden rounded-3xl bg-gray-50/50 dark:bg-slate-950/30 border border-gray-100 dark:border-slate-800">
                      <div
                        style={{
                          transform: `scale(${zoom / 100})`,
                          transformOrigin: "top center",
                          transition: "transform 0.2s ease",
                          marginBottom:
                            zoom < 100 ? `${(zoom - 100) * 3}px` : "0",
                          ...scenarioFilterStyle,
                        }}
                      >
                        <div className="p-8">{renderScenario()}</div>
                      </div>
                    </div>

                    {/* Heatmap: Contrast Matrix Panel */}
                    {heatmapActive && (
                      <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                            Contrast Matrix — every color pair
                          </p>
                          <div className="flex items-center gap-2 text-[9px] font-bold">
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <span className="h-2 w-2 rounded-sm bg-emerald-500" />{" "}
                              AAA ≥7
                            </span>
                            <span className="inline-flex items-center gap-1 text-indigo-600">
                              <span className="h-2 w-2 rounded-sm bg-indigo-500" />{" "}
                              AA ≥4.5
                            </span>
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <span className="h-2 w-2 rounded-sm bg-red-500" />{" "}
                              Fail
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {selectedPalette.colors.flatMap((a, ai) =>
                            selectedPalette.colors
                              .slice(ai + 1)
                              .map((b, bi) => {
                                const ratio: number = getContrastRatio(
                                  a.hex,
                                  b.hex,
                                );
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
                              }),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Role editor lives under the mockup, so tuning a role
                    updates the applied preview above it in the same tab. */}
                {activeTab === "design" && (
                  <div className="mt-12 border-t border-gray-100 pt-10 dark:border-slate-800">
                    <RoleConfigurator />
                  </div>
                )}

                {/* ---------------------------------- EXPORT -------------- */}
                {activeTab === "export" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 flex-shrink-0">
                        <Code2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold tracking-tight">
                          Code Export
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">
                          SCSS, CSS variables, Tailwind, or design tokens — as
                          raw colors or your semantic role tokens.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                      {/* Format tabs */}
                      <div className="flex border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20">
                        {(
                          [
                            ["scss", "SCSS"],
                            ["css", "CSS Vars"],
                            ["tailwind", "Tailwind"],
                            ["json", "JSON"],
                          ] as [CodeTab, string][]
                        ).map(([tab, label]) => (
                          <button
                            key={tab}
                            onClick={() => {
                              setCodeTab(tab);
                              playSound("click");
                            }}
                            className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer sm:px-5 ${
                              codeTab === tab
                                ? "border-indigo-500 text-indigo-500 bg-white dark:bg-slate-900"
                                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                        <div className="flex-1" />
                        <button
                          onClick={downloadCode}
                          className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold text-gray-400 hover:text-violet-500 transition-colors cursor-pointer border-r border-gray-100 dark:border-slate-800"
                          title={`Download ${exportFilename}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Save</span>
                        </button>
                        <button
                          onClick={copyCode}
                          className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold transition-colors cursor-pointer ${
                            copiedCode
                              ? "text-emerald-500"
                              : "text-gray-400 hover:text-indigo-500"
                          }`}
                          title="Copy to clipboard"
                        >
                          {copiedCode ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copiedCode ? "Copied" : "Copy"}
                        </button>
                      </div>

                      {/* Naming toggle + filename hint */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/30 px-4 py-2 dark:border-slate-800 dark:bg-slate-950/10">
                        <div className="inline-flex rounded-xl bg-gray-100 p-0.5 dark:bg-slate-800">
                          <button
                            onClick={() => setUseSemantic(false)}
                            className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                              !useSemantic
                                ? "bg-white text-indigo-500 shadow-sm dark:bg-slate-900"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                            title="Export raw palette colors by their descriptive names"
                          >
                            Descriptive
                          </button>
                          <button
                            onClick={() => setUseSemantic(true)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                              useSemantic
                                ? "bg-white text-indigo-500 shadow-sm dark:bg-slate-900"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                            title="Export your role assignments as semantic tokens (bg-canvas, primary, …)"
                          >
                            <Braces className="h-3 w-3" />
                            Semantic roles
                          </button>
                        </div>
                        <code className="font-mono text-[10px] text-gray-400">
                          {exportFilename}
                        </code>
                      </div>

                      {/* Code Block */}
                      <div className="bg-gray-950 rounded-b-3xl p-5 overflow-x-auto subtle-scrollbar">
                        <pre className="text-[11px] font-mono text-gray-300 leading-relaxed whitespace-pre">
                          {codeContent}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------- CONTRAST ------------ */}
                {activeTab === "contrast" && <ColorLab />}

                {/* -------- HISTORY (folded into Overview as context) ----- */}
                {activeTab === "overview" && (
                  <div className="mt-10 space-y-4 border-t border-gray-100 pt-10 dark:border-slate-800">
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

                    <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 p-6">
                      {loadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <span className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                        </div>
                      ) : historyEntries.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                          <p className="max-w-xs text-xs text-gray-400 dark:text-gray-500">
                            No edits yet. Tweak colors or roles in the Creator
                            and every change will be tracked here.
                          </p>
                          <button
                            onClick={() => {
                              playSound("click");
                              openCreator(selectedPalette);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-transform hover:scale-[1.02]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Open in Creator
                          </button>
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
                                    isCreate
                                      ? "bg-emerald-500"
                                      : "bg-indigo-500"
                                  }`}
                                />
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                      {isCreate
                                        ? "Palette Created"
                                        : "Palette Edited"}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                      {formatTimestamp(entry.timestamp)}
                                    </span>
                                  </div>
                                  <DiffViewer
                                    action={entry.action}
                                    changesJson={entry.changes_json}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* -------- RELATED (folded into Overview, discovery) ----- */}
                {activeTab === "overview" && relatedPalettes.length > 0 && (
                  <div className="mt-10 space-y-6 border-t border-gray-100 pt-10 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold tracking-tight">
                          Related Palettes
                        </h4>
                        <p className="text-[11px] text-gray-400 font-medium">
                          Explore other palettes in the same style, mood, or
                          category.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 subtle-scrollbar snap-x snap-mandatory">
                      {relatedPalettes.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound("open");
                            openStudio(p);
                          }}
                          aria-label={`Open ${p.name} — ${p.count} colors, ${p.category}`}
                          className="flex-shrink-0 snap-start group cursor-pointer bg-gray-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-4 w-48 text-left hover:shadow-xl transition-all duration-300"
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
                            {p.count} colors · {p.category}
                          </p>
                        </button>
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

function HealthStat({
  label,
  value,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warn" | "bad";
  onClick?: () => void;
}) {
  const toneCls =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "bad"
          ? "text-red-600 dark:text-red-400"
          : "text-gray-900 dark:text-white";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-left dark:border-slate-800 dark:bg-slate-950/30 ${
        onClick
          ? "cursor-pointer transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/40"
          : ""
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black tracking-tight ${toneCls}`}>
        {value}
      </p>
    </Tag>
  );
}
