"use client";

import { useState } from "react";
import { useStudio } from "./studio-context";
import {
  getContrastRatio,
  hexToHsl,
  getReadableTextColor,
} from "@/utils/contrast-utils";
import { showToast } from "@/utils/toast";
import { Check, Copy, Shuffle } from "lucide-react";

function a11yBadge(ratio: number) {
  if (ratio >= 7)
    return {
      label: "AAA",
      cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };
  if (ratio >= 4.5)
    return {
      label: "AA",
      cls: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    };
  return {
    label: "FAIL",
    cls: "bg-red-500/10 text-red-400 border-red-500/20 opacity-60 italic",
  };
}

function ContrastRow({
  label,
  ratio,
  highlight,
}: {
  label: string;
  ratio: number;
  highlight?: boolean;
}) {
  const badge = a11yBadge(ratio);
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-[9px] font-bold w-14 shrink-0 ${highlight ? "text-pink-400" : "text-gray-400"}`}
      >
        {label}
      </span>
      <span
        className={`px-1.5 py-0.5 rounded border text-[8px] font-black ${badge.cls}`}
      >
        {badge.label}
      </span>
      <span className="text-[9px] text-gray-400 font-mono">
        {ratio.toFixed(1)}:1
      </span>
    </div>
  );
}

export function ColorLab() {
  const { selectedPalette } = useStudio();
  const [customBg, setCustomBg] = useState("");
  const [shuffleOrder, setShuffleOrder] = useState(false);
  const [copiedHex, setCopiedHex] = useState("");

  if (!selectedPalette) return null;

  const colors = shuffleOrder
    ? [...selectedPalette.colors].sort((a, b) => b.hex.localeCompare(a.hex))
    : selectedPalette.colors;

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    showToast(`${hex} copied!`);
    window.setTimeout(() => setCopiedHex(""), 1400);
  };

  return (
    <div id="contrast" className="scroll-mt-28 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
            Color Lab
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            WCAG contrast analysis per swatch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="text-[10px] font-bold text-gray-400">
              Custom BG:
            </span>
            <div
              className="relative w-6 h-6 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden cursor-pointer shadow-inner"
              style={{ backgroundColor: customBg || "#e2e8f0" }}
            >
              <input
                type="color"
                value={customBg || "#ffffff"}
                onChange={(e) => setCustomBg(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                title="Pick custom contrast background"
              />
            </div>
            {customBg && (
              <button
                onClick={() => setCustomBg("")}
                className="text-[10px] text-rose-400 hover:text-rose-600 font-bold transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => setShuffleOrder((s) => !s)}
            className="p-2 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
            title="Shuffle display order"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {colors.map((color, idx) => {
          const hex6 = color.hex.slice(0, 7).toUpperCase();
          const [h, s, l] = hexToHsl(hex6);
          const onWhite = getContrastRatio(hex6, "#ffffff");
          const onDark = getContrastRatio(hex6, "#0f172a");
          const onCustom = customBg ? getContrastRatio(hex6, customBg) : null;
          const textColor = getReadableTextColor(hex6);

          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all"
            >
              <button
                onClick={() => copyHex(hex6)}
                className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform active:scale-95 border border-black/5 cursor-copy"
                style={{ backgroundColor: hex6, color: textColor }}
                title={`Copy ${hex6}`}
              >
                {copiedHex === hex6 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-black select-none opacity-80">
                    Aa
                  </span>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm mb-1 truncate text-gray-900 dark:text-white">
                  {color.name}
                </h4>
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-[10px] text-gray-400 font-mono">
                    {hex6}
                  </code>
                  <button
                    onClick={() => copyHex(hex6)}
                    className={`transition-colors ${
                      copiedHex === hex6 ? "text-emerald-500" : "text-gray-300 hover:text-indigo-500"
                    }`}
                  >
                    {copiedHex === hex6 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <code className="block text-[9px] text-gray-300 dark:text-gray-600 font-mono mb-2">
                  hsl({h}, {s}%, {l}%)
                </code>
                <div className="space-y-1">
                  <ContrastRow label="On Light" ratio={onWhite} />
                  <ContrastRow label="On Dark" ratio={onDark} />
                  {onCustom !== null && (
                    <ContrastRow label="Custom" ratio={onCustom} highlight />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
