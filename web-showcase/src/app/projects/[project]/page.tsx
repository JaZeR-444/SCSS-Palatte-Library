import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import {
  getProjectName,
  getProjectPalettes,
  getProjectMeta,
  getManualPaletteIds,
  getProjectPresets,
  getProjects,
  listDesignSystems,
} from "@/utils/db";
import { Header } from "@/components/header";
import { LazyModals } from "@/components/lazy-modals";
import { ProjectWorkspace } from "@/components/project-workspace";

export const revalidate = 3600;

export function generateStaticParams() {
  return getProjects().map((p) => ({ project: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ project: string }>;
}): Promise<Metadata> {
  const { project } = await params;
  const name = getProjectName(project);
  return {
    title: name ? `${name} — Project` : "Project",
    description: name
      ? `Color palettes designed for ${name}.`
      : "Project palettes.",
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  const name = getProjectName(project);
  if (!name) notFound();

  const palettes = getProjectPalettes(project);
  const meta = getProjectMeta(project) ?? { type: "Product", description: "" };
  const manualIds = getManualPaletteIds(project);
  const presets = getProjectPresets(project);
  const designSystems = listDesignSystems(project);

  return (
    <main id="main-content" className="min-h-screen">
      <Header count={palettes.length} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-gray-400"
        >
          <ChevronLeft className="h-4 w-4" />
          All projects
        </Link>

        <div className="mb-8 mt-3 sm:mb-10">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base dark:text-gray-400">
            {palettes.length} palette{palettes.length === 1 ? "" : "s"} in this
            project. Click one to open the studio and map its colors onto UI
            roles, or save a role preset for the whole project.
          </p>
        </div>

        <ProjectWorkspace
          slug={project}
          name={name}
          type={meta.type}
          description={meta.description}
          palettes={palettes}
          manualIds={manualIds}
          presets={presets}
          designSystems={designSystems}
        />
      </div>

      <LazyModals />
    </main>
  );
}
