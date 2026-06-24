"use client";

import { useStudio } from "../studio-context";
import { Home } from "lucide-react";

export function DashboardScenario() {
  const { roleMapping } = useStudio();

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-200 dark:border-slate-800 overflow-hidden shadow-2xl flex h-[400px]">
        {/* Sidebar */}
        <aside 
          className="w-20 flex flex-col items-center py-6 gap-6 transition-colors duration-500"
          style={{ backgroundColor: roleMapping["--ui-color-1"] }}
        >
          <div 
            className="w-10 h-10 rounded-xl shadow-sm text-white flex items-center justify-center"
            style={{ backgroundColor: roleMapping["--ui-color-2"] }}
          >
            <Home className="h-5 w-5" />
          </div>
          <div className="w-10 h-10 rounded-xl opacity-40" style={{ backgroundColor: roleMapping["--ui-color-3"] }} />
          <div className="w-10 h-10 rounded-xl opacity-40" style={{ backgroundColor: roleMapping["--ui-color-4"] }} />
          <div className="mt-auto w-10 h-10 rounded-full border-2" style={{ borderColor: roleMapping["--ui-color-5"] }} />
        </aside>

        {/* Content */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <div className="h-5 w-24 rounded-full opacity-20" style={{ backgroundColor: roleMapping["--ui-color-6"] }} />
              <div className="h-5 w-32 rounded-full opacity-10" style={{ backgroundColor: roleMapping["--ui-color-7"] }} />
            </div>
            <div 
              className="w-10 h-10 rounded-full shadow-lg transition-all"
              style={{ background: `linear-gradient(135deg, ${roleMapping["--ui-color-1"]}, ${roleMapping["--ui-color-3"]})` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="p-6 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 space-y-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="h-4 w-16 rounded-full" style={{ backgroundColor: roleMapping[`--ui-color-${5+i}`] }} />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roleMapping["--ui-color-8"] }} />
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: roleMapping["--ui-color-9"] }} />
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full" />
                <div className="h-2 w-2/3 bg-gray-50 dark:bg-slate-800/50 rounded-full" />
              </div>
            ))}
          </div>

          <button 
            className="w-full h-12 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ 
              backgroundColor: roleMapping["--ui-color-1"],
              boxShadow: `0 10px 25px -5px ${roleMapping["--ui-color-1"]}44`
            }}
          >
            System Action
          </button>
        </div>
      </div>

      <div className="lg:col-span-3 flex flex-col justify-center gap-4">
        <div className="p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-500/10">
          <h4 className="text-xs font-black uppercase text-indigo-500 mb-3 tracking-widest">Dashboard View</h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Optimized for deep-surface navigation and high-contrast status monitoring.
          </p>
        </div>
      </div>
    </div>
  );
}
