"use client";

import { useStudio } from "../studio-context";
import { Activity, Bell, Database, Home, Search, ShieldCheck } from "lucide-react";

export function DashboardScenario() {
  const { roleMapping } = useStudio();

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-2xl flex h-[400px]">
        {/* Sidebar */}
        <aside 
          className="w-20 flex flex-col items-center py-6 gap-5 transition-colors duration-500"
          style={{ backgroundColor: roleMapping["--ui-color-1"] }}
        >
          <div 
            className="w-10 h-10 rounded-xl shadow-sm text-white flex items-center justify-center"
            style={{ backgroundColor: roleMapping["--ui-color-2"] }}
          >
            <Home className="h-5 w-5" />
          </div>
          {[Activity, Database, ShieldCheck].map((Icon, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-xl flex items-center justify-center opacity-70"
              style={{ backgroundColor: roleMapping[`--ui-color-${index + 3}`], color: roleMapping["--ui-color-9"] }}
            >
              <Icon className="h-4 w-4" />
            </div>
          ))}
          <div
            className="mt-auto w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black"
            style={{ borderColor: roleMapping["--ui-color-5"], color: roleMapping["--ui-color-8"] }}
          >
            21
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 p-8 space-y-7 overflow-y-auto subtle-scrollbar">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: roleMapping["--ui-color-7"] }}>
                Live Operations
              </p>
              <h3 className="text-lg font-black tracking-tight" style={{ color: roleMapping["--ui-color-9"] }}>
                Interface Health
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-36 rounded-xl px-3 flex items-center gap-2 border"
                style={{ borderColor: roleMapping["--ui-color-5"], color: roleMapping["--ui-color-7"] }}
              >
                <Search className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">Search systems</span>
              </div>
              <div
                className="w-9 h-9 rounded-full shadow-lg transition-all flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${roleMapping["--ui-color-10"]}, ${roleMapping["--ui-color-12"]})`, color: roleMapping["--ui-color-9"] }}
              >
                <Bell className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Uptime", value: "99.8%", role: 16 },
              { label: "Latency", value: "124ms", role: 17 },
              { label: "Events", value: "8.4k", role: 18 },
            ].map((metric, i) => (
              <div 
                key={metric.label}
                className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: roleMapping["--ui-color-7"] }}>
                    {metric.label}
                  </span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roleMapping[`--ui-color-${metric.role}`] }} />
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: roleMapping["--ui-color-21"] }} />
                  </div>
                </div>
                <p className="text-2xl font-black tracking-tight" style={{ color: roleMapping["--ui-color-9"] }}>
                  {metric.value}
                </p>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${62 + i * 12}%`, backgroundColor: roleMapping[`--ui-color-${metric.role}`] }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8 gap-2 items-end h-20">
            {[42, 58, 51, 72, 66, 84, 76, 91].map((height, index) => (
              <div
                key={index}
                className="rounded-t-xl"
                style={{
                  height: `${height}%`,
                  backgroundColor: roleMapping[`--ui-color-${10 + (index % 6)}`],
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          <button 
            className="w-full h-12 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ 
              backgroundColor: roleMapping["--ui-color-10"],
              boxShadow: `0 10px 25px -5px ${roleMapping["--ui-color-10"]}44`
            }}
          >
            Run System Audit
          </button>
        </div>
      </div>

      <div className="lg:col-span-3 flex flex-col justify-center gap-4">
        <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-500/10">
          <h4 className="text-xs font-black uppercase text-indigo-500 mb-3 tracking-widest">Dashboard View</h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Optimized for deep-surface navigation and high-contrast status monitoring.
          </p>
        </div>
      </div>
    </div>
  );
}
