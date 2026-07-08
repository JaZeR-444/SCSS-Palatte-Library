"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FolderKanban,
  Folder,
  FolderPlus,
  Sparkles,
  Trash2,
  Rocket,
  X,
} from "lucide-react";
import { useStudio } from "@/components/studio/studio-context";
import { playSound } from "@/utils/audio";
import { showToast } from "@/utils/toast";

export interface WorkspaceCardData {
  name: string;
  slug: string;
  kind: "project" | "collection";
  type: string;
  description: string;
  count: number;
  preview: string[];
}

type KindFilter = "all" | "project" | "collection";

export function WorkspacesBrowser({
  workspaces: initial,
}: {
  workspaces: WorkspaceCardData[];
}) {
  const router = useRouter();
  const { openBrandSystem } = useStudio();

  const [workspaces, setWorkspaces] = useState<WorkspaceCardData[]>(initial);
  const [filter, setFilter] = useState<KindFilter>("all");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<WorkspaceCardData | null>(
    null,
  );

  const counts = useMemo(
    () => ({
      all: workspaces.length,
      project: workspaces.filter((w) => w.kind === "project").length,
      collection: workspaces.filter((w) => w.kind === "collection").length,
    }),
    [workspaces],
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? workspaces
        : workspaces.filter((w) => w.kind === filter),
    [workspaces, filter],
  );

  const refresh = async () => {
    const { listWorkspacesAction } = await import("@/app/actions");
    setWorkspaces((await listWorkspacesAction()) as WorkspaceCardData[]);
  };

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newName.trim()) return;
    const { createCollectionAction } = await import("@/app/actions");
    const res = await createCollectionAction(newName.trim());
    if (res.success) {
      setNewName("");
      await refresh();
      setFilter("collection");
      playSound("success");
      showToast("Collection created");
    } else {
      setError(res.error || "Could not create collection.");
    }
  };

  const promote = async (w: WorkspaceCardData) => {
    const { promoteToProjectAction } = await import("@/app/actions");
    const res = await promoteToProjectAction(w.slug, "Product", w.description);
    if (res.success) {
      playSound("success");
      showToast(`Promoted "${w.name}" to a project`);
      router.push(`/workspaces/${w.slug}`);
    } else {
      showToast(res.error || "Could not promote.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { deleteCollectionAction } = await import("@/app/actions");
    const res = await deleteCollectionAction(pendingDelete.slug);
    if (res.success) {
      setWorkspaces((prev) =>
        prev.filter((w) => w.slug !== pendingDelete.slug),
      );
      playSound("click");
      showToast("Collection deleted");
    } else {
      showToast(res.error || "Could not delete.", "error");
    }
    setPendingDelete(null);
  };

  const build = (w: WorkspaceCardData) => {
    playSound("open");
    openBrandSystem(undefined, w.slug);
  };

  const tabs: { id: KindFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "project", label: "Projects" },
    { id: "collection", label: "Collections" },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar: filter tabs + create + build */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-black transition-colors ${
                filter === t.id
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400"
              }`}
            >
              {t.label}
              <span className="ml-1.5 rounded bg-black/10 px-1 text-[10px] dark:bg-white/10">
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={createCollection}
            className="flex items-center gap-1.5"
          >
            <label htmlFor="new-workspace-collection" className="sr-only">
              New collection name
            </label>
            <input
              id="new-workspace-collection"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection…"
              className="w-44 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
            />
            <button
              type="submit"
              title="Create collection"
              aria-label="Create collection"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-black text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:text-gray-300"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              New
            </button>
          </form>
          <button
            onClick={() => {
              playSound("open");
              openBrandSystem();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-black text-white transition-colors hover:bg-indigo-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Build Brand System
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === "collection"
              ? "No collections yet. Create one above, then add palettes from any palette's studio."
              : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filtered.map((w) => {
            const isCollection = w.kind === "collection";
            return (
              <div
                key={w.slug}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <Link
                  href={`/workspaces/${w.slug}`}
                  className="flex flex-col focus-visible:outline-2 focus-visible:outline-indigo-500"
                >
                  <div className="flex h-24 overflow-hidden sm:h-28">
                    {w.preview.length > 0 ? (
                      w.preview.map((hex, i) => (
                        <div
                          key={i}
                          className="h-full flex-1 transition-opacity group-hover:opacity-90"
                          style={{ backgroundColor: hex }}
                        />
                      ))
                    ) : (
                      <div className="h-full flex-1 bg-gray-100 dark:bg-slate-800" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 p-4 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-black text-gray-900 transition-colors group-hover:text-indigo-500 dark:text-white">
                          {w.name}
                        </h2>
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                          {w.count} palette{w.count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex flex-shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          isCollection
                            ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400"
                            : "border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400"
                        }`}
                      >
                        {isCollection ? (
                          <Folder className="h-3 w-3" />
                        ) : (
                          <FolderKanban className="h-3 w-3" />
                        )}
                        {isCollection ? "Collection" : "Project"}
                      </span>
                    </div>
                    {w.description && (
                      <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                        {w.description}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Action row */}
                <div className="mt-auto flex items-center gap-1.5 px-4 pb-4 pt-1">
                  <button
                    onClick={() => build(w)}
                    title="Build a brand system for this workspace"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:text-gray-300"
                  >
                    <Sparkles className="h-3 w-3" />
                    Brand System
                  </button>
                  {isCollection && (
                    <>
                      <button
                        onClick={() => promote(w)}
                        title="Promote this collection to a project"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:text-gray-300"
                      >
                        <Rocket className="h-3 w-3" />
                        Promote
                      </button>
                      <button
                        onClick={() => setPendingDelete(w)}
                        title="Delete collection"
                        aria-label={`Delete ${w.name}`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <Link
                    href={`/workspaces/${w.slug}`}
                    aria-label={`Open ${w.name}`}
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 shadow-sm transition-colors hover:bg-indigo-500 hover:text-white dark:bg-slate-800"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
          onClick={() => setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete collection"
            className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Delete “{pendingDelete.name}”?
              </h3>
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              This removes the collection and its palette list. The palettes
              themselves are not deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-slate-800 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
