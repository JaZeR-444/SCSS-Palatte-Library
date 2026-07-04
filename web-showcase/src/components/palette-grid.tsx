"use client";

import { useStudio } from "./studio/studio-context";
import { PaletteCard } from "./palette-card";
import { Palette } from "@/types";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Grid,
  LayoutGrid,
  List,
  Clock,
  Heart,
  Hash,
  Tag,
  Smile,
  Sparkles,
  RotateCcw,
  X,
  Folder,
  ShieldCheck,
  Command,
  Copy,
} from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { getPaletteDistance } from "@/utils/contrast-utils";
import { analyzePalette } from "@/utils/palette-metrics";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";

type Facet =
  | "all"
  | "recent"
  | "count"
  | "category"
  | "mood"
  | "aesthetic"
  | "saved";

interface PaletteGridProps {
  palettes: Palette[];
}

const FACETS: { id: Facet; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "count", label: "Count", icon: Hash },
  { id: "category", label: "Category", icon: Tag },
  { id: "mood", label: "Mood", icon: Smile },
  { id: "aesthetic", label: "Aesthetic", icon: Sparkles },
];

export function PaletteGrid({ palettes }: PaletteGridProps) {
  const [search, setSearch] = useState("");
  const { openStudio, recents, activeCollectionId, setActiveCollectionId } = useStudio();
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeFacet, setActiveFacet] = useState<Facet>("all");
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<
    "name-asc" | "name-desc" | "count-desc" | "count-asc" | "distance" | "quality-desc"
  >("name-asc");
  const [targetColor, setTargetColor] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid");
  const [displayedPalettes, setDisplayedPalettes] = useState<Palette[]>(palettes);
  const [a11yOnly, setA11yOnly] = useState(false);
  const [temperatureFilter, setTemperatureFilter] = useState<"all" | "warm" | "cool" | "balanced">("all");
  const [structureFilter, setStructureFilter] = useState<"all" | "single-span" | "multi-hue">("all");
  const [saturationFilter, setSaturationFilter] = useState<"all" | "muted" | "balanced" | "vibrant">("all");
  const [collectionRecsMode, setCollectionRecsMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isControlsCompact, setIsControlsCompact] = useState(false);

  const metricsById = useMemo(() => {
    const map: Record<string, ReturnType<typeof analyzePalette>> = {};
    for (const p of palettes) {
      map[p.id] = analyzePalette(p);
    }
    return map;
  }, [palettes]);

  const collectionRecommendations = useMemo(() => {
    if (!activeCollectionId || displayedPalettes.length === 0) return [];
    const seedIds = new Set(displayedPalettes.map((p) => p.id));
    const seedCategories = new Set(displayedPalettes.map((p) => p.category).filter(Boolean));
    const seedMood = new Set(displayedPalettes.flatMap((p) => p.tags?.mood ?? []));
    const seedAesthetic = new Set(displayedPalettes.flatMap((p) => p.tags?.aesthetic ?? []));
    const avgCount =
      displayedPalettes.reduce((sum, p) => sum + p.count, 0) / Math.max(1, displayedPalettes.length);

    return palettes
      .filter((p) => !seedIds.has(p.id))
      .map((p) => {
        const moodHit = (p.tags?.mood ?? []).filter((t) => seedMood.has(t)).length;
        const aestHit = (p.tags?.aesthetic ?? []).filter((t) => seedAesthetic.has(t)).length;
        const categoryHit = p.category && seedCategories.has(p.category) ? 2 : 0;
        const countScore = Math.max(0, 3 - Math.abs(p.count - avgCount) / 4);
        const quality = (metricsById[p.id]?.uiReadiness ?? 0) / 25;
        return { p, score: moodHit + aestHit + categoryHit + countScore + quality };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 160)
      .map((x) => x.p);
  }, [activeCollectionId, displayedPalettes, palettes, metricsById]);

  useEffect(() => {
    setDisplayedPalettes(palettes);
  }, [palettes]);

  useEffect(() => {
    let active = true;
    
    if (activeCollectionId) {
      setIsLoading(true);
      import("@/app/actions").then(({ getCollectionPalettesAction }) => {
        getCollectionPalettesAction(activeCollectionId).then((results) => {
          if (active) {
            setDisplayedPalettes(results);
            setIsLoading(false);
          }
        }).catch(() => active && setIsLoading(false));
      });
      return () => {
        active = false;
      };
    }

    const query = search.trim();
    if (query) {
      setIsLoading(true);
      const delayDebounceFn = setTimeout(() => {
        import("@/app/actions").then(({ searchPalettesAction }) => {
          searchPalettesAction(query).then((results) => {
            if (active) {
              setDisplayedPalettes(results);
              setIsLoading(false);
            }
          }).catch(() => active && setIsLoading(false));
        });
      }, 300);
      return () => {
        active = false;
        clearTimeout(delayDebounceFn);
      };
    } else if (sortOrder === "distance" && targetColor) {
      setIsLoading(true);
      import("@/app/actions").then(({ searchPalettesByColorAction }) => {
        searchPalettesByColorAction(targetColor).then((results) => {
          if (active) {
            setDisplayedPalettes(results);
            setIsLoading(false);
          }
        }).catch(() => active && setIsLoading(false));
      });
    } else {
      setDisplayedPalettes(palettes);
      setIsLoading(false);
    }
    return () => {
      active = false;
    };
  }, [search, sortOrder, targetColor, activeCollectionId, palettes]);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setWindowWidth(window.innerWidth);
    const updateWidth = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsControlsCompact(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // 1. First load from localStorage for instant offline/caching feel
    let localSet = new Set<string>();
    try {
      const stored = localStorage.getItem("scss-library-favorites");
      if (stored) {
        localSet = new Set(JSON.parse(stored));
        setFavorites(localSet);
      }
    } catch {}

    // 2. Fetch from SQLite DB to sync
    import("@/app/actions").then(({ getFavoritesAction }) => {
      getFavoritesAction().then((dbFavs) => {
        if (dbFavs && dbFavs.length > 0) {
          setFavorites((prev) => {
            const next = new Set([...Array.from(prev), ...dbFavs]);
            try {
              localStorage.setItem(
                "scss-library-favorites",
                JSON.stringify(Array.from(next))
              );
            } catch {}
            return next;
          });
        }
      }).catch((err) => console.error("Failed to load favorites from DB:", err));
    });
  }, []);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((v) => !v);
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleFavorite = useCallback(
    (paletteId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        const isFav = !next.has(paletteId);
        if (!isFav) {
          next.delete(paletteId);
          playSound("click");
        } else {
          next.add(paletteId);
          playSound("success");
        }
        
        // Save to DB via server action
        import("@/app/actions").then(({ toggleFavoriteAction }) => {
          toggleFavoriteAction(paletteId, isFav).catch((err) => {
            console.error("Failed to sync favorite to DB:", err);
          });
        });

        // Save to localStorage
        try {
          localStorage.setItem(
            "scss-library-favorites",
            JSON.stringify(Array.from(next))
          );
        } catch {}
        return next;
      });
    },
    []
  );

  // Dynamic sub-filter options for the active facet
  const subFilterOptions = useMemo(() => {
    if (activeFacet === "count")
      return [...new Set(palettes.map((p) => p.count))]
        .sort((a, b) => a - b)
        .map(String);
    if (activeFacet === "category")
      return [...new Set(palettes.map((p) => p.category).filter((c): c is string => !!c))].sort();
    if (activeFacet === "mood") {
      const counts: Record<string, number> = {};
      palettes.forEach((p) =>
        p.tags?.mood.forEach((t) => (counts[t] = (counts[t] || 0) + 1))
      );
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t)
        .slice(0, 24);
    }
    if (activeFacet === "aesthetic") {
      const counts: Record<string, number> = {};
      palettes.forEach((p) =>
        p.tags?.aesthetic.forEach(
          (t) => (counts[t] = (counts[t] || 0) + 1)
        )
      );
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t)
        .slice(0, 24);
    }
    return [];
  }, [palettes, activeFacet]);

  const subFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (activeFacet === "count") {
      palettes.forEach((p) => (counts[String(p.count)] = (counts[String(p.count)] || 0) + 1));
    } else if (activeFacet === "category") {
      palettes.forEach((p) => {
        if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
      });
    } else if (activeFacet === "mood") {
      palettes.forEach((p) => p.tags?.mood.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    } else if (activeFacet === "aesthetic") {
      palettes.forEach((p) => p.tags?.aesthetic.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    }
    return counts;
  }, [activeFacet, palettes]);

  const handleFacetChange = (facet: Facet) => {
    setActiveFacet(facet);
    setActiveSubFilter(null);
    setActiveCollectionId(null);
    setCollectionRecsMode(false);
    playSound("click");
  };

  const resetFilters = () => {
    setActiveFacet("all");
    setActiveSubFilter(null);
    setSearch("");
    setTargetColor("");
    setSortOrder("name-asc");
    setActiveCollectionId(null);
    setA11yOnly(false);
    setTemperatureFilter("all");
    setStructureFilter("all");
    setSaturationFilter("all");
    setCollectionRecsMode(false);
    playSound("click");
  };

  const openRandomPalette = () => {
    const pool = sortedAndFiltered.length > 0 ? sortedAndFiltered : palettes;
    const random = pool[Math.floor(Math.random() * pool.length)];
    if (!random) return;
    playSound("open");
    openStudio(random);
    setIsCommandOpen(false);
  };

  const toggleCompare = (paletteId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(paletteId)) return prev.filter((id) => id !== paletteId);
      if (prev.length >= 4) {
        showToast("Compare up to 4 palettes at a time.", "error");
        return prev;
      }
      return [...prev, paletteId];
    });
    playSound("click");
  };

  const comparePalettes = useMemo(
    () => compareIds.map((id) => palettes.find((p) => p.id === id)).filter((p): p is Palette => !!p),
    [compareIds, palettes]
  );

  const copyComparison = async () => {
    const text = comparePalettes
      .map((p) => `${p.name}\n${p.colors.map((c) => `${c.name}: ${c.hex}`).join("\n")}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    showToast("Copied comparison summary");
  };

  const columns = useMemo(() => {
    if (viewMode === "list") return 1;
    const w = windowWidth;
    if (viewMode === "compact") {
      if (w >= 3440) return 20;
      if (w >= 2560) return 16;
      if (w >= 1920) return 12;
      if (w >= 1536) return 10;
      if (w >= 1280) return 8;
      if (w >= 1024) return 6;
      if (w >= 768)  return 4;
      if (w >= 480)  return 3;
      return 2;
    }
    // grid mode
    if (w >= 3440) return 10;
    if (w >= 2560) return 8;
    if (w >= 1920) return 7;
    if (w >= 1536) return 6;
    if (w >= 1280) return 5;
    if (w >= 1024) return 4;
    if (w >= 640)  return 3;
    return 2;
  }, [windowWidth, viewMode]);

  const sortedAndFiltered = useMemo(() => {
    let items =
      collectionRecsMode && activeCollectionId
        ? collectionRecommendations
        : displayedPalettes;

    // Facet filter
    if (activeFacet === "recent") {
      items = items.filter((p) => recents.includes(p.id));
    } else if (activeFacet === "saved") {
      items = items.filter((p) => favorites.has(p.id));
    } else if (activeFacet === "count" && activeSubFilter) {
      items = items.filter((p) => p.count === parseInt(activeSubFilter));
    } else if (activeFacet === "category" && activeSubFilter) {
      items = items.filter((p) => p.category === activeSubFilter);
    } else if (activeFacet === "mood" && activeSubFilter) {
      items = items.filter((p) => p.tags?.mood.includes(activeSubFilter));
    } else if (activeFacet === "aesthetic" && activeSubFilter) {
      items = items.filter((p) =>
        p.tags?.aesthetic.includes(activeSubFilter)
      );
    }

    if (a11yOnly) {
      items = items.filter((p) => (metricsById[p.id]?.wcagPassRate ?? 0) >= 0.5);
    }
    if (temperatureFilter !== "all") {
      items = items.filter((p) => metricsById[p.id]?.temperature === temperatureFilter);
    }
    if (structureFilter !== "all") {
      items = items.filter((p) => metricsById[p.id]?.structure === structureFilter);
    }
    if (saturationFilter !== "all") {
      items = items.filter((p) => metricsById[p.id]?.saturationProfile === saturationFilter);
    }

    // Sort
    items = [...items];
    if (sortOrder === "distance" && targetColor) {
      items.sort(
        (a, b) =>
          getPaletteDistance(a, targetColor) -
          getPaletteDistance(b, targetColor)
      );
    } else if (activeFacet === "recent") {
      items.sort(
        (a, b) => recents.indexOf(a.id) - recents.indexOf(b.id)
      );
    } else if (sortOrder === "name-asc") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "name-desc") {
      items.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === "count-desc") {
      items.sort((a, b) => b.count - a.count);
    } else if (sortOrder === "count-asc") {
      items.sort((a, b) => a.count - b.count);
    } else if (sortOrder === "quality-desc") {
      items.sort(
        (a, b) => (metricsById[b.id]?.uiReadiness ?? 0) - (metricsById[a.id]?.uiReadiness ?? 0)
      );
    }

    return items;
  }, [
    displayedPalettes,
    collectionRecommendations,
    collectionRecsMode,
    activeFacet,
    activeSubFilter,
    activeCollectionId,
    favorites,
    sortOrder,
    targetColor,
    recents,
    a11yOnly,
    temperatureFilter,
    structureFilter,
    saturationFilter,
    metricsById,
  ]);

  const rows = useMemo(() => {
    const result: Palette[][] = [];
    for (let i = 0; i < sortedAndFiltered.length; i += columns) {
      result.push(sortedAndFiltered.slice(i, i + columns));
    }
    return result;
  }, [sortedAndFiltered, columns]);

  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    if (parentRef.current) {
      setScrollMargin(parentRef.current.offsetTop);
    }
  }, [isMounted, viewMode]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => {
      if (viewMode === "list") return 80;
      if (viewMode === "compact") return windowWidth >= 1280 ? 140 : 116;
      return windowWidth >= 1920 ? 280 : windowWidth >= 1024 ? 250 : 220;
    },
    overscan: 6,
    scrollMargin,
  });

  const facetSummary = useMemo(() => {
    const n = sortedAndFiltered.length;
    const suffix = `${n} palette${n === 1 ? "" : "s"}`;
    if (activeCollectionId) {
      const colName = activeCollectionId.split("-").slice(0, -2).join(" ").replace(/\b\w/g, c => c.toUpperCase()) || activeCollectionId;
      if (collectionRecsMode) return `Recommendations for ${colName}. ${suffix}.`;
      return `Collection: ${colName || "Custom Board"}. ${suffix}.`;
    }
    if (activeFacet === "recent") return `Recently opened. ${suffix}.`;
    if (activeFacet === "saved") return `Your saved palettes. ${suffix}.`;
    if (activeFacet === "count" && activeSubFilter)
      return `Showing ${activeSubFilter}-color palettes. ${suffix}.`;
    if (activeFacet === "category" && activeSubFilter)
      return `Category: ${activeSubFilter}. ${suffix}.`;
    if (activeFacet === "mood" && activeSubFilter)
      return `Mood: ${activeSubFilter}. ${suffix}.`;
    if (activeFacet === "aesthetic" && activeSubFilter)
      return `Aesthetic: ${activeSubFilter}. ${suffix}.`;
    if (a11yOnly) return `Accessibility mode enabled. ${suffix}.`;
    if (targetColor) return `Sorted by color proximity. ${suffix}.`;
    return `Full library. ${suffix}.`;
  }, [activeFacet, activeSubFilter, activeCollectionId, sortedAndFiltered.length, targetColor, a11yOnly, collectionRecsMode]);

  const facetCounts = useMemo<Record<Facet, number>>(
    () => ({
      all: palettes.length,
      recent: recents.length,
      saved: favorites.size,
      count: new Set(palettes.map((p) => p.count)).size,
      category: new Set(palettes.map((p) => p.category).filter(Boolean)).size,
      mood: new Set(palettes.flatMap((p) => p.tags?.mood ?? [])).size,
      aesthetic: new Set(palettes.flatMap((p) => p.tags?.aesthetic ?? [])).size,
    }),
    [favorites.size, palettes, recents.length]
  );

  const activeFilterTokens = useMemo(() => {
    const tokens: { id: string; label: string; onRemove: () => void }[] = [];
    if (search) tokens.push({ id: "search", label: `Search: ${search}`, onRemove: () => setSearch("") });
    if (activeSubFilter) tokens.push({ id: "sub", label: activeSubFilter, onRemove: () => setActiveSubFilter(null) });
    if (a11yOnly) tokens.push({ id: "wcag", label: "WCAG-ready", onRemove: () => setA11yOnly(false) });
    if (temperatureFilter !== "all") tokens.push({ id: "temp", label: `Temp: ${temperatureFilter}`, onRemove: () => setTemperatureFilter("all") });
    if (structureFilter !== "all") tokens.push({ id: "structure", label: `Structure: ${structureFilter.replace("-", " ")}`, onRemove: () => setStructureFilter("all") });
    if (saturationFilter !== "all") tokens.push({ id: "saturation", label: `Saturation: ${saturationFilter}`, onRemove: () => setSaturationFilter("all") });
    if (targetColor) tokens.push({ id: "target", label: `Hue: ${targetColor}`, onRemove: () => {
      setTargetColor("");
      if (sortOrder === "distance") setSortOrder("name-asc");
    }});
    if (collectionRecsMode) tokens.push({ id: "recs", label: "Smart recs", onRemove: () => setCollectionRecsMode(false) });
    return tokens;
  }, [activeSubFilter, a11yOnly, collectionRecsMode, saturationFilter, search, sortOrder, structureFilter, targetColor, temperatureFilter]);

  const resultCount = sortedAndFiltered.length.toLocaleString();

  const renderSearchAndHeader = () => {
    const chipClass = (active: boolean) =>
      `rounded-lg border px-2 py-1 text-xs font-bold transition-colors ${
        active
          ? "border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400"
          : "border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400 dark:hover:border-indigo-800 dark:hover:text-indigo-400"
      }`;
    const primaryFacets = FACETS.filter((facet) =>
      ["all", "recent", "saved", "count"].includes(facet.id)
    );
    const secondaryFacets = FACETS.filter((facet) =>
      ["category", "mood", "aesthetic"].includes(facet.id)
    );
    const compactLabels = isControlsCompact && windowWidth >= 1024;

    return (
      <div className="space-y-2">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="flex shrink-0 items-center gap-2">
            <p className="whitespace-nowrap text-sm font-black text-gray-900 tabular-nums dark:text-white">
              {resultCount} palettes
            </p>
            <span className="hidden text-xs text-gray-400 sm:inline">
              {activeFacet === "all"
                ? "Full library"
                : facetSummary.replace(/\.\s*\d+ palettes?\.$/, "")}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative group min-w-[220px] flex-1 lg:max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-indigo-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search palettes..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-24 text-sm font-medium shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900"
                value={search}
                onFocus={() => setIsControlsCompact(false)}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-gray-300"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsCommandOpen(true)}
                  className="hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-[10px] font-bold text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-gray-400"
                  aria-label="Open commands"
                >
                  <Command className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="subtle-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {[...primaryFacets, ...secondaryFacets].map(({ id, label, icon: Icon }) => {
                const isActive = activeFacet === id;
                const count = facetCounts[id];
                const hideText = compactLabels && secondaryFacets.some((facet) => facet.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => handleFacetChange(id)}
                    className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-black whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400"
                    } ${id === "saved" && !isActive ? "hover:border-rose-400 hover:text-rose-500" : ""}`}
                    title={label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {!hideText && <span>{label}</span>}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-black tabular-nums ${
                        isActive
                          ? "bg-white/20 text-white"
                          : id === "saved" && count > 0
                            ? "bg-rose-50 text-rose-500 dark:bg-rose-950/40"
                            : "bg-gray-100 text-gray-500 dark:bg-slate-800"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as typeof sortOrder);
                  playSound("click");
                }}
                className="max-w-28 rounded-md bg-gray-50 px-1.5 py-1 text-xs font-bold text-gray-700 outline-none dark:bg-slate-800 dark:text-gray-300"
                aria-label="Sort palettes"
              >
                <option value="name-asc">A to Z</option>
                <option value="name-desc">Z to A</option>
                <option value="count-desc">Most Colors</option>
                <option value="count-asc">Fewest Colors</option>
                <option value="quality-desc">Best UI</option>
                {targetColor && <option value="distance">Proximity</option>}
              </select>
              {(["grid", "compact", "list"] as const).map((mode) => {
                const Icon = mode === "grid" ? LayoutGrid : mode === "compact" ? Grid : List;
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      playSound("click");
                    }}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === mode
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-800"
                    }`}
                    title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                    aria-label={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowAdvancedFilters((v) => !v)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-black transition-colors ${
                  activeFilterTokens.length > 0
                    ? "border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Filters
                {activeFilterTokens.length > 0 && (
                  <span className="rounded bg-current/10 px-1.5 py-0.5 text-[9px] tabular-nums">
                    {activeFilterTokens.length}
                  </span>
                )}
              </button>

              {showAdvancedFilters && (
                <div className="absolute right-0 top-11 z-50 w-[min(92vw,560px)] rounded-xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900 dark:text-white">Advanced filters</p>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
                      aria-label="Close advanced filters"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setA11yOnly((v) => !v);
                        playSound("click");
                      }}
                      className={chipClass(a11yOnly)}
                      title="Only show palettes with stronger WCAG pair pass-rate"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        WCAG-ready
                      </span>
                    </button>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Temp</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(["all", "warm", "cool", "balanced"] as const).map((value) => (
                            <button key={value} onClick={() => setTemperatureFilter(value)} className={chipClass(temperatureFilter === value)}>
                              {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Structure</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(["all", "single-span", "multi-hue"] as const).map((value) => (
                            <button key={value} onClick={() => setStructureFilter(value)} className={chipClass(structureFilter === value)}>
                              {value === "all" ? "All" : value === "single-span" ? "Single span" : "Multi hue"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Saturation</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(["all", "muted", "balanced", "vibrant"] as const).map((value) => (
                            <button key={value} onClick={() => setSaturationFilter(value)} className={chipClass(saturationFilter === value)}>
                              {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Match hue</span>
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                        <div
                          className="relative h-6 w-6 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-gray-200 shadow-inner dark:border-slate-700"
                          style={{ backgroundColor: targetColor || "#e2e8f0" }}
                        >
                          <input
                            type="color"
                            value={targetColor || "#6366f1"}
                            onChange={(e) => {
                              setTargetColor(e.target.value);
                              setSortOrder("distance");
                              playSound("click");
                            }}
                            className="absolute inset-0 h-full w-full scale-150 cursor-pointer opacity-0"
                            aria-label="Choose target hue"
                          />
                        </div>
                        {targetColor ? (
                          <button
                            onClick={() => {
                              setTargetColor("");
                              if (sortOrder === "distance") setSortOrder("name-asc");
                              playSound("click");
                            }}
                            className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:bg-rose-950/30"
                          >
                            Clear
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">Pick</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Sub-filter chips */}
      {subFilterOptions.length > 0 && (
        <div className="subtle-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          {subFilterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setActiveSubFilter(activeSubFilter === opt ? null : opt);
                playSound("click");
              }}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-colors cursor-pointer ${
                activeSubFilter === opt
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-400"
                  : "bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:border-indigo-300 hover:text-indigo-500"
              }`}
            >
              {opt}
              {subFilterCounts[opt] ? (
                <span className="ml-1.5 rounded bg-black/5 px-1 py-0.5 text-[9px] dark:bg-white/10">
                  {subFilterCounts[opt]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {(activeCollectionId || activeFilterTokens.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeCollectionId && (
            <>
              <div className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-400">
                <Folder className="h-3 w-3 text-indigo-500" />
                <span>{activeCollectionId.split("-").slice(0, -2).join(" ") || "Collection"}</span>
                <button
                  onClick={() => {
                    setActiveCollectionId(null);
                    setCollectionRecsMode(false);
                    playSound("click");
                  }}
                  className="hover:text-indigo-800 dark:hover:text-indigo-300 ml-1 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <button
                onClick={() => {
                  setCollectionRecsMode((v) => !v);
                  playSound("click");
                }}
                className={`rounded-lg border px-2 py-1 text-xs font-bold transition-colors ${
                  collectionRecsMode
                    ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-900 text-violet-600 dark:text-violet-400"
                    : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:border-violet-300 hover:text-violet-500"
                }`}
                title="Suggest similar palettes based on this collection"
              >
                Smart Recs
              </button>
            </>
          )}
          {activeFilterTokens.map((token) => (
            <button
              key={token.id}
              onClick={() => {
                token.onRemove();
                playSound("click");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-xs font-bold text-indigo-600 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-indigo-900 dark:bg-slate-900 dark:text-indigo-400"
            >
              {token.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          {activeFilterTokens.length > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      )}
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div className="space-y-12">
        {renderSearchAndHeader()}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-8">
          {sortedAndFiltered.slice(0, 12).map((palette) => (
            <div
              key={palette.id}
              onClick={() => {
                playSound("open");
                openStudio(palette);
              }}
            >
              <PaletteCard
                palette={palette}
                isFavorite={false}
                onToggleFavorite={() => {}}
                viewMode="grid"
                qualityScore={metricsById[palette.id]?.uiReadiness}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="space-y-8">
      <div className="sticky top-[92px] z-30 -mx-4 border-y border-gray-100 bg-gray-50/95 px-4 py-3 backdrop-blur-sm sm:top-[57px] sm:mx-0 sm:rounded-2xl sm:border dark:border-slate-800 dark:bg-slate-950/90">
        {renderSearchAndHeader()}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click a palette to inspect roles, export SCSS, and test contrast.
        </p>
        {compareIds.length > 0 && (
          <button
            onClick={() => setCompareIds([])}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-black text-rose-500 transition-colors hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/30"
          >
            Clear compare ({compareIds.length})
          </button>
        )}
      </div>

      {comparePalettes.length >= 2 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-100">
              Compare palettes
            </h3>
            <button
              onClick={copyComparison}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-black text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy summary
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {comparePalettes.map((palette) => (
              <div key={palette.id} className="rounded-lg border border-white/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="truncate text-sm font-black text-gray-900 dark:text-white">{palette.name}</p>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{palette.count} colors</p>
                <div className="flex h-8 overflow-hidden rounded-md">
                  {palette.colors.map((color, i) => (
                    <span key={i} className="flex-1" style={{ backgroundColor: color.hex }} title={`${color.name}: ${color.hex}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCommandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pt-24" onClick={() => setIsCommandOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-gray-100 px-2 py-3 dark:border-slate-800">
              <Command className="h-4 w-4 text-gray-400" />
              <input
                autoFocus
                className="w-full bg-transparent text-sm font-medium outline-none"
                placeholder="Search palettes, run actions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="py-2">
              <button onClick={() => { searchRef.current?.focus(); setIsCommandOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-900">
                <Search className="h-4 w-4 text-gray-400" /> Focus search
              </button>
              <button onClick={openRandomPalette} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-900">
                <RotateCcw className="h-4 w-4 text-gray-400" /> Open random palette
              </button>
              <button onClick={() => { setActiveFacet("saved"); setIsCommandOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-900">
                <Heart className="h-4 w-4 text-gray-400" /> Show saved palettes
              </button>
              <button onClick={() => { setA11yOnly((v) => !v); setIsCommandOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-900">
                <ShieldCheck className="h-4 w-4 text-gray-400" /> Toggle WCAG-ready
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="h-32 rounded-t-xl bg-gray-100 dark:bg-slate-800" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedAndFiltered.length > 0 ? (
        <div ref={parentRef} key={viewMode} className="w-full">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const rowItems = rows[virtualRow.index];
              if (!rowItems) return null;

              const gapClass =
                viewMode === "compact"
                  ? "gap-1.5 sm:gap-2 lg:gap-3 pb-1.5 sm:pb-2 lg:pb-3"
                  : viewMode === "list"
                  ? "gap-2 sm:gap-3 pb-2 sm:pb-3 w-full"
                  : "gap-3 sm:gap-5 lg:gap-6 xl:gap-8 pb-3 sm:pb-5 lg:pb-6 xl:pb-8";

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                    gridTemplateColumns:
                      viewMode === "list"
                        ? "1fr"
                        : `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                  className={`grid ${gapClass}`}
                >
                  {rowItems.map((palette) => (
                    <div
                      key={palette.id}
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
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${palette.name} palette, ${palette.count} colors`}
                      className="focus-visible:outline-2 focus-visible:outline-indigo-500 rounded-3xl"
                    >
                      <PaletteCard
                        palette={palette}
                        isFavorite={favorites.has(palette.id)}
                        onToggleFavorite={() => toggleFavorite(palette.id)}
                        viewMode={viewMode}
                        qualityScore={metricsById[palette.id]?.uiReadiness}
                        isSelectedForCompare={compareIds.includes(palette.id)}
                        onToggleCompare={() => toggleCompare(palette.id)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-32 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-gray-400">
            <Search className="h-8 w-8" />
          </div>
          <h4 className="text-xl font-bold dark:text-white">
            No palettes matched
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Try a broader query, switch facets, or{" "}
            <button
              onClick={resetFilters}
              className="text-indigo-500 hover:underline font-bold"
            >
              reset all filters
            </button>
            .{" "}
            <button
              onClick={() => {
                setA11yOnly(false);
                setTemperatureFilter("warm");
                setActiveFacet("all");
              }}
              className="text-indigo-500 hover:underline font-bold"
            >
              Show warm palettes
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
