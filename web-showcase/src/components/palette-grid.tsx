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
} from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { getPaletteDistance } from "@/utils/contrast-utils";
import { playSound } from "@/utils/audio";

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
    "name-asc" | "name-desc" | "count-desc" | "count-asc" | "distance"
  >("name-asc");
  const [targetColor, setTargetColor] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid");
  const [displayedPalettes, setDisplayedPalettes] = useState<Palette[]>(palettes);

  useEffect(() => {
    setDisplayedPalettes(palettes);
  }, [palettes]);

  useEffect(() => {
    let active = true;
    
    if (activeCollectionId) {
      import("@/app/actions").then(({ getCollectionPalettesAction }) => {
        getCollectionPalettesAction(activeCollectionId).then((results) => {
          if (active) {
            setDisplayedPalettes(results);
          }
        });
      });
      return () => {
        active = false;
      };
    }

    const query = search.trim();
    if (query) {
      const delayDebounceFn = setTimeout(() => {
        import("@/app/actions").then(({ searchPalettesAction }) => {
          searchPalettesAction(query).then((results) => {
            if (active) {
              setDisplayedPalettes(results);
            }
          });
        });
      }, 300);
      return () => {
        active = false;
        clearTimeout(delayDebounceFn);
      };
    } else if (sortOrder === "distance" && targetColor) {
      import("@/app/actions").then(({ searchPalettesByColorAction }) => {
        searchPalettesByColorAction(targetColor).then((results) => {
          if (active) {
            setDisplayedPalettes(results);
          }
        });
      });
    } else {
      setDisplayedPalettes(palettes);
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
        searchRef.current?.focus();
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

  const handleFacetChange = (facet: Facet) => {
    setActiveFacet(facet);
    setActiveSubFilter(null);
    setActiveCollectionId(null);
    playSound("click");
  };

  const resetFilters = () => {
    setActiveFacet("all");
    setActiveSubFilter(null);
    setSearch("");
    setTargetColor("");
    setSortOrder("name-asc");
    setActiveCollectionId(null);
    playSound("click");
  };

  const columns = useMemo(() => {
    if (viewMode === "list") return 1;
    const w = windowWidth;
    if (viewMode === "compact") {
      if (w >= 1536) return 10;
      if (w >= 1280) return 8;
      if (w >= 1024) return 6;
      if (w >= 768) return 4;
      return 3;
    }
    if (w >= 1536) return 6;
    if (w >= 1280) return 5;
    if (w >= 1024) return 4;
    if (w >= 768) return 3;
    return 2;
  }, [windowWidth, viewMode]);

  const sortedAndFiltered = useMemo(() => {
    let items = displayedPalettes;

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
    }

    return items;
  }, [
    displayedPalettes,
    activeFacet,
    activeSubFilter,
    favorites,
    sortOrder,
    targetColor,
    recents,
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
      if (viewMode === "list") return 75;
      if (viewMode === "compact") return 110;
      return 220;
    },
    overscan: 6,
    scrollMargin,
  });

  const facetSummary = useMemo(() => {
    const n = sortedAndFiltered.length;
    const suffix = `${n} palette${n === 1 ? "" : "s"}`;
    if (activeCollectionId) {
      const colName = activeCollectionId.split("-").slice(0, -2).join(" ").replace(/\b\w/g, c => c.toUpperCase()) || activeCollectionId;
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
    if (targetColor) return `Sorted by color proximity. ${suffix}.`;
    return `Full library. ${suffix}.`;
  }, [activeFacet, activeSubFilter, activeCollectionId, sortedAndFiltered.length, targetColor]);

  const hasActiveFilters =
    activeFacet !== "all" ||
    activeSubFilter !== null ||
    search !== "" ||
    targetColor !== "" ||
    activeCollectionId !== null;

  const renderSearchAndHeader = () => (
    <div className="space-y-5">
      {/* Search Input */}
      <div className="relative group max-w-2xl mx-auto sm:mx-0">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          <Search className="h-5 w-5" />
        </div>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search palettes by name, mood, or aesthetic..."
          className="w-full pl-14 pr-20 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="absolute inset-y-0 right-4 flex items-center gap-2">
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 pointer-events-none select-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Facet Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        {FACETS.map(({ id, label, icon: Icon }) => {
          const isActive = activeFacet === id;
          return (
            <button
              key={id}
              onClick={() => handleFacetChange(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                isActive
                  ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                  : "bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:border-indigo-400 hover:text-indigo-500"
              } ${id === "saved" && !isActive ? "hover:border-rose-400 hover:text-rose-500" : ""}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              {id === "saved" && favorites.size > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-500"
                  }`}
                >
                  {favorites.size}
                </span>
              )}
              {id === "recent" && recents.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-500"
                  }`}
                >
                  {recents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-filter chips */}
      {subFilterOptions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5">
          {subFilterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setActiveSubFilter(activeSubFilter === opt ? null : opt);
                playSound("click");
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all cursor-pointer ${
                activeSubFilter === opt
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-400"
                  : "bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:border-indigo-300 hover:text-indigo-500"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/50 dark:bg-slate-950/20 p-4 rounded-[2rem] border border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Facet summary */}
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
            {facetSummary}
          </p>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}

          {activeCollectionId && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <Folder className="h-3 w-3 text-indigo-500" />
              <span>{activeCollectionId.split("-").slice(0, -2).join(" ") || "Collection"}</span>
              <button
                onClick={() => {
                  setActiveCollectionId(null);
                  playSound("click");
                }}
                className="hover:text-indigo-800 dark:hover:text-indigo-300 ml-1 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Color Proximity Matcher */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-2xl border border-gray-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
              Match Hue:
            </span>
            <div
              className="relative w-6 h-6 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex-shrink-0 cursor-pointer shadow-inner"
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
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
              />
            </div>
            {targetColor ? (
              <button
                onClick={() => {
                  setTargetColor("");
                  if (sortOrder === "distance") setSortOrder("name-asc");
                  playSound("click");
                }}
                className="text-rose-500 hover:text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 select-none">
                Pick
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
          {/* Sort */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-2xl border border-gray-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
              Sort:
            </span>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as typeof sortOrder);
                playSound("click");
              }}
              className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-transparent border-none focus:outline-none pr-1 cursor-pointer"
            >
              <option value="name-asc">A → Z</option>
              <option value="name-desc">Z → A</option>
              <option value="count-desc">Most Colors</option>
              <option value="count-asc">Fewest Colors</option>
              {targetColor && (
                <option value="distance">Color Proximity</option>
              )}
            </select>
          </div>

          {/* Layout toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
            {(["grid", "compact", "list"] as const).map((mode) => {
              const Icon =
                mode === "grid" ? LayoutGrid : mode === "compact" ? Grid : List;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    playSound("click");
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === mode
                      ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                  title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

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
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="space-y-12">
      {renderSearchAndHeader()}

      {sortedAndFiltered.length > 0 ? (
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

              const gridClass =
                viewMode === "compact"
                  ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 pb-3"
                  : viewMode === "list"
                    ? "grid grid-cols-1 gap-3 pb-3 w-full"
                    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-8 pb-4 sm:pb-8";

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
                  }}
                  className={gridClass}
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
            Try adjusting your filters or{" "}
            <button
              onClick={resetFilters}
              className="text-indigo-500 hover:underline font-bold"
            >
              reset all filters
            </button>
            .
          </p>
        </div>
      )}
    </div>
  );
}
