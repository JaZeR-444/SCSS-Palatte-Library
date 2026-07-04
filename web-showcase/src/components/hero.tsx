"use client";

import palettesData from "@/data/palettes.json";
import { Palette } from "@/types";
import { playSound } from "@/utils/audio";
import { Shuffle, Sparkles, SwatchBook } from "lucide-react";
import { PaletteWall } from "./palette-wall";
import { useStudio } from "./studio/studio-context";

export function Hero() {
  const { openStudio, openBrandSystem } = useStudio();
  const palettes = palettesData as Palette[];

  const browse = () => {
    document
      .getElementById("palette-viewer")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openRandom = () => {
    const random = palettes[Math.floor(Math.random() * palettes.length)];
    playSound("open");
    openStudio(random);
  };

  return (
    <div
      id="typographic-hero"
      className="relative w-full overflow-hidden border-b border-gray-200 dark:border-slate-800"
    >
      <div className="relative z-10 flex max-w-[3440px] flex-col items-start gap-5 px-4 py-12 sm:gap-6 sm:px-6 sm:py-16 lg:w-[55%] lg:px-8 lg:py-20 xl:px-10 2xl:px-14 3xl:w-[50%] 3xl:px-20 3xl:py-24 4xl:px-28 5xl:px-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 dark:border-slate-800 dark:bg-slate-900/80">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold uppercase text-gray-600 dark:text-gray-400">
            Production Ready
          </span>
        </div>

        <h2 className="max-w-4xl text-balance text-4xl font-black leading-[1.05] text-gray-900 sm:text-6xl lg:text-7xl 3xl:max-w-6xl 3xl:text-8xl dark:text-white">
          SCSS Color Systems.
          <br />
          <span className="text-indigo-600 dark:text-indigo-400">
            Built for precision.
          </span>
        </h2>

        <p className="mt-1 max-w-2xl text-pretty text-base font-medium leading-relaxed text-gray-500 sm:mt-2 sm:text-lg 3xl:max-w-4xl 3xl:text-xl dark:text-gray-400">
          A curated library of 3,000+ professional color systems with ready-to-use
          SCSS and CSS variables, semantic role mapping, WCAG quality filters,
          and export-ready design tokens for production UI workflows.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={browse}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <SwatchBook className="h-4 w-4" />
            Browse palettes
          </button>
          <button
            onClick={openRandom}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300 dark:hover:border-indigo-800 dark:hover:text-indigo-400"
          >
            <Shuffle className="h-4 w-4" />
            Open random
          </button>
          <button
            onClick={() => {
              playSound("open");
              openBrandSystem();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300 dark:hover:border-indigo-800 dark:hover:text-indigo-400"
          >
            <Sparkles className="h-4 w-4" />
            Build brand system
          </button>
        </div>
      </div>

      <PaletteWall />
    </div>
  );
}
