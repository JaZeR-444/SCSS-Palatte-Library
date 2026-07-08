import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import { listWorkspaces, getAllPalettes } from "@/utils/db";
import { Header } from "@/components/header";
import { LazyModals } from "@/components/lazy-modals";
import { WorkspacesBrowser } from "@/components/workspaces-browser";

// Collections are created at runtime, so always render the current list.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspaces",
  description:
    "Projects and collections in one place. Curate palettes into a collection, promote it to a project, and build a brand system from it.",
};

export default function WorkspacesPage() {
  const workspaces = listWorkspaces();
  const count = getAllPalettes().length;

  return (
    <main id="main-content" className="min-h-screen">
      <Header count={count} />

      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
            <LayoutGrid className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">
              Workspaces
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Projects &amp; collections
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base dark:text-gray-400">
            Curate palettes into a collection, promote it to a project when
            it&rsquo;s real, and build a brand system from either. Open any
            workspace to manage its palettes, role presets, and design systems.
          </p>
        </div>

        <WorkspacesBrowser workspaces={workspaces} />
      </div>

      <LazyModals />
    </main>
  );
}
