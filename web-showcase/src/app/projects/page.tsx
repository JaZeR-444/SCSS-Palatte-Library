import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { getProjects } from "@/utils/db";
import { Header } from "@/components/header";
import { LazyModals } from "@/components/lazy-modals";
import { ProjectsBrowser } from "@/components/projects-browser";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Color palettes grouped by the product they were designed for. Open a project to see its palettes together and map one onto your app's UI roles.",
};

export default function ProjectsPage() {
  const projects = getProjects();
  const total = projects.reduce((sum, p) => sum + p.count, 0);

  return (
    <main id="main-content" className="min-h-screen">
      <Header count={total} />

      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
            <FolderKanban className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">
              Projects
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Palettes by product
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base dark:text-gray-400">
            Color sets designed for the things you&rsquo;re building. Open a
            project to see its palettes together and map one onto your
            app&rsquo;s UI roles.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-slate-800">
              <FolderKanban className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-black text-gray-900 dark:text-white">
              No projects yet
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Palettes tagged with a product show up here as a project.
            </p>
          </div>
        ) : (
          <ProjectsBrowser projects={projects} />
        )}
      </div>

      <LazyModals />
    </main>
  );
}
