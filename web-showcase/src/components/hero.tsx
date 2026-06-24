import { LavaLamp } from "./lava-lamp";
import { PaletteWall } from "./palette-wall";

export function Hero() {
  return (
    <div
      id="typographic-hero"
      className="w-full border-b border-gray-200 dark:border-slate-800 overflow-hidden relative"
    >
      {/* Foreground content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 3xl:px-16 py-20 sm:py-32 flex flex-col items-start gap-6 relative z-10 lg:w-[56%]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
            Production Ready
          </span>
        </div>

        <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.05] max-w-4xl">
          SCSS Color Systems.
          <br />
          <span className="bg-gradient-to-r from-[#d4af37] via-[#0f52ba] to-[#6d28d9] bg-clip-text text-transparent animate-gradient-pan bg-[length:300%_300%]">
            Built for precision.
          </span>
        </h2>

        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl font-medium mt-2 leading-relaxed">
          A curated library of professional design palettes with ready-to-use
          SCSS and CSS variables. Features WCAG contrast tools, real-world
          layout simulations, and zero dependencies.
        </p>
      </div>

      <LavaLamp />

      {/* Animated palette wall — right side, large viewports only */}
      <PaletteWall />
    </div>
  );
}
