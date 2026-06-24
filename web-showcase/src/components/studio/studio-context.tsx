"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Palette } from "@/types";
import { UISelection, StudioState } from "@/types/studio";

interface StudioContextType extends StudioState {
  openStudio: (palette: Palette) => void;
  closeStudio: () => void;
  setScenario: (scenario: UISelection) => void;
  updateRole: (role: string, hex: string) => void;
  shuffleRoles: () => void;
  swapRoles: (idx1: number, idx2: number) => void;
  setZoom: (z: number) => void;
  toggleHeatmap: () => void;
  setVisionFilter: (f: string) => void;
  isCreatorOpen: boolean;
  creatorPaletteToEdit: Palette | null;
  openCreator: (palette?: Palette) => void;
  closeCreator: () => void;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioState>({
    isOpen: false,
    selectedPalette: null,
    activeScenario: "dashboard",
    roleMapping: {},
    recents: [],
    zoom: 100,
    heatmapActive: false,
    visionFilter: "",
  });

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorPaletteToEdit, setCreatorPaletteToEdit] = useState<Palette | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const openCreator = useCallback((palette?: Palette) => {
    setCreatorPaletteToEdit(palette || null);
    setIsCreatorOpen(true);
  }, []);

  const closeCreator = useCallback(() => {
    setIsCreatorOpen(false);
    setCreatorPaletteToEdit(null);
  }, []);

  // Load recents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("paletteShowcase.recentIds");
      if (stored) {
        setState((prev) => ({ ...prev, recents: JSON.parse(stored) }));
      }
    } catch {}
  }, []);

  // Persist recents whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "paletteShowcase.recentIds",
        JSON.stringify(state.recents)
      );
    } catch {}
  }, [state.recents]);

  const openStudio = useCallback((palette: Palette) => {
    const mapping: Record<string, string> = {};
    for (let i = 1; i <= 10; i++) {
      const color = palette.colors[(i - 1) % palette.colors.length];
      mapping[`--ui-color-${i}`] = color.hex;
    }
    setState((prev) => ({
      ...prev,
      isOpen: true,
      selectedPalette: palette,
      activeScenario: "dashboard",
      roleMapping: mapping,
      zoom: 100,
      heatmapActive: false,
      recents: [
        palette.id,
        ...prev.recents.filter((id) => id !== palette.id),
      ].slice(0, 24),
    }));

  }, []);

  const closeStudio = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const setScenario = useCallback((scenario: UISelection) => {
    setState((prev) => ({ ...prev, activeScenario: scenario }));
  }, []);

  const updateRole = useCallback((role: string, hex: string) => {
    setState((prev) => ({
      ...prev,
      roleMapping: { ...prev.roleMapping, [role]: hex },
    }));
  }, []);

  const shuffleRoles = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedPalette) return prev;
      const paletteColors = prev.selectedPalette.colors.map((c) => c.hex);
      const shuffled = [...paletteColors].sort(() => Math.random() - 0.5);
      const newMapping: Record<string, string> = {};
      for (let i = 1; i <= 10; i++) {
        newMapping[`--ui-color-${i}`] = shuffled[(i - 1) % shuffled.length];
      }
      return { ...prev, roleMapping: newMapping };
    });
  }, []);

  const swapRoles = useCallback((idx1: number, idx2: number) => {
    setState((prev) => {
      const m = { ...prev.roleMapping };
      const a = m[`--ui-color-${idx1}`];
      const b = m[`--ui-color-${idx2}`];
      m[`--ui-color-${idx1}`] = b;
      m[`--ui-color-${idx2}`] = a;
      return { ...prev, roleMapping: m };
    });
  }, []);

  const setZoom = useCallback((z: number) => {
    setState((prev) => ({ ...prev, zoom: Math.max(50, Math.min(150, z)) }));
  }, []);

  const toggleHeatmap = useCallback(() => {
    setState((prev) => ({ ...prev, heatmapActive: !prev.heatmapActive }));
  }, []);

  const setVisionFilter = useCallback((f: string) => {
    setState((prev) => ({ ...prev, visionFilter: f }));
  }, []);

  return (
    <StudioContext.Provider
      value={{
        ...state,
        openStudio,
        closeStudio,
        setScenario,
        updateRole,
        shuffleRoles,
        swapRoles,
        setZoom,
        toggleHeatmap,
        setVisionFilter,
        isCreatorOpen,
        creatorPaletteToEdit,
        openCreator,
        closeCreator,
        activeCollectionId,
        setActiveCollectionId,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
}
