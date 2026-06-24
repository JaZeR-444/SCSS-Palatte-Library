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
      temp:
        warmCount / selectedPalette.colors.length > 0.5 ? "Warm" : "Cool",
    };
  }, [selectedPalette]);

  if (!scores) return null;

  return (
    <div className="flex items-center gap-5 px-5 py-3 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 w-fit mx-auto">
      <StatBar
        label="Vibrancy"
        value={scores.vibrancy}
        gradient="from-indigo-400 to-purple-500"
      />
      <div className="w-px h-8 bg-white/10" />
      <StatBar
        label="Contrast"
        value={scores.contrastRange}
        gradient="from-emerald-400 to-teal-500"
      />
      <div className="w-px h-8 bg-white/10" />
      <div className="flex flex-col items-center gap-0.5">
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
}: {
  label: string;
  value: number;
  gradient: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex flex-col gap-1.5 w-24">
      <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
        {label}
      </span>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
