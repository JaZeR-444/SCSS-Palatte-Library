"use client";

import { Palette } from "@/types";
import { showToast } from "@/utils/toast";
import { ArrowRight, CheckSquare, Code2, Copy, Heart, Square } from "lucide-react";
import React from "react";

function getTagStyle(tag: string): string {
  const t = tag.toLowerCase();
  const base =
    "text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border transition-all ";
  if (
    t.includes("nature") ||
    t.includes("forest") ||
    t.includes("garden") ||
    t.includes("eco")
  )
    return (
      base +
      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
    );
  if (
    t.includes("neon") ||
    t.includes("cyber") ||
    t.includes("vibrant") ||
    t.includes("fuchsia")
  )
    return (
      base +
      "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800/50"
    );
  if (
    t.includes("warm") ||
    t.includes("sunset") ||
    t.includes("orange") ||
    t.includes("fire")
  )
    return (
      base +
      "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/50"
    );
  if (
    t.includes("cool") ||
    t.includes("arctic") ||
    t.includes("ice") ||
    t.includes("ocean") ||
    t.includes("winter")
  )
    return (
      base +
      "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/50"
    );
  if (
    t.includes("retro") ||
    t.includes("vintage") ||
    t.includes("90s") ||
    t.includes("amber")
  )
    return (
      base +
      "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50"
    );
  if (
    t.includes("minimal") ||
    t.includes("clean") ||
    t.includes("corporate") ||
    t.includes("modern")
  )
    return (
      base +
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
    );
  if (
    t.includes("dark") ||
    t.includes("midnight") ||
    t.includes("void") ||
    t.includes("black")
  )
    return (
      base +
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
    );
  return (
    base +
    "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50"
  );
}

interface PaletteCardProps {
  palette: Palette;
  onOpen: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  viewMode?: "grid" | "compact" | "list";
  qualityScore?: number;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (e: React.MouseEvent) => void;
}

export function PaletteCard({
  palette,
  onOpen,
  isFavorite,
  onToggleFavorite,
  viewMode = "grid",
  qualityScore,
  isSelectedForCompare = false,
  onToggleCompare,
}: PaletteCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(e);
  };

  const allTags = [
    ...(palette.tags?.mood ?? []),
    ...(palette.tags?.aesthetic ?? []),
  ].slice(0, 3);

  const DOT_MAX = 6;

  const copyHex = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(palette.colors.map((c) => c.hex).join("\n"));
    showToast(`Copied ${palette.name} HEX values`);
  };

  const copyScss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const scss = palette.colors
      .map((c) => `$${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}: ${c.hex};`)
      .join("\n");
    await navigator.clipboard.writeText(scss);
    showToast(`Copied ${palette.name} SCSS variables`);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompare?.(e);
  };

  const favoriteButton = (
    <button
      onClick={handleFavoriteClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
        isFavorite
          ? "text-rose-500 fill-rose-500 bg-rose-50/90 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/50"
          : "text-gray-400 hover:text-rose-500 bg-white/90 dark:bg-slate-900/90 border-gray-200 dark:border-slate-800"
      }`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-label={isFavorite ? `Remove ${palette.name} from favorites` : `Add ${palette.name} to favorites`}
    >
      <Heart
        className={`h-4 w-4 transition-transform ${isFavorite ? "fill-current" : ""}`}
      />
    </button>
  );

  const quickActions = (
    <div className="relative z-20 flex items-center gap-1">
      {onToggleCompare && (
        <button
          onClick={handleCompareClick}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
            isSelectedForCompare
              ? "border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400"
              : "border-gray-200 bg-white/90 text-gray-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:text-indigo-400"
          }`}
          title={isSelectedForCompare ? "Remove from comparison" : "Add to comparison"}
          aria-label={isSelectedForCompare ? `Remove ${palette.name} from comparison` : `Add ${palette.name} to comparison`}
        >
          {isSelectedForCompare ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        </button>
      )}
      <button
        onClick={copyHex}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-400 transition-colors hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:text-indigo-400"
        title="Copy HEX values"
        aria-label={`Copy ${palette.name} HEX values`}
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={copyScss}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/90 text-gray-400 transition-colors hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:text-indigo-400"
        title="Copy SCSS variables"
        aria-label={`Copy ${palette.name} SCSS variables`}
      >
        <Code2 className="h-4 w-4" />
      </button>
      {favoriteButton}
    </div>
  );

  /* ── Compact ─────────────────────────────────────────────────── */
  if (viewMode === "compact") {
    return (
      <div
        className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-shadow h-24 sm:h-28"
        title={`${palette.name} (${palette.category})`}
      >
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-500"
          aria-label={`Open ${palette.name} palette`}
        />
        <div className="flex h-full w-full overflow-hidden">
          {palette.colors.map((color, i) => (
            <div
              key={i}
              className="flex-1 h-full transition-opacity group-hover:opacity-90"
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
        {/* Count badge */}
        <span
          className="absolute top-2 left-2 text-[8px] font-black text-white tracking-widest rounded-lg px-1.5 py-0.5"
          style={{
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {palette.count} CLR
        </span>
        {typeof qualityScore === "number" && (
          <span className="absolute bottom-2 left-2 text-[8px] font-black tracking-widest rounded-lg px-1.5 py-0.5 bg-white/85 dark:bg-slate-900/85 text-emerald-600 border border-emerald-200 dark:border-emerald-900/50">
            UI {qualityScore}/25
          </span>
        )}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
          {quickActions}
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-[10px] font-black text-white truncate">
            {palette.name}
          </p>
        </div>
      </div>
    );
  }

  /* ── List ─────────────────────────────────────────────────────── */
  if (viewMode === "list") {
    return (
      <div className="group relative bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4 w-full">
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-500"
          aria-label={`Open ${palette.name} palette`}
        />
        <div className="min-w-0 flex-1 sm:flex-initial sm:w-48">
          <h3 className="font-black text-sm text-gray-900 dark:text-white truncate">
            {palette.name}
          </h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">
            {palette.category}
          </p>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {allTags.map((tag, i) => (
                <span key={`${tag}-${i}`} className={getTagStyle(tag)}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md h-8 sm:h-10 rounded-xl overflow-hidden flex border border-gray-100 dark:border-slate-800">
          {palette.colors.map((color, i) => (
            <div
              key={i}
              className="flex-1 h-full transition-opacity hover:opacity-90"
              style={{ backgroundColor: color.hex }}
              title={`${color.name}: ${color.hex}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-[9px] font-black text-gray-500">
            {palette.count} Colors
          </span>
          {typeof qualityScore === "number" && (
            <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
              UI {qualityScore}/25
            </span>
          )}
          {quickActions}
        </div>
      </div>
    );
  }

  /* ── Grid (default) ───────────────────────────────────────────── */
  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full">
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-500"
        aria-label={`Open ${palette.name} palette`}
      />
      {/* Swatch strip */}
      <div className="relative flex h-28 sm:h-32 overflow-hidden flex-shrink-0">
        {palette.colors.map((color, i) => (
          <div
            key={i}
            className="flex-1 h-full transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
        {/* Count badge */}
        <span
          className="absolute top-3 left-3 text-[9px] font-black text-white tracking-widest rounded-lg px-2 py-0.5"
          style={{
            background: "rgba(0,0,0,0.28)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          {palette.count}{" "}
          <span style={{ opacity: 0.6, fontSize: "8px" }}>CLR</span>
        </span>
        {typeof qualityScore === "number" && (
          <span className="absolute bottom-3 left-3 text-[9px] font-black tracking-widest rounded-lg px-2 py-0.5 bg-white/85 dark:bg-slate-900/85 text-emerald-600 border border-emerald-200 dark:border-emerald-900/50">
            UI {qualityScore}/25
          </span>
        )}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          {quickActions}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <h3 className="font-black text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">
            {palette.name}
          </h3>
          <p className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5">
            {palette.category}
          </p>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {allTags.map((tag, i) => (
                <span key={`${tag}-${i}`} className={getTagStyle(tag)}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer: overlapping dots + arrow */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            {palette.colors.slice(0, DOT_MAX).map((color, i) => (
              <span
                key={i}
                className="inline-block w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex-shrink-0"
                style={{
                  background: color.hex,
                  zIndex: DOT_MAX - i,
                  marginLeft: i > 0 ? "-6px" : "0",
                }}
                title={color.name}
              />
            ))}
            {palette.colors.length > DOT_MAX && (
              <span className="text-[9px] font-bold text-gray-400 ml-1.5">
                +{palette.colors.length - DOT_MAX}
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-sm flex-shrink-0">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
