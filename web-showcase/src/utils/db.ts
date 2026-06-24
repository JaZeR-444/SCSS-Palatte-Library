import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";
import { Palette, Color } from "@/types";

function resolveDbPath() {
  const localSeedPath = path.resolve(process.cwd(), "src", "data", "palettes.db");
  const repoSeedPath = path.resolve(process.cwd(), "..", "generated", "palettes.db");
  const seedPath = fs.existsSync(localSeedPath) ? localSeedPath : repoSeedPath;

  if (process.env.VERCEL) {
    const runtimePath = path.join(os.tmpdir(), "palettes.db");
    if (!fs.existsSync(runtimePath)) {
      fs.copyFileSync(seedPath, runtimePath);
    }
    return runtimePath;
  }

  return seedPath;
}

// Database is generated from SCSS sources by tools/build_index.py.
const dbPath = resolveDbPath();

let dbInstance: Database.Database | null = null;

export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  palette_count: number;
}

export interface HistoryEntry {
  id: number;
  palette_id: string;
  action: string;
  changes_json: string;
  timestamp: string;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
    // Initialize schema extension tables
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS role_mappings (
        palette_id TEXT PRIMARY KEY,
        mapping_json TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS favorites (
        palette_id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collection_palettes (
        collection_id TEXT,
        palette_id TEXT,
        PRIMARY KEY (collection_id, palette_id),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS palette_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        palette_id TEXT NOT NULL,
        action TEXT NOT NULL,
        changes_json TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return dbInstance;
}

function hexToRgb(hex: string): [number, number, number] | null {
  let c = hex.replace(/^#/, "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  } else if (c.length === 8) {
    c = c.slice(0, 6);
  }
  if (c.length !== 6) return null;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

// Stitching helper for building full Palette objects from flat database rows
function stitchPalettes(palettesRows: any[], colorsRows: any[], tagsRows: any[]): Palette[] {
  const colorsMap: Record<string, Color[]> = {};
  for (const c of colorsRows) {
    if (!colorsMap[c.palette_id]) {
      colorsMap[c.palette_id] = [];
    }
    colorsMap[c.palette_id].push({
      hex: c.hex,
      name: c.name,
      hsl: `hsl(${c.h}, ${c.s}%, ${c.l}%)`,
    });
  }

  const tagsMap: Record<string, { mood: string[]; aesthetic: string[] }> = {};
  for (const t of tagsRows) {
    if (!tagsMap[t.palette_id]) {
      tagsMap[t.palette_id] = { mood: [], aesthetic: [] };
    }
    if (t.tag_type === "mood") {
      tagsMap[t.palette_id].mood.push(t.tag_value);
    } else if (t.tag_type === "aesthetic") {
      tagsMap[t.palette_id].aesthetic.push(t.tag_value);
    }
  }

  return palettesRows.map((row: any) => ({
    id: row.id,
    name: row.name,
    author: row.author,
    version: row.version,
    category: row.category,
    count: row.color_count,
    description: row.description,
    path: row.path,
    colors: colorsMap[row.id] || [],
    tags: tagsMap[row.id] || { mood: [], aesthetic: [] },
    created: row.created || "",
    updated: row.updated || "",
  }));
}

export function getAllPalettes(): Palette[] {
  const db = getDb();
  try {
    const palettes = db.prepare("SELECT * FROM palettes ORDER BY color_count ASC, name ASC").all() as any[];
    const colors = db.prepare("SELECT * FROM palette_colors ORDER BY palette_id ASC, color_index ASC").all() as any[];
    const tags = db.prepare("SELECT * FROM palette_tags").all() as any[];

    return stitchPalettes(palettes, colors, tags);
  } catch (error) {
    console.error("Failed to load palettes from database, returning empty array:", error);
    return [];
  }
}

// SQL FTS5 Search
export function searchPalettes(query: string): Palette[] {
  if (!query || !query.trim()) {
    return getAllPalettes();
  }
  const db = getDb();
  try {
    // Format search terms for prefix matching
    const cleanQuery = query
      .trim()
      .split(/\s+/)
      .map((term) => term.replace(/[*"]/g, "") + "*")
      .join(" AND ");

    const ftsRows = db.prepare("SELECT id FROM palettes_fts WHERE palettes_fts MATCH ?").all(cleanQuery) as { id: string }[];
    if (ftsRows.length === 0) return [];
    
    const ids = ftsRows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    
    const palettes = db.prepare(`SELECT * FROM palettes WHERE id IN (${placeholders})`).all(...ids) as any[];
    const colors = db.prepare(`SELECT * FROM palette_colors WHERE palette_id IN (${placeholders}) ORDER BY palette_id ASC, color_index ASC`).all(...ids) as any[];
    const tags = db.prepare(`SELECT * FROM palette_tags WHERE palette_id IN (${placeholders})`).all(...ids) as any[];

    // Ensure they keep the matching FTS relevance or simple ordering
    const stitched = stitchPalettes(palettes, colors, tags);
    const orderMap = new Map(ids.map((id, index) => [id, index]));
    return stitched.sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999));
  } catch (error) {
    console.error("FTS search failed, falling back to basic LIKE query:", error);
    // Fallback: search using LIKE
    try {
      const param = `%${query.trim()}%`;
      const palettes = db.prepare(`
        SELECT DISTINCT p.* FROM palettes p
        LEFT JOIN palette_tags pt ON p.id = pt.palette_id
        WHERE p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ? OR pt.tag_value LIKE ?
      `).all(param, param, param, param) as any[];
      if (palettes.length === 0) return [];
      const ids = palettes.map(p => p.id);
      const placeholders = ids.map(() => "?").join(",");
      const colors = db.prepare(`SELECT * FROM palette_colors WHERE palette_id IN (${placeholders}) ORDER BY palette_id ASC, color_index ASC`).all(...ids) as any[];
      const tags = db.prepare(`SELECT * FROM palette_tags WHERE palette_id IN (${placeholders})`).all(...ids) as any[];
      return stitchPalettes(palettes, colors, tags);
    } catch (fallbackError) {
      console.error("Fallback search failed:", fallbackError);
      return [];
    }
  }
}

// SQL 3D Color Proximity Search (Squared Euclidean)
export function searchPalettesByColor(hexColor: string): Palette[] {
  const db = getDb();
  try {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return getAllPalettes();
    const [tr, tg, tb] = rgb;

    const distRows = db.prepare(`
      SELECT palette_id, MIN((r - ?)*(r - ?) + (g - ?)*(g - ?) + (b - ?)*(b - ?)) AS distance
      FROM palette_colors
      GROUP BY palette_id
      ORDER BY distance ASC
    `).all(tr, tg, tb) as { palette_id: string; distance: number }[];

    if (distRows.length === 0) return [];
    const ids = distRows.map((r) => r.palette_id);
    const placeholders = ids.map(() => "?").join(",");

    const palettes = db.prepare(`SELECT * FROM palettes WHERE id IN (${placeholders})`).all(...ids) as any[];
    const colors = db.prepare(`SELECT * FROM palette_colors WHERE palette_id IN (${placeholders}) ORDER BY palette_id ASC, color_index ASC`).all(...ids) as any[];
    const tags = db.prepare(`SELECT * FROM palette_tags WHERE palette_id IN (${placeholders})`).all(...ids) as any[];

    const stitched = stitchPalettes(palettes, colors, tags);
    const orderMap = new Map(ids.map((id, index) => [id, index]));
    return stitched.sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999));
  } catch (error) {
    console.error("Proximity color search failed:", error);
    return [];
  }
}

export function getFavorites(): string[] {
  const db = getDb();
  try {
    const rows = db.prepare("SELECT palette_id FROM favorites").all() as { palette_id: string }[];
    return rows.map((r) => r.palette_id);
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }
}

export function toggleFavorite(paletteId: string, isFav: boolean): void {
  const db = getDb();
  try {
    if (isFav) {
      db.prepare("INSERT OR REPLACE INTO favorites (palette_id) VALUES (?)").run(paletteId);
    } else {
      db.prepare("DELETE FROM favorites WHERE palette_id = ?").run(paletteId);
    }
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
  }
}

export function getRoleMapping(paletteId: string): Record<string, string> | null {
  const db = getDb();
  try {
    const row = db.prepare("SELECT mapping_json FROM role_mappings WHERE palette_id = ?").get(paletteId) as { mapping_json: string } | undefined;
    return row ? JSON.parse(row.mapping_json) : null;
  } catch (error) {
    console.error("Failed to fetch role mapping:", error);
    return null;
  }
}

export function saveRoleMapping(paletteId: string, mapping: Record<string, string>): void {
  const db = getDb();
  try {
    db.prepare("INSERT OR REPLACE INTO role_mappings (palette_id, mapping_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)").run(
      paletteId,
      JSON.stringify(mapping)
    );
  } catch (error) {
    console.error("Failed to save role mapping:", error);
  }
}

// --- Collections CRUD ---
export function getCollections(): Collection[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT c.*, COUNT(cp.palette_id) as palette_count
      FROM collections c
      LEFT JOIN collection_palettes cp ON c.id = cp.collection_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      created_at: r.created_at,
      palette_count: r.palette_count,
    }));
  } catch (error) {
    console.error("Failed to get collections:", error);
    return [];
  }
}

export function createCollection(name: string, description?: string): string {
  const db = getDb();
  const id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
  try {
    db.prepare("INSERT INTO collections (id, name, description) VALUES (?, ?, ?)").run(
      id,
      name,
      description || ""
    );
    return id;
  } catch (error) {
    console.error("Failed to create collection:", error);
    throw error;
  }
}

export function deleteCollection(id: string): void {
  const db = getDb();
  try {
    db.prepare("DELETE FROM collections WHERE id = ?").run(id);
  } catch (error) {
    console.error("Failed to delete collection:", error);
    throw error;
  }
}

export function addPaletteToCollection(collectionId: string, paletteId: string): void {
  const db = getDb();
  try {
    db.prepare("INSERT OR IGNORE INTO collection_palettes (collection_id, palette_id) VALUES (?, ?)").run(
      collectionId,
      paletteId
    );
  } catch (error) {
    console.error("Failed to add palette to collection:", error);
    throw error;
  }
}

export function removePaletteFromCollection(collectionId: string, paletteId: string): void {
  const db = getDb();
  try {
    db.prepare("DELETE FROM collection_palettes WHERE collection_id = ? AND palette_id = ?").run(
      collectionId,
      paletteId
    );
  } catch (error) {
    console.error("Failed to remove palette from collection:", error);
    throw error;
  }
}

export function getCollectionPalettes(collectionId: string): Palette[] {
  const db = getDb();
  try {
    const rows = db.prepare("SELECT palette_id FROM collection_palettes WHERE collection_id = ?").all(collectionId) as { palette_id: string }[];
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.palette_id);
    const placeholders = ids.map(() => "?").join(",");

    const palettes = db.prepare(`SELECT * FROM palettes WHERE id IN (${placeholders})`).all(...ids) as any[];
    const colors = db.prepare(`SELECT * FROM palette_colors WHERE palette_id IN (${placeholders}) ORDER BY palette_id ASC, color_index ASC`).all(...ids) as any[];
    const tags = db.prepare(`SELECT * FROM palette_tags WHERE palette_id IN (${placeholders})`).all(...ids) as any[];

    return stitchPalettes(palettes, colors, tags);
  } catch (error) {
    console.error("Failed to get collection palettes:", error);
    return [];
  }
}

// --- History Log ---
export function getPaletteHistory(paletteId: string): HistoryEntry[] {
  const db = getDb();
  try {
    return db.prepare("SELECT * FROM palette_history WHERE palette_id = ? ORDER BY timestamp DESC").all(paletteId) as any[];
  } catch (error) {
    console.error("Failed to fetch palette history:", error);
    return [];
  }
}

export function logPaletteHistory(paletteId: string, action: string, changes: any): void {
  const db = getDb();
  try {
    db.prepare("INSERT INTO palette_history (palette_id, action, changes_json) VALUES (?, ?, ?)").run(
      paletteId,
      action,
      JSON.stringify(changes)
    );
  } catch (error) {
    console.error("Failed to log palette history:", error);
  }
}
