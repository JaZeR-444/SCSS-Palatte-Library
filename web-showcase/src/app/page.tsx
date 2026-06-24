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
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 3xl:px-16 py-12">
        <PaletteGrid palettes={palettes} />
      </div>

      {/* Global Studio Modal */}
      <StudioModal />

      {/* Global Palette Creator/Editor Modal */}
      <PaletteCreator />
    </main>
  );
}
