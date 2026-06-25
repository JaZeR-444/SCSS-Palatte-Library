import { getAllPalettes } from "@/utils/db";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { PaletteGrid } from "@/components/palette-grid";
import { StudioModal } from "@/components/studio/studio-modal";
import { PaletteCreator } from "@/components/palette-creator";

export const dynamic = "force-dynamic";

export default function Home() {
  const palettes = getAllPalettes();

  return (
    <main className="min-h-screen">
      <Header count={palettes.length} />
      <Hero />
      <div className="max-w-[3440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 3xl:px-20 4xl:px-28 5xl:px-32 py-8 sm:py-12 lg:py-16">
        <PaletteGrid palettes={palettes} />
      </div>

      {/* Global Studio Modal */}
      <StudioModal />

      {/* Global Palette Creator/Editor Modal */}
      <PaletteCreator />
    </main>
  );
}
