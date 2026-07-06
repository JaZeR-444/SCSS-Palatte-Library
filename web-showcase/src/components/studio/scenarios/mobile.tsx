"use client";

import { useStudio } from "../studio-context";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music,
  Search,
  Library,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";

export function MobileScenario() {
  const { roleMapping } = useStudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35); // percentage

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) return 0;
          return p + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (percent: number) => {
    const totalSeconds = 210; // 3:30 total song
    const currentSeconds = Math.round((percent / 100) * totalSeconds);
    const m = Math.floor(currentSeconds / 60);
    const s = Math.floor(currentSeconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Smartphone Mockup */}
      <div
        className="w-[300px] h-[580px] rounded-[3rem] border-8 shadow-2xl overflow-hidden flex flex-col relative transition-colors duration-300"
        data-role="--ui-color-3"
        style={{
          backgroundColor: roleMapping["--ui-color-3"], // Phone Screen Base Background
          borderColor: roleMapping["--ui-color-5"], // Phone Bezel
        }}
      >
        {/* Dynamic Island / Bezel Top */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 ml-auto mr-3" />
        </div>

        {/* Status Bar */}
        <div
          className="px-6 pt-3 pb-2 flex justify-between items-center text-[10px] font-black z-20"
          data-role="--ui-color-7"
          style={{ color: roleMapping["--ui-color-7"] }}
        >
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" />
            <div
              className="w-4 h-2 border rounded-sm flex items-center p-0.5"
              data-role="--ui-color-7"
              style={{ borderColor: roleMapping["--ui-color-7"] }}
            >
              <div className="h-full w-2.5 bg-current rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Main Content Area (Music Player) */}
        <div className="flex-1 px-6 flex flex-col justify-between py-4 select-none">
          {/* Header */}
          <div className="text-center">
            <span
              className="text-[9px] font-black uppercase tracking-widest"
              data-role="--ui-color-7"
              style={{ color: roleMapping["--ui-color-7"] }}
            >
              Now Playing
            </span>
          </div>

          {/* Album Art */}
          <div className="my-auto py-2">
            <div
              className="w-full aspect-square rounded-[2rem] shadow-xl relative overflow-hidden flex items-center justify-center group"
              data-role="--ui-color-1"
              style={{
                background: `linear-gradient(135deg, ${roleMapping["--ui-color-1"]}, ${roleMapping["--ui-color-2"]})`,
                boxShadow: `0 20px 40px -15px ${roleMapping["--ui-color-1"]}66`,
              }}
            >
              <div className="absolute inset-0 bg-black/10" />
              {/* Rotating Disk Effect */}
              <div
                className={`w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center relative bg-black/20 ${isPlaying ? "animate-spin [animation-duration:8s]" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="space-y-4">
            <div>
              <h4
                className="font-black text-base tracking-tight text-center"
                data-role="--ui-color-6"
                style={{ color: roleMapping["--ui-color-6"] }}
              >
                Hyper-space Pulse
              </h4>
              <p
                className="text-xs font-semibold text-center mt-0.5"
                data-role="--ui-color-7"
                style={{ color: roleMapping["--ui-color-7"] }}
              >
                Cortex Voyager
              </p>
            </div>

            {/* Slider */}
            <div className="space-y-1.5">
              <div
                className="h-1 w-full rounded-full cursor-pointer relative"
                data-role="--ui-color-5"
                style={{ backgroundColor: roleMapping["--ui-color-5"] }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setProgress(Math.round((clickX / rect.width) * 100));
                }}
              >
                <div
                  className="h-full rounded-full"
                  data-role="--ui-color-1"
                  style={{
                    backgroundColor: roleMapping["--ui-color-1"],
                    width: `${progress}%`,
                  }}
                />
                <div
                  className="w-3 h-3 rounded-full absolute -top-1 shadow-md border border-white"
                  data-role="--ui-color-1"
                  style={{
                    backgroundColor: roleMapping["--ui-color-1"],
                    left: `calc(${progress}% - 6px)`,
                  }}
                />
              </div>
              <div
                className="flex justify-between items-center text-[9px] font-bold"
                data-role="--ui-color-7"
                style={{ color: roleMapping["--ui-color-7"] }}
              >
                <span>{formatTime(progress)}</span>
                <span>3:30</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-6 py-2">
              <button
                className="p-2 transition-all hover:scale-105 active:scale-95"
                data-role="--ui-color-6"
                style={{ color: roleMapping["--ui-color-6"] }}
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                data-role="--ui-color-1"
                style={{
                  backgroundColor: roleMapping["--ui-color-1"],
                  boxShadow: `0 6px 15px -4px ${roleMapping["--ui-color-1"]}88`,
                }}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current translate-x-0.5" />
                )}
              </button>
              <button
                className="p-2 transition-all hover:scale-105 active:scale-95"
                data-role="--ui-color-6"
                style={{ color: roleMapping["--ui-color-6"] }}
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabbar */}
        <div
          className="border-t py-3.5 flex justify-around items-center"
          data-role="--ui-color-4"
          style={{
            backgroundColor: roleMapping["--ui-color-4"], // Surface Background
            borderColor: roleMapping["--ui-color-5"],
          }}
        >
          <button
            className="p-1 opacity-60 hover:opacity-100 transition-opacity"
            data-role="--ui-color-7"
            style={{ color: roleMapping["--ui-color-7"] }}
          >
            <Music className="h-4.5 w-4.5" />
          </button>
          <button
            className="p-1 opacity-60 hover:opacity-100 transition-opacity"
            data-role="--ui-color-7"
            style={{ color: roleMapping["--ui-color-7"] }}
          >
            <Search className="h-4.5 w-4.5" />
          </button>
          <button
            className="p-1 transition-opacity"
            data-role="--ui-color-1"
            style={{ color: roleMapping["--ui-color-1"] }}
          >
            <Library className="h-4.5 w-4.5" />
          </button>
          <button
            className="p-1 opacity-60 hover:opacity-100 transition-opacity"
            data-role="--ui-color-7"
            style={{ color: roleMapping["--ui-color-7"] }}
          >
            <User className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Side Column Information */}
      <div className="flex-1 max-w-sm space-y-4">
        <div
          className="p-6 rounded-[2rem] border"
          data-role="--ui-color-4"
          style={{
            backgroundColor: roleMapping["--ui-color-4"],
            borderColor: roleMapping["--ui-color-5"],
          }}
        >
          <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-3">
            Mobile Shell Simulator
          </h4>
          <p className="text-[11px] leading-relaxed font-semibold text-gray-500 dark:text-gray-400">
            Allows checking color scaling in narrow viewports, testing gradient
            blends, and assessing button highlights for mobile ergonomics.
          </p>
        </div>
      </div>
    </div>
  );
}
