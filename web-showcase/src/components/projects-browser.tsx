"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface ProjectCard {
  name: string;
  slug: string;
  type: string;
  description: string;
  count: number;
  preview: string[];
}

export function ProjectsBrowser({ projects }: { projects: ProjectCard[] }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = useMemo(() => {
    const set = new Set(projects.map((p) => p.type).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [projects]);

  const filtered = useMemo(
    () =>
      typeFilter === "all"
        ? projects
        : projects.filter((p) => p.type === typeFilter),
    [projects, typeFilter],
  );

  return (
    <div className="space-y-6">
      {types.length > 2 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-black transition-colors ${
                typeFilter === t
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400"
              }`}
            >
              {t === "all" ? "All types" : t}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {filtered.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-24 overflow-hidden sm:h-28">
              {project.preview.length > 0 ? (
                project.preview.map((hex, i) => (
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

            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black text-gray-900 transition-colors group-hover:text-indigo-500 dark:text-white">
                    {project.name}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {project.count} palette{project.count === 1 ? "" : "s"}
                  </p>
                </div>
                {project.type && (
                  <span className="flex-shrink-0 rounded-md border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400">
                    {project.type}
                  </span>
                )}
              </div>

              {project.description && (
                <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {project.description}
                </p>
              )}

              <div className="mt-auto flex justify-end pt-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 shadow-sm transition-colors group-hover:bg-indigo-500 group-hover:text-white dark:bg-slate-800">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
