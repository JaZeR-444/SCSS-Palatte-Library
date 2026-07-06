"use client";

import { useMemo } from "react";
import { useStudio } from "./studio-context";
import { hexToHsl, getLuminanceValue } from "@/utils/contrast-utils";

export function MoodScore() {
  const { selectedPalette } = useStudio();

  const scores = useMemo(() => {
    if (!selectedPalette) return null;
    let totalSat = 0;
    let minLum = 1,
      maxLum = 0;
    let warmCount = 0;

    selectedPalette.colors.forEach((c) => {
      const [h, s] = hexToHsl(c.hex);
      totalSat += s;
      const lum = getLuminanceValue(c.hex);
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
      if ((h >= 0 && h <= 50) || h >= 330) warmCount++;
    });

    return {
      vibrancy: totalSat / selectedPalette.colors.length,
      contrastRange: (maxLum - minLum) * 100,
      temp: warmCount / selectedPalette.colors.length > 0.5 ? "Warm" : "Cool",
    };
  }, [selectedPalette]);

  if (!scores) return null;

  return (
    <div className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-2.5 py-2.5 backdrop-blur-sm sm:gap-5 sm:px-5 sm:py-3">
      <StatBar
        label="Vibrancy"
        value={scores.vibrancy}
        gradient="from-indigo-400 to-purple-500"
        hint="Average color saturation — higher means bolder, more colorful."
      />
      <div className="w-px h-8 bg-white/10" />
      <StatBar
        label="Contrast"
        value={scores.contrastRange}
        gradient="from-emerald-400 to-teal-500"
        hint="Spread between the lightest and darkest color — higher means more range for hierarchy."
      />
      <div className="w-px h-8 bg-white/10" />
      <div
        className="flex flex-col items-center gap-0.5"
        title="Overall temperature — whether warm (reds/oranges) or cool (blues/greens) hues dominate."
      >
        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
          Tone
        </span>
        <span className="text-sm font-black text-white">{scores.temp}</span>
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  gradient,
  hint,
}: {
  label: string;
  value: number;
  gradient: string;
  hint: string;
}) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div
      className="flex w-14 flex-col gap-1.5 sm:w-24"
      title={`${label}: ${pct}% — ${hint}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
          {label}
        </span>
        <span className="text-[9px] font-black tabular-nums text-white/70">
          {pct}
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
