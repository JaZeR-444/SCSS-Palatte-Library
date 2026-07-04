"use client";

import dynamic from "next/dynamic";

const StudioModal = dynamic(
  () => import("@/components/studio/studio-modal").then((mod) => mod.StudioModal),
  { ssr: false },
);
const PaletteCreator = dynamic(
  () => import("@/components/palette-creator").then((mod) => mod.PaletteCreator),
  { ssr: false },
);
const BrandSystemModal = dynamic(
  () =>
    import("@/components/brand-system/brand-system-modal").then(
      (mod) => mod.BrandSystemModal,
    ),
  { ssr: false },
);

export function LazyModals() {
  return (
    <>
      <StudioModal />
      <PaletteCreator />
      <BrandSystemModal />
    </>
  );
}
