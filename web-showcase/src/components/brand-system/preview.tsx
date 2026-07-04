"use client";

import { BrandSystem } from "@/types/brand-system";
import {
  Bell,
  CheckCircle2,
  Home,
  Info,
  LayoutGrid,
  Settings,
  TriangleAlert,
  XCircle,
} from "lucide-react";

/** Turn the role map into a set of scoped CSS custom properties. */
function tokenStyle(system: BrandSystem): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const r of system.rolesList) style[`--${r.key}`] = r.hex;
  return style as React.CSSProperties;
}

const v = (name: string) => `var(--${name})`;

export function BrandPreview({ system }: { system: BrandSystem }) {
  const style = tokenStyle(system);

  const chart = [62, 88, 45, 74, 96, 58];
  const chartColors = [
    "brand-primary",
    "brand-secondary",
    "brand-accent",
    "state-info",
    "state-success",
    "brand-primary",
  ];

  return (
    <div
      style={style}
      className="overflow-hidden rounded-[2rem] border border-black/5 shadow-inner"
    >
      <div
        className="space-y-6 p-5 sm:p-7"
        style={{ backgroundColor: v("bg-base"), color: v("text-primary") }}
      >
        {/* Mode label */}
        <div className="flex items-center justify-between">
          <span
            className="rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest"
            style={{
              backgroundColor: v("surface"),
              color: v("text-muted"),
              border: `1px solid ${system.roles["border-subtle"]}`,
            }}
          >
            {system.mode}-mode preview · {system.inputs.appName}
          </span>
        </div>

        {/* App shell */}
        <div
          className="flex overflow-hidden rounded-2xl"
          style={{ border: `1px solid ${system.roles["border-subtle"]}` }}
        >
          {/* Sidebar */}
          <aside
            className="flex w-14 flex-col items-center gap-4 py-5"
            style={{ backgroundColor: v("bg-elevated") }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: v("brand-primary"), color: v("on-brand") }}
            >
              <Home className="h-4 w-4" />
            </span>
            {[LayoutGrid, Bell, Settings].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ color: v("text-secondary") }}
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </aside>

          {/* Main */}
          <div className="flex-1" style={{ backgroundColor: v("bg-base") }}>
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                backgroundColor: v("bg-elevated"),
                borderBottom: `1px solid ${system.roles["border-subtle"]}`,
              }}
            >
              <div>
                <p className="text-xs font-black" style={{ color: v("text-primary") }}>
                  Overview
                </p>
                <p className="text-[9px]" style={{ color: v("text-muted") }}>
                  Welcome back
                </p>
              </div>
              <button
                className="rounded-lg px-3 py-1.5 text-[10px] font-black"
                style={{ backgroundColor: v("brand-primary"), color: v("on-brand") }}
              >
                New
              </button>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3 p-5">
              {[
                { label: "Revenue", value: "$48.2k", trend: "+12%" },
                { label: "Active", value: "1,204", trend: "+4%" },
                { label: "Churn", value: "0.8%", trend: "-2%" },
              ].map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: v("surface"),
                    border: `1px solid ${system.roles["border-subtle"]}`,
                  }}
                >
                  <p className="text-[9px] font-bold" style={{ color: v("text-muted") }}>
                    {m.label}
                  </p>
                  <p className="text-base font-black" style={{ color: v("text-primary") }}>
                    {m.value}
                  </p>
                  <span
                    className="text-[9px] font-black"
                    style={{ color: v("state-success") }}
                  >
                    {m.trend}
                  </span>
                  <div
                    className="mt-2 h-1 w-full rounded-full"
                    style={{ backgroundColor: system.roles["brand-accent"] }}
                  />
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="px-5 pb-5">
              <div
                className="flex h-24 items-end gap-2 rounded-xl p-3"
                style={{
                  backgroundColor: v("surface"),
                  border: `1px solid ${system.roles["border-subtle"]}`,
                }}
              >
                {chart.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md"
                    style={{
                      height: `${h}%`,
                      backgroundColor: system.roles[chartColors[i]],
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
            className="rounded-xl px-4 py-2 text-xs font-black"
            style={{ backgroundColor: v("brand-primary"), color: v("on-brand") }}
          >
            Primary action
          </button>
          <button
            className="rounded-xl px-4 py-2 text-xs font-black"
            style={{
              backgroundColor: v("surface"),
              color: v("text-primary"),
              border: `1px solid ${system.roles["border-strong"]}`,
            }}
          >
            Secondary
          </button>
          <button
            className="rounded-xl px-4 py-2 text-xs font-black"
            style={{ backgroundColor: v("state-error"), color: v("on-brand") }}
          >
            Delete
          </button>
          <span
            className="rounded-full px-3 py-1 text-[10px] font-black"
            style={{ backgroundColor: v("brand-accent"), color: v("on-brand") }}
          >
            Beta
          </span>
        </div>

        {/* Card + form */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            className="space-y-2 rounded-2xl p-4"
            style={{
              backgroundColor: v("surface"),
              border: `1px solid ${system.roles["border-subtle"]}`,
            }}
          >
            <p className="text-sm font-black" style={{ color: v("text-primary") }}>
              Card title
            </p>
            <p className="text-[11px]" style={{ color: v("text-secondary") }}>
              Supporting copy that explains the card contents in a sentence.
            </p>
            <p className="text-[10px]" style={{ color: v("text-muted") }}>
              Updated 2h ago
            </p>
            <a
              className="text-[11px] font-black"
              style={{ color: v("link") }}
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              Learn more →
            </a>
          </div>

          <div
            className="space-y-2 rounded-2xl p-4"
            style={{
              backgroundColor: v("surface"),
              border: `1px solid ${system.roles["border-subtle"]}`,
            }}
          >
            <label
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: v("text-muted") }}
            >
              Email
            </label>
            <div
              className="rounded-xl px-3 py-2 text-[11px]"
              style={{
                backgroundColor: v("bg-base"),
                color: v("text-primary"),
                border: `1px solid ${system.roles["border-subtle"]}`,
              }}
            >
              you@company.com
            </div>
            <div
              className="rounded-xl px-3 py-2 text-[11px]"
              style={{
                backgroundColor: v("bg-base"),
                color: v("text-muted"),
                border: `1px solid ${system.roles["border-strong"]}`,
                boxShadow: `0 0 0 2px ${system.roles["focus-ring"]}55`,
              }}
            >
              Focused field
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { icon: CheckCircle2, key: "state-success", text: "Changes saved successfully." },
            { icon: TriangleAlert, key: "state-warning", text: "Your trial ends in 3 days." },
            { icon: XCircle, key: "state-error", text: "We couldn't process the payment." },
            { icon: Info, key: "state-info", text: "A new version is available." },
          ].map((a, i) => {
            const Icon = a.icon;
            const color = system.roles[a.key];
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  backgroundColor: `${color}1f`,
                  border: `1px solid ${color}55`,
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color }} />
                <span className="text-[11px] font-medium" style={{ color: v("text-primary") }}>
                  {a.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Typography scale */}
        <div
          className="space-y-1.5 rounded-2xl p-4"
          style={{
            backgroundColor: v("surface"),
            border: `1px solid ${system.roles["border-subtle"]}`,
          }}
        >
          <p className="text-xl font-black" style={{ color: v("text-primary") }}>
            The quick brown fox
          </p>
          <p className="text-sm font-bold" style={{ color: v("text-secondary") }}>
            Secondary heading and supporting copy
          </p>
          <p className="text-[11px]" style={{ color: v("text-muted") }}>
            Muted metadata, timestamps and captions
          </p>
        </div>
      </div>
    </div>
  );
}
