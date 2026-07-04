"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Shuffle, Plus, Folder, Trash, ChevronDown, FolderPlus, X, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useStudio } from "./studio/studio-context";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";
import palettesData from "@/data/palettes.json";
import { Palette } from "@/types";
import { useState, useEffect, useRef } from "react";

interface HeaderProps {
  count: number;
}

export function Header({ count }: HeaderProps) {
  const { openStudio, openCreator, openBrandSystem, activeCollectionId, setActiveCollectionId } = useStudio();
  const palettes = palettesData as Palette[];
  
  const [collections, setCollections] = useState<{ id: string; name: string; palette_count: number }[]>([]);
  const [showCollections, setShowCollections] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const [collectionToDelete, setCollectionToDelete] = useState<{ id: string; name: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCollections = async () => {
    try {
      const { getCollectionsAction } = await import("@/app/actions");
      const data = await getCollectionsAction();
      setCollections(data);
    } catch (e) {
      console.error("Failed to load collections in header:", e);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [activeCollectionId]);

  useEffect(() => {
    if (showCollections) {
      fetchCollections();
    }
  }, [showCollections]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCollections(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleRandom = () => {
    const random = palettes[Math.floor(Math.random() * palettes.length)];
    playSound("open");
    openStudio(random);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollectionError("");
    if (!newCollectionName.trim()) return;
    try {
      const { createCollectionAction } = await import("@/app/actions");
      const res = await createCollectionAction(newCollectionName.trim());
      if (res.success) {
        setNewCollectionName("");
        fetchCollections();
        playSound("success");
        showToast("Collection created");
      } else {
        setCollectionError(res.error || "Could not create collection.");
      }
    } catch (error) {
      console.error("Create collection failed:", error);
      setCollectionError("Could not create collection.");
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;
    try {
      const { deleteCollectionAction } = await import("@/app/actions");
      const res = await deleteCollectionAction(collectionToDelete.id);
      if (!res.success) {
        showToast(res.error || "Could not delete collection.", "error");
        return;
      }
      if (activeCollectionId === collectionToDelete.id) {
        setActiveCollectionId(null);
      }
      setCollectionToDelete(null);
      fetchCollections();
      playSound("click");
      showToast("Collection deleted");
    } catch (error) {
      console.error("Delete collection failed:", error);
      showToast("Could not delete collection.", "error");
    }
  };

  const handleSelectCollection = (id: string) => {
    if (activeCollectionId === id) {
      setActiveCollectionId(null);
    } else {
      setActiveCollectionId(id);
    }
    setShowCollections(false);
    playSound("click");
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
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Palattes
              </h1>
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

          {/* Collections Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowCollections(!showCollections);
                playSound("click");
              }}
              className={`flex items-center gap-2 h-8 px-3 rounded-lg border transition-all text-[11px] font-bold cursor-pointer ${
                activeCollectionId
                  ? "bg-indigo-500 text-white border-indigo-500"
                  : "border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              }`}
              aria-label={activeCollectionId ? "Open selected collection menu" : "Open collections menu"}
            >
              <Folder className="h-3.5 w-3.5" />
              <span>
                {activeCollectionId
                  ? activeCollectionId.split("-").slice(0, -2).join(" ").replace(/\b\w/g, c => c.toUpperCase()) || "Selected Board"
                  : "Collections"}
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showCollections ? "rotate-180" : ""}`} />
            </button>

            {showCollections && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-2xl z-50">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    My Collections
                  </h3>
                  {activeCollectionId && (
                    <button
                      onClick={() => handleSelectCollection(activeCollectionId)}
                      className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                {/* Collections List */}
                <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1 mb-3">
                  {collections.length === 0 ? (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-4">
                      No custom boards created yet.
                    </p>
                  ) : (
                    collections.map((col) => (
                      <div
                        key={col.id}
                        onClick={() => handleSelectCollection(col.id)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          activeCollectionId === col.id
                            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Folder className={`h-3.5 w-3.5 flex-shrink-0 ${activeCollectionId === col.id ? "text-indigo-500" : "text-gray-400"}`} />
                          <span className="truncate pr-1">{col.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-400 font-black">
                            {col.palette_count}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCollectionToDelete({ id: col.id, name: col.name });
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Delete collection"
                          aria-label={`Delete ${col.name} collection`}
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Create Collection Form */}
                <form onSubmit={handleCreateCollection} className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <input
                    type="text"
                    placeholder="New Collection Name..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors flex items-center justify-center cursor-pointer"
                    title="Create Collection"
                    aria-label="Create collection"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                  </button>
                </form>
                {collectionError && (
                  <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400">
                    {collectionError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Random Palette */}
          <button
            onClick={handleRandom}
            className="flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:text-gray-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 dark:hover:border-indigo-800 transition-colors text-[11px] font-bold cursor-pointer"
            title="Open a random palette"
            aria-label="Open a random palette"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Random</span>
          </button>

          {/* Brand System Builder */}
          <button
            onClick={() => {
              playSound("open");
              openBrandSystem();
            }}
            className="flex items-center gap-2 h-8 px-3 rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors text-[11px] font-bold cursor-pointer"
            title="Build a brand system from a palette"
            aria-label="Build a brand system from a palette"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Brand System</span>
          </button>

          {/* Create Palette */}
          <button
            onClick={() => {
              playSound("open");
              openCreator();
            }}
            className="flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:text-gray-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 dark:hover:border-indigo-800 transition-colors text-[11px] font-bold cursor-pointer"
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
      {collectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-collection-title">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <h2 id="delete-collection-title" className="text-base font-black text-gray-900 dark:text-white">
              Delete collection?
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This removes "{collectionToDelete.name}" and all saved mappings inside it.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCollectionToDelete(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:border-slate-800 dark:text-gray-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCollection}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
