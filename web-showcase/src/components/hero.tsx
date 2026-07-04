import { LavaLamp } from "./lava-lamp";
import { PaletteWall } from "./palette-wall";

export function Hero() {
  return (
    <div
      id="typographic-hero"
      className="w-full border-b border-gray-200 dark:border-slate-800 overflow-hidden relative"
    >
      {/* Foreground content */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 3xl:px-20 4xl:px-28 5xl:px-32 py-14 sm:py-24 lg:py-32 3xl:py-40 flex flex-col items-start gap-5 sm:gap-6 relative z-10 lg:w-[55%] 3xl:w-[50%] max-w-[3440px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
            Production Ready
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl lg:text-8xl 3xl:text-9xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.05] max-w-4xl 3xl:max-w-6xl">
          SCSS Color Systems.
          <br />
          <span className="bg-gradient-to-r from-[#d4af37] via-[#0f52ba] to-[#6d28d9] bg-clip-text text-transparent animate-gradient-pan bg-[length:300%_300%]">
            Built for precision.
          </span>
        </h2>

        <p className="text-base sm:text-lg 3xl:text-xl text-gray-500 dark:text-gray-400 max-w-2xl 3xl:max-w-4xl font-medium mt-1 sm:mt-2 leading-relaxed">
          A curated library of 3,000+ professional color systems with ready-to-use
          SCSS and CSS variables, semantic role mapping, WCAG quality filters,
          and export-ready design tokens for production UI workflows.
        </p>
      </div>

      <LavaLamp />

      {/* Animated palette wall — right side, large viewports only */}
      <PaletteWall />
    </div>
  );
}
