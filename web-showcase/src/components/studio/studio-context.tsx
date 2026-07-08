"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Palette } from "@/types";
import { ColorMode } from "@/types/brand-system";
import { DesignSystem } from "@/types/design-system";
import { UISelection, StudioState, ROLE_META } from "@/types/studio";
import {
  buildRoleMapping,
  indexRoleMapping,
  kindToSurface,
} from "@/utils/role-mapping";
import { designSystemFromRoleMapping } from "@/utils/design-system";
import {
  bestContrastColor,
  getContrastRatio,
  getLuminanceValue,
  wcagGrade,
} from "@/utils/contrast-utils";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface StudioContextType extends StudioState {
  openStudio: (palette: Palette) => void;
  closeStudio: () => void;
  setScenario: (scenario: UISelection) => void;
  updateRole: (role: string, hex: string) => void;
  shuffleRoles: () => void;
  swapRoles: (idx1: number, idx2: number) => void;
  resetRoles: () => void;
  autoFixRoles: () => void;
  hasRoleEdits: boolean;
  // Cross-highlight between the mockup and the role editor.
  hoveredRole: string | null;
  setHoveredRole: (role: string | null) => void;
  // Brief flash on the last individually-changed role's mockup regions.
  pulse: { role: string; nonce: number } | null;
  previewDevice: PreviewDevice;
  setPreviewDevice: (d: PreviewDevice) => void;
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
  /** When set, the modal loads this saved design system on open. */
  brandSystemLoadId: string | null;
  openBrandSystemWithSystem: (id: string) => void;
  clearBrandSystemLoadId: () => void;
  /**
   * The unified design system derived from the current palette + role edits.
   * `roleMapping` stays the editable source of truth; this is the canonical
   * object the Brand System + exporters share. Null when no palette is open.
   */
  designSystem: DesignSystem | null;
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
  const [brandSystemLoadId, setBrandSystemLoadId] = useState<string | null>(
    null,
  );

  const [hasRoleEdits, setHasRoleEdits] = useState(false);
  // Per-palette role overrides survive prev/next navigation within a session.
  const overridesRef = useRef<Record<string, Record<string, string>>>({});

  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [pulse, setPulse] = useState<{ role: string; nonce: number } | null>(
    null,
  );
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");

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
    setBrandSystemLoadId(null);
    setIsBrandSystemOpen(true);
  }, []);

  // Open the modal and load a specific saved design system (e.g. from a project).
  const openBrandSystemWithSystem = useCallback((id: string) => {
    setBrandSystemPalette(null);
    setBrandSystemLoadId(id);
    setIsBrandSystemOpen(true);
  }, []);

  const clearBrandSystemLoadId = useCallback(() => {
    setBrandSystemLoadId(null);
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
    // Flash this role's regions in the mockup so the change is visible.
    setPulse((p) => ({ role, nonce: (p?.nonce ?? 0) + 1 }));
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

  // Auto-repair every failing role to the best available in-palette color.
  const autoFixRoles = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedPalette) return prev;
      const mapping = { ...prev.roleMapping };
      const colors = prev.selectedPalette.colors.map((c) => c.hex);
      ROLE_META.forEach((meta, i) => {
        const cur = mapping[`--ui-color-${i + 1}`];
        const cmp = mapping[`--ui-color-${meta.compareIndex + 1}`];
        if (!cur || !cmp) return;
        const ratio = getContrastRatio(cur, cmp);
        if (wcagGrade(ratio, kindToSurface(meta.kind)).pass) return;
        const best = bestContrastColor(colors, cmp, { min: 4.5, exclude: cur });
        if (
          best &&
          best.ratio > ratio &&
          best.hex.toLowerCase() !== cur.slice(0, 7).toLowerCase()
        ) {
          mapping[`--ui-color-${i + 1}`] = best.hex;
        }
      });
      rememberEdits(prev.selectedPalette.id, mapping);
      return { ...prev, roleMapping: mapping };
    });
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

  // One canonical DesignSystem derived from the live palette + role edits.
  // Mode mirrors buildRoleMapping's light/dark heuristic (median luminance).
  const designSystem = useMemo<DesignSystem | null>(() => {
    const p = state.selectedPalette;
    if (!p) return null;
    const lums = p.colors.map((c) => getLuminanceValue(c.hex));
    const sorted = [...lums].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 1;
    const mode: ColorMode = median < 0.35 ? "dark" : "light";
    return designSystemFromRoleMapping(p, state.roleMapping, mode);
  }, [state.selectedPalette, state.roleMapping]);

  return (
    <StudioContext.Provider
      value={{
        ...state,
        designSystem,
        openStudio,
        closeStudio,
        setScenario,
        updateRole,
        shuffleRoles,
        swapRoles,
        resetRoles,
        autoFixRoles,
        hasRoleEdits,
        hoveredRole,
        setHoveredRole,
        pulse,
        previewDevice,
        setPreviewDevice,
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
        brandSystemLoadId,
        openBrandSystemWithSystem,
        clearBrandSystemLoadId,
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
