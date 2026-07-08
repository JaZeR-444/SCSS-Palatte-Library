"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Shuffle, Plus, LayoutGrid } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useStudio } from "./studio/studio-context";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";

interface HeaderProps {
  count: number;
}

export function Header({ count }: HeaderProps) {
  const { openStudio, openCreator } = useStudio();

  const handleRandom = async () => {
    try {
      const { getRandomPaletteAction } = await import("@/app/actions");
      const random = await getRandomPaletteAction();
      if (!random) {
        showToast("No palettes available right now.", "error");
        return;
      }
      playSound("open");
      openStudio(random);
    } catch (error) {
      console.error("Random palette failed:", error);
      showToast("Could not load a random palette.", "error");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 3xl:px-16 py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/"
            className="relative h-10 w-10 flex-shrink-0 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700"
            aria-label="Palattes home"
          >
            <Image
              src="/icon.svg"
              alt="Palattes icon"
              width={40}
              height={40}
              className="w-full h-full"
              priority
            />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Palattes
              </p>
              <span className="rounded-md border border-gray-200 dark:border-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                v2.0
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-gray-200 bg-white/50 px-3 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {count} palettes
            </span>
          </div>

          {/* Workspaces — projects + collections in one place */}
          <Link
            href="/workspaces"
            className="flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:text-gray-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 dark:hover:border-indigo-800 transition-colors text-[11px] font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
            title="Browse projects and collections"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Workspaces</span>
          </Link>

          {/* Random Palette */}
          <button
            onClick={handleRandom}
            className="flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:text-gray-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 dark:hover:border-indigo-800 transition-colors text-[11px] font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
            title="Open a random palette"
            aria-label="Open a random palette"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Random</span>
          </button>

          {/* Create Palette */}
          <button
            onClick={() => {
              playSound("open");
              openCreator();
            }}
            className="flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:text-gray-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 dark:hover:border-indigo-800 transition-colors text-[11px] font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
            title="Create a new palette"
            aria-label="Create a new palette"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Create Palette</span>
          </button>

          <ThemeToggle />

          <a
            href="https://github.com/JaZeR-444/SCSS-Palatte-Library"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            aria-label="View on GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
