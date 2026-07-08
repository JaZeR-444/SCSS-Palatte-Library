"use server";

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { lookup as dnsLookup } from "dns/promises";
import { revalidatePath } from "next/cache";
import { Palette } from "@/types";
import { ImportResult, SavedDesignSystem } from "@/types/design-system";
import { analyzeCss } from "@/utils/import-analyze";
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

export async function saveRoleMappingAction(
  paletteId: string,
  mapping: Record<string, string>,
) {
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
        const newRelativePath = path.join(
          "src",
          "palettes",
          newFolder,
          newFilename,
        );
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
        rgbStr: `rgba(${r}, ${g}, ${b}, 1)`,
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
    const { stdout, stderr } = await execAsync("python tools/build_index.py", {
      cwd: rootDir,
    });
    console.log("Index rebuild output:", stdout);
    if (stderr) console.error("Index rebuild stderr:", stderr);

    // 7. Copy generated palettes.json into web-showcase
    const srcJson = path.join(rootDir, "generated", "palettes.json");
    const destJson = path.join(
      rootDir,
      "web-showcase",
      "src",
      "data",
      "palettes.json",
    );
    await fs.copyFile(srcJson, destJson);
    console.log("Synced palettes.json to web-showcase/src/data");

    // 8. Log changes in palette_history
    try {
      if (oldPalette) {
        db.logPaletteHistory(palette.id, "edit", {
          before: {
            name: oldPalette.name,
            colors: oldPalette.colors.map((c) => ({
              name: c.name,
              hex: c.hex,
            })),
            category: oldPalette.category,
            description: oldPalette.description,
          },
          after: {
            name: palette.name,
            colors: palette.colors.map((c) => ({ name: c.name, hex: c.hex })),
            category: palette.category,
            description: palette.description,
          },
        });
      } else {
        db.logPaletteHistory(palette.id, "create", {
          name: palette.name,
          colors: palette.colors.map((c) => ({ name: c.name, hex: c.hex })),
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

export async function createCollectionAction(
  name: string,
  description?: string,
) {
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

export async function addPaletteToCollectionAction(
  colId: string,
  palId: string,
) {
  try {
    db.addPaletteToCollection(colId, palId);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removePaletteFromCollectionAction(
  colId: string,
  palId: string,
) {
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

// --- Projects Actions ---
export async function updateProjectMetaAction(
  slug: string,
  type: string,
  description: string,
) {
  try {
    db.updateProjectMeta(slug, type, description);
    revalidatePath(`/projects/${slug}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Promote a collection into a project (flip kind + add product metadata). */
export async function promoteToProjectAction(
  slug: string,
  type: string,
  description: string,
) {
  try {
    db.promoteToProject(slug, type, description);
    revalidatePath("/projects");
    revalidatePath(`/projects/${slug}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectPalettesAction(slug: string) {
  return db.getProjectPalettes(slug);
}

// --- Workspaces (unified collections + projects) ---
export async function listWorkspacesAction(kind?: "collection" | "project") {
  return db.listWorkspaces(kind);
}

export async function getManualPaletteIdsAction(slug: string) {
  return db.getManualPaletteIds(slug);
}

export async function addPaletteToProjectAction(
  slug: string,
  paletteId: string,
) {
  try {
    db.addPaletteToProject(slug, paletteId);
    revalidatePath(`/projects/${slug}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removePaletteFromProjectAction(
  slug: string,
  paletteId: string,
) {
  try {
    db.removePaletteFromProject(slug, paletteId);
    revalidatePath(`/projects/${slug}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectPresetsAction(slug: string) {
  return db.getProjectPresets(slug);
}

export async function createProjectPresetAction(
  slug: string,
  name: string,
  paletteId: string,
  mapping: Record<string, string>,
) {
  try {
    const id = db.createProjectPreset(slug, name, paletteId, mapping);
    revalidatePath(`/projects/${slug}`);
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProjectPresetAction(slug: string, id: string) {
  try {
    db.deleteProjectPreset(id);
    revalidatePath(`/projects/${slug}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/* ------------------------------------------------------------------ *
 * Design-system import — reverse-engineer a public site's CSS.        *
 * ------------------------------------------------------------------ */

/** True for loopback / private / link-local / CGNAT addresses (v4 + v6). */
function isPrivateIp(ip: string): boolean {
  const addr = ip.toLowerCase();
  const mapped = addr.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIp(mapped[1]);
  const v4 = addr.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = +v4[1];
    const b = +v4[2];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 255) return true;
    return false;
  }
  if (addr === "::1" || addr === "::") return true;
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // fc00::/7 ULA
  if (/^fe[89ab]/.test(addr)) return true; // fe80::/10 link-local
  return false;
}

/** Protocol + literal-hostname guard (cheap pre-filter before DNS). */
function isSafeImportUrl(u: URL): boolean {
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal"))
    return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":")) {
    return !isPrivateIp(h); // reject private IP literals directly
  }
  return true;
}

/**
 * Resolve the host and reject if the literal guard fails or ANY resolved
 * address is private — closing the "public hostname → private IP" SSRF hole.
 * Residual TOCTOU (resolve vs. connect may differ) is accepted for this
 * public-site import use case; full protection would pin the resolved IP.
 */
async function assertPublicHost(u: URL): Promise<void> {
  if (!isSafeImportUrl(u)) throw new Error("blocked URL");
  let addrs: { address: string }[];
  try {
    addrs = await dnsLookup(u.hostname, { all: true });
  } catch {
    throw new Error("could not resolve host");
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("host resolves to a private address");
  }
}

/** Fetch text, validating every redirect hop against the SSRF guard. */
async function safeFetchText(startUrl: string, cap: number): Promise<string> {
  let url = new URL(startUrl);
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicHost(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(url.toString(), {
        signal: ctrl.signal,
        redirect: "manual",
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; PalattesImport/1.0)",
          accept: "text/html,text/css,*/*",
        },
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error(`HTTP ${res.status}`);
      url = new URL(loc, url); // re-validated at top of next iteration
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text.length > cap ? text.slice(0, cap) : text;
  }
  throw new Error("too many redirects");
}

function extractStylesheetHrefs(html: string): string[] {
  const hrefs: string[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (href) hrefs.push(href[1]);
  }
  return hrefs;
}

export async function analyzeUrlAction(
  rawUrl: string,
): Promise<{ result?: ImportResult; error?: string }> {
  let base: URL;
  try {
    const withScheme = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `https://${rawUrl}`;
    base = new URL(withScheme);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }
  if (!isSafeImportUrl(base)) {
    return { error: "Only public http(s) sites can be imported." };
  }

  let html: string;
  try {
    html = await safeFetchText(base.toString(), 2_000_000);
  } catch (e: any) {
    return {
      error: `Couldn't fetch that site (${e?.message || "network error"}).`,
    };
  }

  // Pull in up to 6 linked stylesheets — that's where most colors live.
  const hrefs = extractStylesheetHrefs(html).slice(0, 6);
  const cssTexts: string[] = [];
  for (const href of hrefs) {
    try {
      const abs = new URL(href, base);
      // safeFetchText re-validates (protocol + DNS + each redirect hop).
      cssTexts.push(await safeFetchText(abs.toString(), 1_500_000));
    } catch {
      // skip unreachable / blocked stylesheet
    }
  }

  const combined = [html, ...cssTexts].join("\n").slice(0, 6_000_000);
  const a = analyzeCss(combined);
  if (!a.colors.length) {
    return {
      error:
        "No colors found — this site likely styles at runtime (CSS-in-JS), which static import can't read.",
    };
  }

  const notes: string[] = [
    "Static CSS only — styles injected at runtime (CSS-in-JS) aren't captured.",
    `Analyzed the page${cssTexts.length ? ` + ${cssTexts.length} stylesheet${cssTexts.length > 1 ? "s" : ""}` : ""}.`,
  ];

  return {
    result: {
      source: { kind: "url", ref: base.hostname },
      colors: a.colors,
      fontSans: a.fontSans,
      radius: a.radius,
      shadow: a.shadow,
      notes,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Design-system persistence (reusable, project-optional artifacts).   *
 * ------------------------------------------------------------------ */

export async function listDesignSystemsAction(projectSlug?: string) {
  return db.listDesignSystems(projectSlug);
}

export async function getDesignSystemAction(id: string) {
  return db.getDesignSystem(id);
}

export async function saveDesignSystemAction(rec: SavedDesignSystem) {
  const saved = db.saveDesignSystem(rec);
  if (saved.projectSlug) revalidatePath(`/projects/${saved.projectSlug}`);
  return saved;
}

export async function renameDesignSystemAction(id: string, name: string) {
  db.renameDesignSystem(id, name);
}

export async function duplicateDesignSystemAction(id: string) {
  return db.duplicateDesignSystem(id);
}

export async function setDesignSystemProjectAction(
  id: string,
  projectSlug: string | null,
) {
  db.setDesignSystemProject(id, projectSlug);
  if (projectSlug) revalidatePath(`/projects/${projectSlug}`);
}

export async function deleteDesignSystemAction(id: string) {
  db.deleteDesignSystem(id);
}
