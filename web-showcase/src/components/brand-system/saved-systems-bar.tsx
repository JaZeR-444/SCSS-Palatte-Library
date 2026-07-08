"use client";

import { useEffect, useRef, useState } from "react";
import { SavedDesignSystem } from "@/types/design-system";
import {
  Save,
  FolderOpen,
  Copy,
  Trash2,
  ChevronDown,
  Check,
  Link2,
} from "lucide-react";

/**
 * Save / Load / Update / Rename / Duplicate bar for reusable design systems.
 * Rename is folded into the name field + Update. Load is always available;
 * Save/Update appear once there's a system to persist.
 */
export function SavedSystemsBar({
  saved,
  currentSavedId,
  name,
  onNameChange,
  canSave,
  onSave,
  onDuplicate,
  onLoad,
  onDelete,
  onOpenList,
  workspaces,
  currentWorkspaceSlug,
  onAssignWorkspace,
}: {
  saved: SavedDesignSystem[];
  currentSavedId: string | null;
  name: string;
  onNameChange: (n: string) => void;
  canSave: boolean;
  onSave: (asNew: boolean) => void;
  onDuplicate: () => void;
  onLoad: (s: SavedDesignSystem) => void;
  onDelete: (id: string) => void;
  onOpenList: () => void;
  workspaces: { slug: string; name: string; kind: "collection" | "project" }[];
  currentWorkspaceSlug: string | null;
  onAssignWorkspace: (slug: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const projectOpts = workspaces.filter((w) => w.kind === "project");
  const collectionOpts = workspaces.filter((w) => w.kind === "collection");

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const isSaved = !!currentSavedId;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* Load dropdown */}
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) onOpenList();
          }}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:border-indigo-300 transition-colors cursor-pointer"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Load
          {saved.length > 0 && (
            <span className="rounded-md bg-gray-100 dark:bg-slate-700 px-1.5 text-[9px] font-black">
              {saved.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3" />
        </button>
        {open && (
          <div className="absolute left-0 z-30 mt-2 max-h-72 w-72 overflow-y-auto no-scrollbar rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl">
            {saved.length === 0 ? (
              <p className="px-2 py-4 text-center text-[11px] italic text-gray-400">
                No saved systems yet.
              </p>
            ) : (
              saved.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
                    s.id === currentSavedId
                      ? "bg-indigo-50/60 dark:bg-indigo-950/30"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onLoad(s);
                      setOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                  >
                    <span className="flex-shrink-0">
                      {s.id === currentSavedId ? (
                        <Check className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <FolderOpen className="h-3.5 w-3.5 text-gray-300" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold text-gray-900 dark:text-white">
                        {s.name}
                      </span>
                      <span className="block truncate text-[9px] font-medium text-gray-400">
                        {s.mode} ·{" "}
                        {s.projectSlug ? s.projectSlug : "unassigned"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s.id)}
                    title="Delete saved system"
                    className="flex-shrink-0 rounded-lg p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Save / Update (only when there is a system) */}
      {canSave && (
        <>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="System name"
            className="w-40 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-[12px] text-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => onSave(false)}
            disabled={!name.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaved ? "Update" : "Save"}
          </button>
          {isSaved && (
            <>
              <button
                type="button"
                onClick={() => onSave(true)}
                title="Save as a new system"
                className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-[11px] font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors cursor-pointer"
              >
                Save as new
              </button>
              <button
                type="button"
                onClick={onDuplicate}
                title="Duplicate this saved system"
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-[11px] font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </button>
            </>
          )}
          {/* Attach the system to any workspace (project or collection). */}
          <label className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-2 text-gray-500 dark:text-gray-300">
            <Link2 className="h-3.5 w-3.5 text-gray-400" />
            <span className="sr-only">Attach to workspace</span>
            <select
              value={currentWorkspaceSlug ?? ""}
              onChange={(e) => onAssignWorkspace(e.target.value || null)}
              title="Attach this system to a project or collection"
              className="max-w-[9rem] bg-transparent text-[11px] font-bold text-gray-600 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="">Unassigned</option>
              {projectOpts.length > 0 && (
                <optgroup label="Projects">
                  {projectOpts.map((w) => (
                    <option key={w.slug} value={w.slug}>
                      {w.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {collectionOpts.length > 0 && (
                <optgroup label="Collections">
                  {collectionOpts.map((w) => (
                    <option key={w.slug} value={w.slug}>
                      {w.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
