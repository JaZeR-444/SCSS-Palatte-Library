"use client";

import { Palette } from "@/types";
import { useStudio } from "@/components/studio/studio-context";
import { playSound } from "@/utils/audio";

interface FeaturedRailsProps {
  palettes: Palette[];
}

function Rail({
  title,
  description,
  items,
  onOpen,
}: {
  title: string;
  description: string;
  items: Palette[];
  onOpen: (p: Palette) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title} className="space-y-3">
      <div>
        <h3 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {items.map((palette) => (
          <button
            key={palette.id}
            onClick={() => onOpen(palette)}
            className="group min-w-56 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-left hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex h-12 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
              {palette.colors.map((c, i) => (
                <span key={i} className="flex-1" style={{ backgroundColor: c.hex }} />
              ))}
            </div>
            <p className="mt-2 text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">
              {palette.name}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {palette.category} · {palette.count} clr
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function FeaturedRails({ palettes }: FeaturedRailsProps) {
  const { openStudio } = useStudio();
  const open = (p: Palette) => {
    playSound("open");
    openStudio(p);
  };

  const webApp = palettes
    .filter(
      (p) =>
        (p.category ?? "").toLowerCase().includes("web") ||
        (p.tags?.aesthetic ?? []).some((t) => t.toLowerCase().includes("web")),
    )
    .slice(0, 12);

  const dashboards = palettes
    .filter(
      (p) =>
        (p.category ?? "").toLowerCase().includes("dashboard") ||
        (p.tags?.mood ?? []).some((t) => ["ui", "product", "semantic"].includes(t.toLowerCase())),
    )
    .slice(0, 12);

  const expanded = palettes
    .filter((p) => p.count >= 11)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <div className="space-y-8 sm:space-y-10">
      <Rail
        title="Best for Web Apps"
        description="Semantic and product-ready palettes tuned for modern UI systems."
        items={webApp}
        onOpen={open}
      />
      <Rail
        title="Best for Dashboards"
        description="High-legibility palettes for charts, KPI cards, and dense interface surfaces."
        items={dashboards}
        onOpen={open}
      />
      <Rail
        title="New in 11-35 Color Range"
        description="Recently expanded high-count systems for advanced theming workflows."
        items={expanded}
        onOpen={open}
      />
    </div>
  );
}
