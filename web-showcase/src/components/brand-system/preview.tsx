"use client";

import { useEffect, useRef, useState } from "react";
import { ColorMode } from "@/types/brand-system";
import { DesignSystem } from "@/types/design-system";
import {
  Bell,
  CheckCircle2,
  Home,
  Info,
  LayoutGrid,
  Moon,
  Settings,
  Sun,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";

const v = (name: string) => `var(--${name})`;

/** Human labels for the editable tokens surfaced by the inspector. */
const TOKEN_LABELS: Record<string, string> = {
  "bg-base": "Background",
  surface: "Surface",
  "brand-primary": "Brand Primary",
  "brand-accent": "Brand Accent",
  "border-strong": "Border Strong",
  "text-primary": "Text Primary",
  "text-secondary": "Text Secondary",
  "text-muted": "Text Muted",
  link: "Link",
  "state-success": "Success",
  "state-warning": "Warning",
  "state-error": "Error",
  "state-info": "Info",
};

interface Inspector {
  key: string;
  top: number;
  left: number;
}

export function BrandPreview({
  designSystem,
  onColorChange,
}: {
  designSystem: DesignSystem;
  /** Persist an inline color edit for the given mode. */
  onColorChange?: (mode: ColorMode, key: string, hex: string) => void;
}) {
  const ds = designSystem;
  const [mode, setMode] = useState<ColorMode>(ds.mode);
  const [inspector, setInspector] = useState<Inspector | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const color = mode === "dark" ? ds.tokens.color.dark : ds.tokens.color.light;
  const t = ds.tokens;

  // Close inspector on Escape.
  useEffect(() => {
    if (!inspector) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setInspector(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspector]);

  // Scoped CSS vars from the (possibly edited) color tokens + non-color tokens.
  const rootStyle: React.CSSProperties = {
    fontFamily: t.typography.sans,
    ["--ds-r" as string]: `${t.radius.md}px`,
    ["--ds-r-lg" as string]: `${t.radius.lg}px`,
    ["--ds-sh" as string]: t.shadow[1] ?? "none",
  };
  for (const [k, hex] of Object.entries(color)) {
    (rootStyle as Record<string, string>)[`--${k}`] = hex;
  }

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: "var(--ds-r-lg)",
    boxShadow: "var(--ds-sh)",
    ...extra,
  });
  const ctrl = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: "var(--ds-r)",
    ...extra,
  });

  const density = t.density;
  const pad =
    density === "compact"
      ? "p-4 sm:p-5"
      : density === "comfortable"
        ? "p-6 sm:p-9"
        : "p-5 sm:p-7";
  const gap =
    density === "compact"
      ? "space-y-4"
      : density === "comfortable"
        ? "space-y-8"
        : "space-y-6";

  const chart = [62, 88, 45, 74, 96, 58];
  const chartColors = t.chart;

  // Delegated click: open the inspector for the nearest editable region.
  const handleClick = (e: React.MouseEvent) => {
    if (!onColorChange) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-inspector]")) return; // clicks inside the panel
    const el = target.closest<HTMLElement>("[data-token]");
    const wrap = wrapRef.current;
    if (!el || !wrap) {
      setInspector(null);
      return;
    }
    const key = el.getAttribute("data-token")!;
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const left = Math.max(4, Math.min(r.left - w.left, w.width - 236));
    setInspector({ key, top: r.bottom - w.top + 6, left });
  };

  return (
    <div ref={wrapRef} className="relative space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-gray-400">
          Previewing the{" "}
          <span className="font-black text-gray-500 dark:text-gray-300">
            {mode}
          </span>{" "}
          theme
          {mode === ds.mode && " (default)"}.
          {onColorChange && " Click any element to recolor it."}
        </p>
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setMode("light")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              mode === "light"
                ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Light
          </button>
          <button
            type="button"
            onClick={() => setMode("dark")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              mode === "dark"
                ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Dark
          </button>
        </div>
      </div>

      <div
        style={rootStyle}
        onClick={handleClick}
        className={`overflow-hidden rounded-[2rem] border border-black/5 shadow-inner ${
          onColorChange
            ? "[&_[data-token]]:cursor-pointer [&_[data-token]:hover]:outline [&_[data-token]:hover]:outline-2 [&_[data-token]:hover]:outline-indigo-400/70"
            : ""
        }`}
      >
        <div
          data-token="bg-base"
          className={`${gap} ${pad}`}
          style={{ backgroundColor: v("bg-base"), color: v("text-primary") }}
        >
          {/* Mode label */}
          <div className="flex items-center justify-between">
            <span
              className="rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest"
              style={{
                backgroundColor: v("surface"),
                color: v("text-muted"),
                border: `1px solid ${color["border-subtle"]}`,
                ...ctrl(),
              }}
            >
              {mode}-mode preview · {ds.name}
            </span>
          </div>

          {/* App shell */}
          <div
            className="flex overflow-hidden"
            style={{ border: `1px solid ${color["border-subtle"]}`, ...card() }}
          >
            <aside
              className="flex w-14 flex-col items-center gap-4 py-5"
              style={{ backgroundColor: v("bg-elevated") }}
            >
              <span
                data-token="brand-primary"
                className="flex h-9 w-9 items-center justify-center"
                style={{
                  backgroundColor: v("brand-primary"),
                  color: v("on-brand"),
                  ...ctrl(),
                }}
              >
                <Home className="h-4 w-4" />
              </span>
              {[LayoutGrid, Bell, Settings].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center"
                  style={{ color: v("text-secondary") }}
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </aside>

            <div className="flex-1" style={{ backgroundColor: v("bg-base") }}>
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  backgroundColor: v("bg-elevated"),
                  borderBottom: `1px solid ${color["border-subtle"]}`,
                }}
              >
                <div>
                  <p
                    data-token="text-primary"
                    className="text-xs font-black"
                    style={{ color: v("text-primary") }}
                  >
                    Overview
                  </p>
                  <p className="text-[9px]" style={{ color: v("text-muted") }}>
                    Welcome back
                  </p>
                </div>
                <button
                  data-token="brand-primary"
                  className="px-3 py-1.5 text-[10px] font-black"
                  style={{
                    backgroundColor: v("brand-primary"),
                    color: v("on-brand"),
                    ...ctrl(),
                  }}
                >
                  New
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 p-5">
                {[
                  { label: "Revenue", value: "$48.2k", trend: "+12%" },
                  { label: "Active", value: "1,204", trend: "+4%" },
                  { label: "Churn", value: "0.8%", trend: "-2%" },
                ].map((m, i) => (
                  <div
                    key={i}
                    data-token={i === 0 ? "surface" : undefined}
                    className="p-3"
                    style={{
                      backgroundColor: v("surface"),
                      border: `1px solid ${color["border-subtle"]}`,
                      ...card(),
                    }}
                  >
                    <p
                      className="text-[9px] font-bold"
                      style={{ color: v("text-muted") }}
                    >
                      {m.label}
                    </p>
                    <p
                      className="text-base font-black"
                      style={{ color: v("text-primary") }}
                    >
                      {m.value}
                    </p>
                    <span
                      className="text-[9px] font-black"
                      style={{ color: v("state-success-text") }}
                    >
                      {m.trend}
                    </span>
                    <div
                      data-token={i === 0 ? "brand-accent" : undefined}
                      className="mt-2 h-1 w-full rounded-full"
                      style={{ backgroundColor: color["brand-accent"] }}
                    />
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <div
                  className="flex h-24 items-end gap-2 p-3"
                  style={{
                    backgroundColor: v("surface"),
                    border: `1px solid ${color["border-subtle"]}`,
                    ...card(),
                  }}
                >
                  {chart.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md"
                      style={{
                        height: `${h}%`,
                        backgroundColor: chartColors[i % chartColors.length],
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              data-token="brand-primary"
              className="px-4 py-2 text-xs font-black"
              style={{
                backgroundColor: v("brand-primary"),
                color: v("on-brand"),
                ...ctrl(),
              }}
            >
              Primary action
            </button>
            <button
              data-token="border-strong"
              className="px-4 py-2 text-xs font-black"
              style={{
                backgroundColor: v("surface"),
                color: v("text-primary"),
                border: `1px solid ${color["border-strong"]}`,
                ...ctrl(),
              }}
            >
              Secondary
            </button>
            <button
              data-token="state-error"
              className="px-4 py-2 text-xs font-black"
              style={{
                backgroundColor: v("state-error"),
                color: v("on-error"),
                ...ctrl(),
              }}
            >
              Delete
            </button>
            <span
              data-token="brand-accent"
              className="rounded-full px-3 py-1 text-[10px] font-black"
              style={{
                backgroundColor: v("brand-accent"),
                color: v("on-accent"),
              }}
            >
              Beta
            </span>
          </div>

          {/* Card + form */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              data-token="surface"
              className="space-y-2 p-4"
              style={{
                backgroundColor: v("surface"),
                border: `1px solid ${color["border-subtle"]}`,
                ...card(),
              }}
            >
              <p
                data-token="text-primary"
                className="text-sm font-black"
                style={{ color: v("text-primary") }}
              >
                Card title
              </p>
              <p
                data-token="text-secondary"
                className="text-[11px]"
                style={{ color: v("text-secondary") }}
              >
                Supporting copy that explains the card contents in a sentence.
              </p>
              <p
                data-token="text-muted"
                className="text-[10px]"
                style={{ color: v("text-muted") }}
              >
                Updated 2h ago
              </p>
              <a
                data-token="link"
                className="text-[11px] font-black"
                style={{ color: v("link") }}
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Learn more →
              </a>
            </div>

            <div
              className="space-y-2 p-4"
              style={{
                backgroundColor: v("surface"),
                border: `1px solid ${color["border-subtle"]}`,
                ...card(),
              }}
            >
              <label
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: v("text-muted") }}
              >
                Email
              </label>
              <div
                className="px-3 py-2 text-[11px]"
                style={{
                  backgroundColor: v("bg-base"),
                  color: v("text-primary"),
                  border: `1px solid ${color["border-subtle"]}`,
                  ...ctrl(),
                }}
              >
                you@company.com
              </div>
              <div
                className="px-3 py-2 text-[11px]"
                style={{
                  backgroundColor: v("bg-base"),
                  color: v("text-muted"),
                  border: `1px solid ${color["border-strong"]}`,
                  boxShadow: `0 0 0 2px ${color["focus-ring"]}55`,
                  ...ctrl(),
                }}
              >
                Focused field
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              {
                icon: CheckCircle2,
                fill: "state-success",
                text: "state-success-text",
                label: "Changes saved successfully.",
              },
              {
                icon: TriangleAlert,
                fill: "state-warning",
                text: "state-warning-text",
                label: "Your trial ends in 3 days.",
              },
              {
                icon: XCircle,
                fill: "state-error",
                text: "state-error-text",
                label: "We couldn't process the payment.",
              },
              {
                icon: Info,
                fill: "state-info",
                text: "state-info-text",
                label: "A new version is available.",
              },
            ].map((a, i) => {
              const Icon = a.icon;
              const fill = color[a.fill];
              const textColor = color[a.text];
              return (
                <div
                  key={i}
                  data-token={a.fill}
                  className="flex items-center gap-2 px-3 py-2"
                  style={{
                    backgroundColor: `${fill}1f`,
                    border: `1px solid ${fill}55`,
                    ...ctrl(),
                  }}
                >
                  <Icon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: textColor }}
                  />
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: v("text-primary") }}
                  >
                    {a.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Typography scale */}
          <div
            className="space-y-1.5 p-4"
            style={{
              backgroundColor: v("surface"),
              border: `1px solid ${color["border-subtle"]}`,
              ...card(),
            }}
          >
            <p
              data-token="text-primary"
              className="font-black"
              style={{
                color: v("text-primary"),
                fontSize: `${t.typography.scale[6]}px`,
                lineHeight: t.typography.lineHeight,
                letterSpacing: `${t.typography.tracking}em`,
              }}
            >
              The quick brown fox
            </p>
            <p
              data-token="text-secondary"
              className="text-sm font-bold"
              style={{ color: v("text-secondary") }}
            >
              Secondary heading and supporting copy
            </p>
            <p
              data-token="text-muted"
              className="text-[11px]"
              style={{ color: v("text-muted") }}
            >
              Muted metadata, timestamps and captions
            </p>
          </div>
        </div>
      </div>

      {/* Floating color inspector */}
      {inspector && onColorChange && (
        <div
          data-inspector
          className="absolute z-20 w-[228px] rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          style={{ top: inspector.top, left: inspector.left }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-black text-gray-900 dark:text-white">
              {TOKEN_LABELS[inspector.key] ?? inspector.key}
            </p>
            <button
              onClick={() => setInspector(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              aria-label="Close inspector"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <code className="mb-2 block text-[9px] font-mono text-gray-400">
            --{inspector.key} · {mode}
          </code>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(color[inspector.key] ?? "#000000").slice(0, 7)}
              onChange={(e) =>
                onColorChange(mode, inspector.key, e.target.value.toUpperCase())
              }
              className="h-9 w-10 flex-shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-transparent dark:border-slate-700"
            />
            <input
              type="text"
              value={(color[inspector.key] ?? "").slice(0, 7)}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                  onColorChange(mode, inspector.key, val.toUpperCase());
                }
              }}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
