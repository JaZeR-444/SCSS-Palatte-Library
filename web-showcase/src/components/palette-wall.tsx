"use client";

import { useEffect, useState } from "react";
import palettesData from "@/data/palettes.json";
import { Palette } from "@/types";

export function PaletteWall() {
  const [isClient, setIsClient] = useState(false);
  const [allowMotion, setAllowMotion] = useState(true);
  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean };
    }).connection;
    const saveData = Boolean(connection?.saveData);
    const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
    setAllowMotion(!(reducedMotion || saveData || lowCpu));
  }, [isClient]);

  if (!isClient) return null;

  const palettes = (palettesData as Palette[]).slice(0, 48);
  const col1 = palettes.filter((_, i) => i % 2 === 0);
  const col2 = palettes.filter((_, i) => i % 2 !== 0);

  return (
    <div
      className="absolute inset-y-0 right-0 w-[45%] overflow-hidden pointer-events-none hidden lg:flex gap-2 px-3"
      aria-hidden="true"
    >
      {/* Left-edge fade */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10" />
      {/* Top/bottom fade */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white dark:from-slate-950 to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white dark:from-slate-950 to-transparent z-10" />

      {/* Column 1 */}
      <div className={`flex-1 flex flex-col gap-2 opacity-70 ${allowMotion ? "animate-scroll-up" : ""}`}>
        {[...col1, ...col1].map((p, i) => (
          <div
            key={`c1-${i}`}
            className="flex h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm"
          >
            {p.colors.map((c, ci) => (
              <div
                key={ci}
                className="flex-1 h-full"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Column 2 (offset + slower) */}
      <div
        className={`flex-1 flex flex-col gap-2 opacity-50 ${allowMotion ? "animate-scroll-up-slow" : ""}`}
        style={{ marginTop: "-64px" }}
      >
        {[...col2, ...col2].map((p, i) => (
          <div
            key={`c2-${i}`}
            className="flex h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm"
          >
            {p.colors.map((c, ci) => (
              <div
                key={ci}
                className="flex-1 h-full"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
