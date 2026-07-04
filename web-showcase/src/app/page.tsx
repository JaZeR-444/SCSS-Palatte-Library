import { getAllPalettes } from "@/utils/db";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { PaletteGrid } from "@/components/palette-grid";
import { FeaturedRails } from "@/components/featured-rails";
import { LazyModals } from "@/components/lazy-modals";
import { Suspense } from "react";

export const revalidate = 3600;

export default function Home() {
  const palettes = getAllPalettes();
  const baseUrl = "https://app-pallates.vercel.app";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Palattes",
        url: baseUrl,
        logo: `${baseUrl}/icon-512.png`,
        sameAs: ["https://github.com/JaZeR-444/SCSS-Palatte-Library"],
      },
      {
        "@type": "WebSite",
        name: "Palattes",
        url: baseUrl,
        description:
          "Browse, search, and export 3,000+ production-ready SCSS & CSS color palettes.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Palattes",
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: baseUrl,
        description:
          "Color palette explorer with SCSS exports, accessibility filtering, semantic role mapping, and brand system tooling.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Palette search and filtering",
          "SCSS and HEX export",
          "Accessibility-oriented palette filtering",
          "Brand system role mapping",
        ],
      },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header count={palettes.length} />
      <Hero />
      <div className="max-w-[3440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 3xl:px-20 4xl:px-28 5xl:px-32 py-8 sm:py-12 lg:py-16">
        <FeaturedRails palettes={palettes} />
      </div>
      <div
        id="palette-viewer"
        className="scroll-mt-24 max-w-[3440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 3xl:px-20 4xl:px-28 5xl:px-32 py-2 sm:py-4 lg:py-6"
      >
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900" />}>
          <PaletteGrid palettes={palettes} />
        </Suspense>
      </div>

      <LazyModals />

      <footer className="mt-10 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-[3440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 3xl:px-20 4xl:px-28 5xl:px-32 py-8 sm:py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-black text-gray-900 dark:text-white">
              Built for production color workflows.
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Explore palettes, validate contrast, and export tokens with a workflow focused on real UI systems.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href="https://github.com/JaZeR-444/SCSS-Palatte-Library"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-black text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-gray-300 dark:hover:border-indigo-800 dark:hover:text-indigo-400"
              >
                GitHub Repository
              </a>
              <a
                href="https://github.com/JaZeR-444/SCSS-Palatte-Library/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-black text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-gray-300 dark:hover:border-indigo-800 dark:hover:text-indigo-400"
              >
                Changelog
              </a>
              <a
                href="https://github.com/JaZeR-444/SCSS-Palatte-Library/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-black text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-gray-300 dark:hover:border-indigo-800 dark:hover:text-indigo-400"
              >
                License
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
