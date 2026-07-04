"use client";

import { useMemo, useState } from "react";
import { BrandSystem } from "@/types/brand-system";
import {
  exportCss,
  exportJson,
  exportMarkdown,
  exportScss,
  exportStyleDictionary,
  exportTailwind,
} from "@/utils/brand-system";
import { showToast } from "@/utils/toast";
import { playSound } from "@/utils/audio";
import { Copy, Download } from "lucide-react";

type Tab = "css" | "scss" | "json" | "tailwind" | "style-dictionary" | "markdown";

const TABS: { id: Tab; label: string; ext: string }[] = [
  { id: "css", label: "CSS Vars", ext: "css" },
  { id: "scss", label: "SCSS", ext: "scss" },
  { id: "json", label: "JSON", ext: "json" },
  { id: "tailwind", label: "Tailwind", ext: "js" },
  { id: "style-dictionary", label: "Style Dictionary", ext: "json" },
  { id: "markdown", label: "Markdown", ext: "md" },
];

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "brand-system"
  );
}

export function TokenOutput({ system }: { system: BrandSystem }) {
  const [tab, setTab] = useState<Tab>("css");

  const content = useMemo(() => {
    switch (tab) {
      case "css":
        return exportCss(system);
      case "scss":
        return exportScss(system);
      case "json":
        return exportJson(system);
      case "tailwind":
        return exportTailwind(system);
      case "style-dictionary":
        return exportStyleDictionary(system);
      case "markdown":
        return exportMarkdown(system);
    }
  }, [tab, system]);

  const download = () => {
    const ext = TABS.find((t) => t.id === tab)!.ext;
    const filename = `${slug(system.inputs.appName)}-brand-system.${ext}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}!`);
    playSound("success");
  };

  return (
    <div className="rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden">
      <div className="flex flex-wrap items-center border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              playSound("click");
            }}
            className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              tab === t.id
                ? "border-indigo-500 text-indigo-500 bg-white dark:bg-slate-900"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={download}
          className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold text-gray-400 hover:text-violet-500 transition-colors cursor-pointer border-l border-gray-100 dark:border-slate-800"
          title="Download as file"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(content);
            showToast(`${tab.toUpperCase()} copied to clipboard!`);
            playSound("success");
          }}
          className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer"
          title="Copy to clipboard"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
      <div className="max-h-80 overflow-auto no-scrollbar bg-gray-950 p-5">
        <pre className="text-[11px] font-mono leading-relaxed text-gray-300 whitespace-pre">
          {content}
        </pre>
      </div>
    </div>
  );
}
