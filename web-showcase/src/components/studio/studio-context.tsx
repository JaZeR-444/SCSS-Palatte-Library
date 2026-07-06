"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Palette } from "@/types";
import { UISelection, StudioState } from "@/types/studio";
import { buildRoleMapping, indexRoleMapping } from "@/utils/role-mapping";

interface StudioContextType extends StudioState {
  openStudio: (palette: Palette) => void;
  closeStudio: () => void;
  setScenario: (scenario: UISelection) => void;
  updateRole: (role: string, hex: string) => void;
  shuffleRoles: () => void;
  swapRoles: (idx1: number, idx2: number) => void;
  resetRoles: () => void;
  hasRoleEdits: boolean;
  setZoom: (z: number) => void;
  toggleHeatmap: () => void;
  setVisionFilter: (f: string) => void;
  isCreatorOpen: boolean;
  creatorPaletteToEdit: Palette | null;
  openCreator: (palette?: Palette) => void;
  closeCreator: () => void;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
  isBrandSystemOpen: boolean;
  brandSystemPalette: Palette | null;
  openBrandSystem: (palette?: Palette) => void;
  closeBrandSystem: () => void;
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
  const [creatorPaletteToEdit, setCreatorPaletteToEdit] =
    useState<Palette | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  );

  const [isBrandSystemOpen, setIsBrandSystemOpen] = useState(false);
  const [brandSystemPalette, setBrandSystemPalette] = useState<Palette | null>(
    null,
  );

  const [hasRoleEdits, setHasRoleEdits] = useState(false);
  // Per-palette role overrides survive prev/next navigation within a session.
  const overridesRef = useRef<Record<string, Record<string, string>>>({});

  const openCreator = useCallback((palette?: Palette) => {
    setCreatorPaletteToEdit(palette || null);
    setIsCreatorOpen(true);
  }, []);

  const closeCreator = useCallback(() => {
    setIsCreatorOpen(false);
    setCreatorPaletteToEdit(null);
  }, []);

  const openBrandSystem = useCallback((palette?: Palette) => {
    setBrandSystemPalette(palette || null);
    setIsBrandSystemOpen(true);
  }, []);

  const closeBrandSystem = useCallback(() => {
    setIsBrandSystemOpen(false);
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
        JSON.stringify(state.recents),
      );
    } catch {}
  }, [state.recents]);

  const openStudio = useCallback((palette: Palette) => {
    const saved = overridesRef.current[palette.id];
    const mapping = saved ?? buildRoleMapping(palette.colors.map((c) => c.hex));
    setHasRoleEdits(Boolean(saved));
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

  // Remember edits per palette so navigating away and back restores them.
  const rememberEdits = (
    paletteId: string | undefined,
    mapping: Record<string, string>,
  ) => {
    if (!paletteId) return;
    overridesRef.current[paletteId] = mapping;
    setHasRoleEdits(true);
  };

  const updateRole = useCallback((role: string, hex: string) => {
    setState((prev) => {
      const roleMapping = { ...prev.roleMapping, [role]: hex };
      rememberEdits(prev.selectedPalette?.id, roleMapping);
      return { ...prev, roleMapping };
    });
  }, []);

  const shuffleRoles = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedPalette) return prev;
      const paletteColors = prev.selectedPalette.colors.map((c) => c.hex);
      const shuffled = [...paletteColors].sort(() => Math.random() - 0.5);
      const roleMapping = indexRoleMapping(shuffled);
      rememberEdits(prev.selectedPalette.id, roleMapping);
      return { ...prev, roleMapping };
    });
  }, []);

  // Restore the smart, accessibility-aware default assignment.
  const resetRoles = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedPalette) return prev;
      const roleMapping = buildRoleMapping(
        prev.selectedPalette.colors.map((c) => c.hex),
      );
      delete overridesRef.current[prev.selectedPalette.id];
      return { ...prev, roleMapping };
    });
    setHasRoleEdits(false);
  }, []);

  const swapRoles = useCallback((idx1: number, idx2: number) => {
    setState((prev) => {
      const m = { ...prev.roleMapping };
      const a = m[`--ui-color-${idx1}`];
      const b = m[`--ui-color-${idx2}`];
      m[`--ui-color-${idx1}`] = b;
      m[`--ui-color-${idx2}`] = a;
      rememberEdits(prev.selectedPalette?.id, m);
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
        resetRoles,
        hasRoleEdits,
        setZoom,
        toggleHeatmap,
        setVisionFilter,
        isCreatorOpen,
        creatorPaletteToEdit,
        openCreator,
        closeCreator,
        activeCollectionId,
        setActiveCollectionId,
        isBrandSystemOpen,
        brandSystemPalette,
        openBrandSystem,
        closeBrandSystem,
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
