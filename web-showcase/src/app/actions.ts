"use server";

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { revalidatePath } from "next/cache";
import { Palette } from "@/types";
import * as db from "@/utils/db";

const execAsync = promisify(exec);

export async function fetchPalettes() {
  return db.getAllPalettes();
}

export async function getRandomPaletteAction() {
  return db.getRandomPalette();
}

export async function getFavoritesAction() {
  return db.getFavorites();
}

export async function toggleFavoriteAction(paletteId: string, isFav: boolean) {
  db.toggleFavorite(paletteId, isFav);
  revalidatePath("/");
}

export async function getRoleMappingAction(paletteId: string) {
  return db.getRoleMapping(paletteId);
}

export async function saveRoleMappingAction(paletteId: string, mapping: Record<string, string>) {
  db.saveRoleMapping(paletteId, mapping);
}

// Helpers for color format conversions
function hexToRgb(hex: string) {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 8) {
    cleanHex = cleanHex.slice(0, 6);
  }
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function hexToHsl(hex: string) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function formatKebabCase(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanHexForScss(hex: string): string {
  let clean = hex.toLowerCase().trim();
  if (!clean.startsWith("#")) {
    clean = "#" + clean;
  }
  // Ensure 8-character hex for color variables (e.g. #ffffffff)
  if (clean.length === 7) {
    clean = clean + "ff";
  }
  return clean;
}

export async function savePaletteAction(palette: Palette, oldPath?: string) {
  try {
    const rootDir = path.resolve(process.cwd(), "..");
    const paletteLibraryDir = path.join(rootDir, "palettes-library");
    const paletteSourceDir = path.join(paletteLibraryDir, "src", "palettes");
    
    // Fetch existing palette from DB to compare for history log
    let oldPalette: Palette | null = null;
    try {
      const allPals = db.getAllPalettes();
      oldPalette = allPals.find((p) => p.id === palette.id) || null;
    } catch (e) {
      console.error("Failed to fetch old palette for history logging:", e);
    }
    
    // 1. Delete old SCSS file if name/count changed and oldPath is provided
    if (oldPath) {
      const fullOldPath = path.resolve(paletteLibraryDir, oldPath);
      try {
        await fs.access(fullOldPath);
        // Normalize new path and compare
        const newFolder = `${palette.count} Color Palette`;
        const newFilename = `${palette.name}.scss`;
        const newRelativePath = path.join("src", "palettes", newFolder, newFilename);
        const fullNewPath = path.resolve(paletteLibraryDir, newRelativePath);
        
        if (fullOldPath !== fullNewPath) {
          await fs.unlink(fullOldPath);
          console.log(`Deleted old file: ${oldPath}`);
        }
      } catch (err) {
        // Old file might not exist, ignore
      }
    }

    // 2. Prepare directories
    const folderName = `${palette.count} Color Palette`;
    const folderPath = path.join(paletteSourceDir, folderName);
    await fs.mkdir(folderPath, { recursive: true });

    // 3. Format colors
    const formattedColors = palette.colors.map((c) => {
      const hex = cleanHexForScss(c.hex);
      const kebabName = formatKebabCase(c.name);
      const { r, g, b } = hexToRgb(hex);
      const { h, s, l } = hexToHsl(hex);
      return {
        originalName: c.name,
        kebabName,
        hex,
        hslStr: `hsla(${h}, ${s}%, ${l}%, 1)`,
        rgbStr: `rgba(${r}, ${g}, ${b}, 1)`
      };
    });

    // 4. Generate SCSS file content
    const today = new Date().toISOString().split("T")[0];
    
    let content = `/*---\n`;
    content += `id: ${palette.id}\n`;
    content += `name: ${palette.name}\n`;
    content += `author: ${palette.author || "JaZeR-444"}\n`;
    content += `version: ${palette.version || "1.0.0"}\n`;
    content += `category: ${palette.category || "Collection"}\n`;
    content += `count: ${palette.count}\n`;
    content += `tags:\n`;
    content += `  mood:\n`;
    (palette.tags?.mood || []).forEach((m) => {
      content += `  - ${m.toLowerCase()}\n`;
    });
    content += `  aesthetic:\n`;
    (palette.tags?.aesthetic || []).forEach((a) => {
      content += `  - ${a}\n`;
    });
    content += `intent: ${palette.intent || palette.description || `A vibrant ${palette.count}-color palette.`}\n`;
    content += `created: '${palette.created || today}'\n`;
    content += `updated: '${today}'\n`;
    content += `---*/\n\n`;

    content += `:root {\n`;
    content += `/* CSS HEX */\n`;
    formattedColors.forEach((c) => {
      content += `--${c.kebabName}: ${c.hex};\n`;
    });
    content += `\n/* CSS HSL */\n`;
    formattedColors.forEach((c) => {
      content += `--${c.kebabName}: ${c.hslStr};\n`;
    });
    content += `}\n\n`;

    content += `/* SCSS HEX */\n`;
    formattedColors.forEach((c) => {
      content += `$${c.kebabName}: ${c.hex};\n`;
    });
    content += `\n`;

    content += `/* SCSS HSL */\n`;
    formattedColors.forEach((c) => {
      content += `$${c.kebabName}: ${c.hslStr};\n`;
    });
    content += `\n`;

    content += `/* SCSS RGB */\n`;
    formattedColors.forEach((c) => {
      content += `$${c.kebabName}: ${c.rgbStr};\n`;
    });
    content += `\n`;

    // Gradients
    const hexListStr = formattedColors.map((c) => c.hex).join(", ");
    content += `/* SCSS Gradient */\n`;
    content += `$gradient-top: linear-gradient(0deg, ${hexListStr});\n`;
    content += `$gradient-right: linear-gradient(90deg, ${hexListStr});\n`;
    content += `$gradient-bottom: linear-gradient(180deg, ${hexListStr});\n`;
    content += `$gradient-left: linear-gradient(270deg, ${hexListStr});\n`;
    content += `$gradient-top-right: linear-gradient(45deg, ${hexListStr});\n`;
    content += `$gradient-bottom-right: linear-gradient(135deg, ${hexListStr});\n`;
    content += `$gradient-top-left: linear-gradient(225deg, ${hexListStr});\n`;
    content += `$gradient-bottom-left: linear-gradient(315deg, ${hexListStr});\n`;
    content += `$gradient-radial: radial-gradient(${hexListStr});\n\n`;

    // SCSS Map
    content += `/* SCSS Map */\n`;
    content += `$${formatKebabCase(palette.name)}-map: (\n`;
    formattedColors.forEach((c, idx) => {
      const comma = idx === formattedColors.length - 1 ? "" : ",";
      content += `    "${c.kebabName}": ${c.hex}${comma}\n`;
    });
    content += `);\n`;

    // 5. Write file
    const filePath = path.join(folderPath, `${palette.name}.scss`);
    await fs.writeFile(filePath, content, "utf-8");
    console.log(`Saved SCSS file to: ${filePath}`);

    // 6. Run rebuild script to sync db, csv, markdown, and showcase JSON
    const { stdout, stderr } = await execAsync("python tools/build_index.py", { cwd: rootDir });
    console.log("Index rebuild output:", stdout);
    if (stderr) console.error("Index rebuild stderr:", stderr);

    // 7. Copy generated palettes.json into web-showcase
    const srcJson = path.join(rootDir, "generated", "palettes.json");
    const destJson = path.join(rootDir, "web-showcase", "src", "data", "palettes.json");
    await fs.copyFile(srcJson, destJson);
    console.log("Synced palettes.json to web-showcase/src/data");

    // 8. Log changes in palette_history
    try {
      if (oldPalette) {
        db.logPaletteHistory(palette.id, "edit", {
          before: {
            name: oldPalette.name,
            colors: oldPalette.colors.map(c => ({ name: c.name, hex: c.hex })),
            category: oldPalette.category,
            description: oldPalette.description,
          },
          after: {
            name: palette.name,
            colors: palette.colors.map(c => ({ name: c.name, hex: c.hex })),
            category: palette.category,
            description: palette.description,
          }
        });
      } else {
        db.logPaletteHistory(palette.id, "create", {
          name: palette.name,
          colors: palette.colors.map(c => ({ name: c.name, hex: c.hex })),
          category: palette.category,
          description: palette.description,
        });
      }
    } catch (historyErr) {
      console.error("Failed to log palette history:", historyErr);
    }

    // 9. Revalidate page cache
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Save palette action failed:", error);
    return { success: false, error: error.message };
  }
}

// --- Collections Actions ---
export async function getCollectionsAction() {
  return db.getCollections();
}

export async function createCollectionAction(name: string, description?: string) {
  try {
    const id = db.createCollection(name, description);
    revalidatePath("/");
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCollectionAction(id: string) {
  try {
    db.deleteCollection(id);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addPaletteToCollectionAction(colId: string, palId: string) {
  try {
    db.addPaletteToCollection(colId, palId);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removePaletteFromCollectionAction(colId: string, palId: string) {
  try {
    db.removePaletteFromCollection(colId, palId);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCollectionPalettesAction(colId: string) {
  return db.getCollectionPalettes(colId);
}

// --- History Actions ---
export async function getPaletteHistoryAction(paletteId: string) {
  return db.getPaletteHistory(paletteId);
}

// --- Search Actions ---
export async function searchPalettesAction(query: string) {
  return db.searchPalettes(query);
}

export async function searchPalettesByColorAction(hexColor: string) {
  return db.searchPalettesByColor(hexColor);
}
