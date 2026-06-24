"use client";

import { useStudio } from "../studio-context";
import { ArrowRight, Sparkles, Layers, ShieldCheck, Zap } from "lucide-react";

export function LandingScenario() {
  const { roleMapping } = useStudio();

  const features = [
    {
      icon: Zap,
      title: "Extremely Fast",
      desc: "Instant loading speeds and lightweight runtime footprint."
    },
    {
      icon: Layers,
      title: "Modular Core",
      desc: "Pick and choose variables or import the entire package easily."
    },
    {
      icon: ShieldCheck,
      title: "Contrast Safe",
      desc: "All color scales pass AA/AAA guidelines automatically."
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Mock Navbar */}
      <div 
        className="flex items-center justify-between pb-4 border-b transition-colors"
        style={{ borderColor: roleMapping["--ui-color-5"] }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{ backgroundColor: roleMapping["--ui-color-1"] }}
          >
            S
          </div>
          <span className="font-bold text-sm" style={{ color: roleMapping["--ui-color-6"] }}>SaaS.co</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-xs font-bold" style={{ color: roleMapping["--ui-color-7"] }}>
          <span className="hover:opacity-85 cursor-pointer">Product</span>
          <span className="hover:opacity-85 cursor-pointer">Pricing</span>
          <span className="hover:opacity-85 cursor-pointer">Docs</span>
        </div>
        <button 
          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-sm hover:scale-105 active:scale-95 transition-all"
          style={{ backgroundColor: roleMapping["--ui-color-1"] }}
        >
          Get Started
        </button>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-6 py-6">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest"
          style={{ 
            backgroundColor: roleMapping["--ui-color-1"] + "0d",
            borderColor: roleMapping["--ui-color-1"] + "22",
            color: roleMapping["--ui-color-1"] 
          }}
        >
          <Sparkles className="h-3 w-3" />
          <span>Next Generation Framework</span>
        </div>

        <h3 
          className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]"
          style={{ color: roleMapping["--ui-color-6"] }}
        >
          Design systems for{" "}
          <span 
            className="bg-gradient-to-r bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${roleMapping["--ui-color-1"]}, ${roleMapping["--ui-color-2"]})`
            }}
          >
            creative builders.
          </span>
        </h3>

        <p 
          className="text-xs sm:text-sm font-medium leading-relaxed max-w-lg mx-auto"
          style={{ color: roleMapping["--ui-color-7"] }}
        >
          Unlock your team's velocity with beautifully structured, accessible SCSS theme templates. Made for clean CSS properties and standard modular setups.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <button 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all"
            style={{ 
              backgroundColor: roleMapping["--ui-color-1"],
              boxShadow: `0 10px 20px -10px ${roleMapping["--ui-color-1"]}88`
            }}
          >
            <span>Deploy Now</span>
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
          <button 
            className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            style={{ 
              borderColor: roleMapping["--ui-color-5"],
              color: roleMapping["--ui-color-6"]
            }}
          >
            Read Docs
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const IconComponent = f.icon;
          return (
            <div 
              key={i}
              className="p-6 rounded-[2rem] border transition-all hover:translate-y-[-2px] duration-300"
              style={{ 
                backgroundColor: roleMapping["--ui-color-4"], // Card Surface
                borderColor: roleMapping["--ui-color-5"] // Subtle Border
              }}
            >
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 border"
                style={{ 
                  backgroundColor: roleMapping["--ui-color-1"] + "11",
                  borderColor: roleMapping["--ui-color-1"] + "22",
                  color: roleMapping["--ui-color-1"]
                }}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <h4 
                className="font-bold text-sm tracking-tight mb-2"
                style={{ color: roleMapping["--ui-color-6"] }} // Primary Text
              >
                {f.title}
              </h4>
              <p 
                className="text-[11px] leading-relaxed font-semibold"
                style={{ color: roleMapping["--ui-color-7"] }} // Muted Text
              >
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
