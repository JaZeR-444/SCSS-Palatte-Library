"use client";

import { useStudio } from "../studio-context";
import { getContrastRatio } from "@/utils/contrast-utils";
import { BookOpen, Check, AlertTriangle, AlertCircle } from "lucide-react";

export function TypographyScenario() {
  const { roleMapping } = useStudio();

  // Color combinations to test
  const tests = [
    { name: "Primary Text on Background", textVar: "--ui-color-6", bgVar: "--ui-color-3", type: "body" },
    { name: "Muted Text on Background", textVar: "--ui-color-7", bgVar: "--ui-color-3", type: "body" },
    { name: "Brand Primary on Background", textVar: "--ui-color-1", bgVar: "--ui-color-3", type: "large" },
    { name: "Accent Secondary on Background", textVar: "--ui-color-2", bgVar: "--ui-color-3", type: "large" },
    { name: "Success State on Surface", textVar: "--ui-color-8", bgVar: "--ui-color-4", type: "large" },
    { name: "Danger State on Surface", textVar: "--ui-color-10", bgVar: "--ui-color-4", type: "large" }
  ];

  const getCompliance = (ratio: number, type: string) => {
    const minAA = type === "large" ? 3.0 : 4.5;
    const minAAA = type === "large" ? 4.5 : 7.0;

    if (ratio >= minAAA) return { grade: "AAA Pass", style: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: Check };
    if (ratio >= minAA) return { grade: "AA Pass", style: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20", icon: Check };
    return { grade: "Fail", style: "text-red-500 bg-red-500/10 border-red-500/20", icon: AlertCircle };
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Typography Hierarchy Lab */}
      <div 
        className="lg:col-span-7 p-8 rounded-[2.5rem] border space-y-6 transition-colors"
        style={{ 
          backgroundColor: roleMapping["--ui-color-4"], 
          borderColor: roleMapping["--ui-color-5"] 
        }}
      >
        <div className="flex items-center gap-2 pb-4 border-b" style={{ borderColor: roleMapping["--ui-color-5"] }}>
          <BookOpen className="h-5 w-5" style={{ color: roleMapping["--ui-color-1"] }} />
          <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: roleMapping["--ui-color-6"] }}>
            Type Hierarchy Lab
          </h4>
        </div>

        <div className="space-y-4">
          {/* Headings */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight" style={{ color: roleMapping["--ui-color-6"] }}>
              Heading Level 1
            </h1>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: roleMapping["--ui-color-1"] }}>
              Heading Level 2
            </h2>
            <h3 className="text-xl font-bold tracking-tight" style={{ color: roleMapping["--ui-color-2"] }}>
              Heading Level 3
            </h3>
          </div>

          {/* Paragraph */}
          <p className="text-xs leading-relaxed font-medium" style={{ color: roleMapping["--ui-color-6"] }}>
            This is standard body typography rendered using the primary text token. You can test line-height, kerning, and readability. Important concepts can be <span className="font-bold underline" style={{ color: roleMapping["--ui-color-1"] }}>highlighted in the brand primary</span> color or referenced in the <span className="font-bold" style={{ color: roleMapping["--ui-color-2"] }}>accent secondary</span> color.
          </p>

          {/* Blockquote */}
          <blockquote 
            className="pl-4 py-2 border-l-4 rounded-r-xl"
            style={{ 
              borderColor: roleMapping["--ui-color-1"],
              backgroundColor: roleMapping["--ui-color-3"] + "33"
            }}
          >
            <p className="text-xs italic font-semibold" style={{ color: roleMapping["--ui-color-7"] }}>
              "Color contrast is a cornerstone of accessibility. Choosing beautiful colors that developers can actually read creates high-quality products."
            </p>
          </blockquote>

          {/* Inline Code */}
          <p className="text-[11px] font-semibold" style={{ color: roleMapping["--ui-color-6"] }}>
            Import variables using 
            <code 
              className="mx-1.5 px-2 py-0.5 rounded-md font-mono text-[10px]"
              style={{ backgroundColor: roleMapping["--ui-color-3"], color: roleMapping["--ui-color-2"] }}
            >
              @import 'Midnight Neon';
            </code> 
            in your SCSS compiler.
          </p>
        </div>
      </div>

      {/* Live Contrast Matrix */}
      <div className="lg:col-span-5 space-y-4">
        <div 
          className="p-6 rounded-[2rem] border space-y-4"
          style={{ 
            backgroundColor: roleMapping["--ui-color-4"], 
            borderColor: roleMapping["--ui-color-5"] 
          }}
        >
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: roleMapping["--ui-color-6"] }}>
              Contrast Matrix
            </h4>
            <p className="text-[10px] font-bold" style={{ color: roleMapping["--ui-color-7"] }}>
              Real-time calculations for WCAG 2.0 conformance.
            </p>
          </div>

          <div className="space-y-3">
            {tests.map((t, i) => {
              const textHex = roleMapping[t.textVar];
              const bgHex = roleMapping[t.bgVar];
              const ratio = (textHex && bgHex) ? getContrastRatio(textHex, bgHex) : 1;
              const compliance = getCompliance(ratio, t.type);
              const IconComp = compliance.icon;

              return (
                <div 
                  key={i}
                  className="p-3 rounded-xl border flex items-center justify-between gap-3 text-[10px] font-bold"
                  style={{ backgroundColor: roleMapping["--ui-color-3"] + "22", borderColor: roleMapping["--ui-color-5"] }}
                >
                  <div className="min-w-0">
                    <p className="truncate" style={{ color: roleMapping["--ui-color-6"] }}>{t.name}</p>
                    <p className="font-mono text-[9px] mt-0.5 opacity-80" style={{ color: roleMapping["--ui-color-7"] }}>
                      {textHex} on {bgHex}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span 
                      className="px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase"
                      style={{ color: textHex, backgroundColor: bgHex, borderColor: roleMapping["--ui-color-5"] }}
                    >
                      {ratio.toFixed(1)}:1
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black tracking-widest uppercase flex items-center gap-1 ${compliance.style}`}>
                      <IconComp className="h-3 w-3" />
                      {compliance.grade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
