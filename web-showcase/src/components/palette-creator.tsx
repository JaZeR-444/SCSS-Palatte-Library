"use client";

import { useStudio } from "./studio/studio-context";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, Sparkles, RefreshCw } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { showToast } from "@/utils/toast";
import { playSound } from "@/utils/audio";
import { savePaletteAction } from "@/app/actions";
import { Palette, Color } from "@/types";

const CATEGORIES = [
  "Retro & Nostalgia",
  "Cyberpunk & Sci-Fi",
  "Neon & Dark",
  "Clean & Modern",
  "Earth & Nature",
  "Pastel & Soft",
  "Enterprise & Management",
  "Warm & Golden",
  "Atmospheric",
  "Natural",
  "Abstract",
  "Cosmic",
  "Minimalist"
];

const STANDARD_COUNTS = Array.from({ length: 33 }, (_, i) => i + 3);

// Generate procedural cohesive colors (analogous or monochromatic)
function generateCohesiveColors(count: number): Color[] {
  const baseHue = Math.random() * 360;
  const baseSat = 65 + Math.random() * 25; // 65-90%
  const colors: Color[] = [];

  for (let i = 0; i < count; i++) {
    const progress = i / Math.max(1, count - 1);
    // Slight shift in hue to create harmony
    const hue = (baseHue + i * (30 / count)) % 360;
    // Vary lightness from dark to light
    const lightness = 15 + progress * 70; // 15% to 85%
    
    // Convert HSL to HEX
    const hex = hslToHex(hue, baseSat, lightness);
    colors.push({
      name: `Color ${i + 1}`,
      hex: hex
    });
  }
  return colors;
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function PaletteCreator() {
  const { isCreatorOpen, creatorPaletteToEdit, closeCreator } = useStudio();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [author, setAuthor] = useState("JaZeR-444");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [count, setCount] = useState(5);
  const [colors, setColors] = useState<Color[]>([]);
  const [moodTags, setMoodTags] = useState("");
  const [aestheticTags, setAestheticTags] = useState("");

  // Populate data if editing
  useEffect(() => {
    if (creatorPaletteToEdit) {
      setName(creatorPaletteToEdit.name);
      setCategory(creatorPaletteToEdit.category ?? CATEGORIES[0]);
      setAuthor(creatorPaletteToEdit.author ?? "JaZeR-444");
      setVersion(creatorPaletteToEdit.version ?? "1.0.0");
      setDescription(creatorPaletteToEdit.description ?? "");
      setCount(creatorPaletteToEdit.count);
      setColors(creatorPaletteToEdit.colors.map(c => ({ ...c })));
      setMoodTags((creatorPaletteToEdit.tags?.mood || []).join(", "));
      setAestheticTags((creatorPaletteToEdit.tags?.aesthetic || []).join(", "));
    } else {
      // Default new palette setup
      setName("");
      setCategory(CATEGORIES[0]);
      setAuthor("JaZeR-444");
      setVersion("1.0.0");
      setDescription("");
      setCount(5);
      setColors(generateCohesiveColors(5));
      setMoodTags("warm, vibrant");
      setAestheticTags("Modern");
    }
  }, [creatorPaletteToEdit, isCreatorOpen]);

  // Adjust color array size when count changes
  const handleCountChange = (newCount: number) => {
    setCount(newCount);
    setColors((prevColors) => {
      const nextColors = [...prevColors];
      if (newCount < prevColors.length) {
        return nextColors.slice(0, newCount);
      } else {
        // Generate new cohesive colors for the extra slots
        const newCohesive = generateCohesiveColors(newCount);
        for (let i = prevColors.length; i < newCount; i++) {
          nextColors.push({
            name: `Color ${i + 1}`,
            hex: newCohesive[i].hex
          });
        }
        return nextColors;
      }
    });
  };

  const handleColorChange = (index: number, key: "hex" | "name", val: string) => {
    setColors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  };

  const handleAutoGenerate = () => {
    playSound("success");
    setColors(generateCohesiveColors(count));
    showToast("Generated new cohesive color set!");
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast("Please enter a palette name.");
      return;
    }

    // Validation
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!id) {
      showToast("Invalid palette name.");
      return;
    }

    const payload: Palette = {
      id,
      name: name.trim(),
      category,
      author: author.trim() || "JaZeR-444",
      version: version.trim() || "1.0.0",
      count,
      description: description.trim() || `A vibrant ${count}-color palette.`,
      colors: colors.map((c, i) => ({
        name: c.name.trim() || `Color ${i + 1}`,
        hex: c.hex.startsWith("#") ? c.hex : `#${c.hex}`
      })),
      tags: {
        mood: moodTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean),
        aesthetic: aestheticTags.split(",").map(t => t.trim()).filter(Boolean)
      },
      created: creatorPaletteToEdit?.created || new Date().toISOString().split("T")[0],
      updated: new Date().toISOString().split("T")[0],
      path: creatorPaletteToEdit?.path || `Palattes by # of Colors/${count} Color Palette/${name.trim()}.scss`
    };

    startTransition(async () => {
      playSound("success");
      const res = await savePaletteAction(payload, creatorPaletteToEdit?.path);
      if (res.success) {
        showToast(`Palette "${name}" saved and compiled successfully!`);
        closeCreator();
      } else {
        showToast(`Error saving palette: ${res.error}`);
      }
    });
  };

  const handleClose = () => {
    playSound("close");
    closeCreator();
  };

  return (
    <AnimatePresence>
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  {creatorPaletteToEdit ? "Edit Palette" : "Create New Palette"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Design a custom color system, automatically generate SCSS, and sync to the library.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-300 rounded-full transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Metadata */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                      Palette Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Electric Forest"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Color Count
                      </label>
                      <select
                        value={count}
                        onChange={(e) => handleCountChange(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                      >
                        {STANDARD_COUNTS.map((cnt) => (
                          <option key={cnt} value={cnt}>
                            {cnt} Colors
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Author
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="JaZeR-444"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Version
                      </label>
                      <input
                        type="text"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="1.0.0"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                      Description / Intent
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the mood, target application, or aesthetic context..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Mood Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={moodTags}
                        onChange={(e) => setMoodTags(e.target.value)}
                        placeholder="e.g. warm, dark, calm"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Aesthetic Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={aestheticTags}
                        onChange={(e) => setAestheticTags(e.target.value)}
                        placeholder="e.g. Cyberpunk, Retro"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAutoGenerate}
                      className="w-full flex items-center justify-center gap-2 py-3 border border-indigo-500/20 hover:border-indigo-500/50 bg-indigo-50/5 hover:bg-indigo-50/10 text-indigo-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Auto-Generate Harmonious Swatches
                    </button>
                  </div>
                </div>

                {/* Right Column: Interactive Color Chip Editor */}
                <div className="border border-gray-100 dark:border-slate-800/80 rounded-[2rem] p-5 flex flex-col bg-gray-50/30 dark:bg-slate-950/20 max-h-[500px]">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">
                    Color Swatches ({count})
                  </label>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
                    {colors.map((color, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm"
                      >
                        {/* Styled Color Picker */}
                        <div
                          className="relative w-10 h-10 rounded-xl border border-black/5 flex-shrink-0 cursor-pointer overflow-hidden shadow-inner"
                          style={{ backgroundColor: color.hex }}
                        >
                          <input
                            type="color"
                            value={color.hex.slice(0, 7)}
                            onChange={(e) => handleColorChange(index, "hex", e.target.value + "ff")}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                          />
                        </div>

                        {/* Name and Hex Inputs */}
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) => handleColorChange(index, "name", e.target.value)}
                            placeholder="Color Name"
                            className="px-3 py-1.5 rounded-lg border border-gray-150 dark:border-slate-800 bg-transparent text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500 font-bold"
                          />
                          <input
                            type="text"
                            value={color.hex.toUpperCase()}
                            onChange={(e) => handleColorChange(index, "hex", e.target.value)}
                            placeholder="#FFFFFF"
                            className="px-3 py-1.5 rounded-lg border border-gray-150 dark:border-slate-800 bg-transparent text-gray-900 dark:text-white text-xs font-mono outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 px-8 py-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isPending ? "Compiling..." : creatorPaletteToEdit ? "Save Changes" : "Save to Library"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
