import { getAllPalettes } from "@/utils/db";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { PaletteGrid } from "@/components/palette-grid";
import { FeaturedRails } from "@/components/featured-rails";
import { StudioModal } from "@/components/studio/studio-modal";
import { PaletteCreator } from "@/components/palette-creator";
import { BrandSystemModal } from "@/components/brand-system/brand-system-modal";

export const dynamic = "force-dynamic";

export default function Home() {
  const palettes = getAllPalettes();

  return (
    <main className="min-h-screen">
      <Header count={palettes.length} />
      <Hero />
      <div className="max-w-[3440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 3xl:px-20 4xl:px-28 5xl:px-32 py-8 sm:py-12 lg:py-16">
        <FeaturedRails palettes={palettes} />
      </div>
      <div
        id="palette-viewer"
        className="scroll-mt-24 max-w-[3440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 3xl:px-20 4xl:px-28 5xl:px-32 py-2 sm:py-4 lg:py-6"
      >
        <PaletteGrid palettes={palettes} />
      </div>

      {/* Global Studio Modal */}
      <StudioModal />

      {/* Global Palette Creator/Editor Modal */}
      <PaletteCreator />

      {/* Global Brand System Builder Modal */}
      <BrandSystemModal />
    </main>
  );
}
