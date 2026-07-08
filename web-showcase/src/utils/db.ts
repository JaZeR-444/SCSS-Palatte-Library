import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";
import { Palette, Color } from "@/types";
import type { SavedDesignSystem } from "@/types/design-system";

function resolveDbPath() {
  const localSeedPath = path.resolve(
    process.cwd(),
    "src",
    "data",
    "palettes.db",
  );
  const repoSeedPath = path.resolve(
    process.cwd(),
    "..",
    "generated",
    "palettes.db",
  );
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

      CREATE TABLE IF NOT EXISTS projects (
        slug TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_palettes (
        project_slug TEXT,
        palette_id TEXT,
        PRIMARY KEY (project_slug, palette_id)
      );

      CREATE TABLE IF NOT EXISTS project_presets (
        id TEXT PRIMARY KEY,
        project_slug TEXT NOT NULL,
        name TEXT NOT NULL,
        palette_id TEXT NOT NULL,
        mapping_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Full, reusable design systems (the Brand System modal's output).
      -- Standalone artifacts; project_slug is an optional association so a
      -- system can be reused/attached across projects later.
      CREATE TABLE IF NOT EXISTS design_systems (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        palette_id TEXT,
        project_slug TEXT,
        system_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Unified workspace primitive. A workspace is a named set of palettes
      -- with a kind discriminator: 'collection' (a loose, user-curated bag)
      -- or 'project' (a product workspace). This collapses the previously
      -- parallel collections/projects models onto one table + one join.
      -- The single slug key doubles as id and URL key (a collection's old
      -- slug-<timestamp> id becomes its slug; a project's slug is
      -- slugifyProject(name)). Children reference workspace_slug.
      CREATE TABLE IF NOT EXISTS workspaces (
        slug        TEXT PRIMARY KEY,
        kind        TEXT NOT NULL DEFAULT 'collection'
                    CHECK (kind IN ('collection','project')),
        name        TEXT NOT NULL,
        type        TEXT,
        description TEXT,
        promoted_at DATETIME,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Manual palette membership: collection members + a project's MANUAL
      -- additions (a project also has tag-derived members, see palette_tags).
      CREATE TABLE IF NOT EXISTS workspace_palettes (
        workspace_slug TEXT NOT NULL,
        palette_id     TEXT NOT NULL,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (workspace_slug, palette_id),
        FOREIGN KEY (workspace_slug) REFERENCES workspaces(slug) ON DELETE CASCADE
      );

      -- Per-workspace role-mapping presets (re-homed from project_presets).
      CREATE TABLE IF NOT EXISTS workspace_presets (
        id             TEXT PRIMARY KEY,
        workspace_slug TEXT NOT NULL,
        name           TEXT NOT NULL,
        palette_id     TEXT NOT NULL,
        mapping_json   TEXT NOT NULL,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_workspaces_kind ON workspaces(kind);
      CREATE INDEX IF NOT EXISTS idx_ws_palettes_ws  ON workspace_palettes(workspace_slug);
      CREATE INDEX IF NOT EXISTS idx_ws_presets_ws   ON workspace_presets(workspace_slug);
    `);

    migrateToWorkspaces(dbInstance);
  }
  return dbInstance;
}

/**
 * Idempotently migrate the legacy collections/projects tables onto the unified
 * `workspaces` model. The FK-declared cascade on workspace_palettes never
 * actually fires because `PRAGMA foreign_keys` is OFF for this connection, so
 * all deletes elsewhere do explicit child cleanup — the FK is documentation.
 *
 * Two idempotency guards work together:
 *   - the column-existence check makes the design_systems ALTER safe to run on
 *     every getDb() (better-sqlite3 has no `ADD COLUMN IF NOT EXISTS`);
 *   - `PRAGMA user_version` gates the one-time data backfill so it is a no-op
 *     once applied (survives Vercel's per-cold-start seed→tmp copy), and
 *     `INSERT OR IGNORE` guards against any half-applied state.
 *
 * The legacy tables are intentionally left in place (and dual-written by the
 * design-system helpers) for one release so a code rollback still sees data.
 */
function migrateToWorkspaces(db: Database.Database): void {
  // Add design_systems.workspace_slug if missing (guarded — ADD COLUMN throws
  // if it already exists). Runs every init; cheap and idempotent.
  const dsCols = db.prepare(`PRAGMA table_info(design_systems)`).all() as {
    name: string;
  }[];
  if (!dsCols.some((c) => c.name === "workspace_slug")) {
    db.exec(`ALTER TABLE design_systems ADD COLUMN workspace_slug TEXT`);
  }

  const userVersion = db.pragma("user_version", { simple: true }) as number;
  if (userVersion >= 1) return;

  db.transaction(() => {
    // collections -> workspaces(kind='collection')
    db.exec(`
      INSERT OR IGNORE INTO workspaces (slug, kind, name, description, created_at)
      SELECT id, 'collection', name, description, created_at FROM collections;
    `);
    // projects (metadata sidecar) -> workspaces(kind='project')
    db.exec(`
      INSERT OR IGNORE INTO workspaces (slug, kind, name, type, description, created_at)
      SELECT slug, 'project', name, type, description, created_at FROM projects;
    `);
    // collection_palettes + project_palettes -> workspace_palettes
    db.exec(`
      INSERT OR IGNORE INTO workspace_palettes (workspace_slug, palette_id)
      SELECT collection_id, palette_id FROM collection_palettes;
    `);
    db.exec(`
      INSERT OR IGNORE INTO workspace_palettes (workspace_slug, palette_id)
      SELECT project_slug, palette_id FROM project_palettes;
    `);
    // project_presets -> workspace_presets
    db.exec(`
      INSERT OR IGNORE INTO workspace_presets
        (id, workspace_slug, name, palette_id, mapping_json, created_at)
      SELECT id, project_slug, name, palette_id, mapping_json, created_at
      FROM project_presets;
    `);
    // design_systems.project_slug -> workspace_slug
    db.exec(`
      UPDATE design_systems SET workspace_slug = project_slug
      WHERE workspace_slug IS NULL AND project_slug IS NOT NULL;
    `);
    db.pragma("user_version = 1");
  })();
}

function hexToRgb(hex: string): [number, number, number] | null {
  let c = hex.replace(/^#/, "");
  if (c.length === 3) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
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
function stitchPalettes(
  palettesRows: any[],
  colorsRows: any[],
  tagsRows: any[],
): Palette[] {
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
  // Single-value enrichment facets (source, kind, hue, temperature, harmony)
  // written by enrich_palettes.py as palette_tags rows.
  const facetMap: Record<string, Record<string, string>> = {};
  for (const t of tagsRows) {
    if (t.tag_type === "mood" || t.tag_type === "aesthetic") {
      if (!tagsMap[t.palette_id]) {
        tagsMap[t.palette_id] = { mood: [], aesthetic: [] };
      }
      tagsMap[t.palette_id][t.tag_type as "mood" | "aesthetic"].push(
        t.tag_value,
      );
    } else {
      if (!facetMap[t.palette_id]) facetMap[t.palette_id] = {};
      // last-writer wins; these facets are single-valued per palette
      facetMap[t.palette_id][t.tag_type] = t.tag_value;
    }
  }

  return palettesRows.map((row: any) => {
    const f = facetMap[row.id] || {};
    return {
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
      // Full accessibility/derived objects live in palettes.json (imported by
      // client components); the DB path surfaces the single-valued facets.
      source: f.source as Palette["source"],
      kind: f.kind as Palette["kind"],
      project: f.project,
      swatchType: f.swatchType,
    };
  });
}

/**
 * Fetch + stitch full Palette objects for a set of ids (order not preserved).
 * Shared by the workspace / collection / project palette getters.
 */
function stitchByIds(ids: string[]): Palette[] {
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const palettes = db
    .prepare(`SELECT * FROM palettes WHERE id IN (${placeholders})`)
    .all(...ids) as any[];
  const colors = db
    .prepare(
      `SELECT * FROM palette_colors WHERE palette_id IN (${placeholders}) ORDER BY palette_id ASC, color_index ASC`,
    )
    .all(...ids) as any[];
  const tags = db
    .prepare(`SELECT * FROM palette_tags WHERE palette_id IN (${placeholders})`)
    .all(...ids) as any[];
  return stitchPalettes(palettes, colors, tags);
}

export function getAllPalettes(): Palette[] {
  const db = getDb();
  try {
    const palettes = db
      .prepare("SELECT * FROM palettes ORDER BY color_count ASC, name ASC")
      .all() as any[];
    const colors = db
      .prepare(
        "SELECT * FROM palette_colors ORDER BY palette_id ASC, color_index ASC",
      )
      .all() as any[];
    const tags = db.prepare("SELECT * FROM palette_tags").all() as any[];

    return stitchPalettes(palettes, colors, tags);
  } catch (error) {
    console.error(
      "Failed to load palettes from database, returning empty array:",
      error,
    );
    return [];
  }
}

export function getRandomPalette(): Palette | null {
  const db = getDb();
  try {
    const palette = db
      .prepare("SELECT * FROM palettes ORDER BY RANDOM() LIMIT 1")
      .get() as any | undefined;
    if (!palette) return null;

    const colors = db
      .prepare(
        "SELECT * FROM palette_colors WHERE palette_id = ? ORDER BY color_index ASC",
      )
      .all(palette.id) as any[];
    const tags = db
      .prepare("SELECT * FROM palette_tags WHERE palette_id = ?")
      .all(palette.id) as any[];

    const stitched = stitchPalettes([palette], colors, tags);
    return stitched[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch random palette:", error);
    return null;
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

    const ftsRows = db
      .prepare("SELECT id FROM palettes_fts WHERE palettes_fts MATCH ?")
      .all(cleanQuery) as { id: string }[];
    if (ftsRows.length === 0) return [];

    const ids = ftsRows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");

    const palettes = db
      .prepare(`SELECT * FROM palettes WHERE id IN (${placeholders})`)
      .all(...ids) as any[];
    const colors = db
      .prepare(
        `SELECT * FROM palette_colors WHERE palette_id IN (${placeholders}) ORDER BY palette_id ASC, color_index ASC`,
      )
      .all(...ids) as any[];
    const tags = db
      .prepare(
        `SELECT * FROM palette_tags WHERE palette_id IN (${placeholders})`,
      )
      .all(...ids) as any[];

    // Ensure they keep the matching FTS relevance or simple ordering
    const stitched = stitchPalettes(palettes, colors, tags);
    const orderMap = new Map(ids.map((id, index) => [id, index]));
    return stitched.sort(
      (a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999),
    );
  } catch (error) {
    console.error(
      "FTS search failed, falling back to basic LIKE query:",
      error,
    );
    // Fallback: search using LIKE
    try {
      const param = `%${query.trim()}%`;
      const palettes = db
        .prepare(
          `
        SELECT DISTINCT p.* FROM palettes p
        LEFT JOIN palette_tags pt ON p.id = pt.palette_id
        WHERE p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ? OR pt.tag_value LIKE ?
      `,
        )
        .all(param, param, param, param) as any[];
      if (palettes.length === 0) return [];
      const ids = palettes.map((p) => p.id);
      const placeholders = ids.map(() => "?").join(",");
      const colors = db
        .prepare(
          `SELECT * FROM palette_colors WHERE palette_id IN (${placeholders}) ORDER BY palette_id ASC, color_index ASC`,
        )
        .all(...ids) as any[];
      const tags = db
        .prepare(
          `SELECT * FROM palette_tags WHERE palette_id IN (${placeholders})`,
        )
        .all(...ids) as any[];
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

    const distRows = db
      .prepare(
        `
      SELECT palette_id, MIN((r - ?)*(r - ?) + (g - ?)*(g - ?) + (b - ?)*(b - ?)) AS distance
      FROM palette_colors
      GROUP BY palette_id
      ORDER BY distance ASC
    `,
      )
      .all(tr, tg, tb) as { palette_id: string; distance: number }[];

    if (distRows.length === 0) return [];
    const ids = distRows.map((r) => r.palette_id);
    const placeholders = ids.map(() => "?").join(",");

    const palettes = db
      .prepare(`SELECT * FROM palettes WHERE id IN (${placeholders})`)
      .all(...ids) as any[];
    const colors = db
      .prepare(
        `SELECT * FROM palette_colors WHERE palette_id IN (${placeholders}) ORDER BY palette_id ASC, color_index ASC`,
      )
      .all(...ids) as any[];
    const tags = db
      .prepare(
        `SELECT * FROM palette_tags WHERE palette_id IN (${placeholders})`,
      )
      .all(...ids) as any[];

    const stitched = stitchPalettes(palettes, colors, tags);
    const orderMap = new Map(ids.map((id, index) => [id, index]));
    return stitched.sort(
      (a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999),
    );
  } catch (error) {
    console.error("Proximity color search failed:", error);
    return [];
  }
}

export function getFavorites(): string[] {
  const db = getDb();
  try {
    const rows = db.prepare("SELECT palette_id FROM favorites").all() as {
      palette_id: string;
    }[];
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
      db.prepare(
        "INSERT OR REPLACE INTO favorites (palette_id) VALUES (?)",
      ).run(paletteId);
    } else {
      db.prepare("DELETE FROM favorites WHERE palette_id = ?").run(paletteId);
    }
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
  }
}

export function getRoleMapping(
  paletteId: string,
): Record<string, string> | null {
  const db = getDb();
  try {
    const row = db
      .prepare("SELECT mapping_json FROM role_mappings WHERE palette_id = ?")
      .get(paletteId) as { mapping_json: string } | undefined;
    return row ? JSON.parse(row.mapping_json) : null;
  } catch (error) {
    console.error("Failed to fetch role mapping:", error);
    return null;
  }
}

export function saveRoleMapping(
  paletteId: string,
  mapping: Record<string, string>,
): void {
  const db = getDb();
  try {
    db.prepare(
      "INSERT OR REPLACE INTO role_mappings (palette_id, mapping_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    ).run(paletteId, JSON.stringify(mapping));
  } catch (error) {
    console.error("Failed to save role mapping:", error);
  }
}

// --- Collections (workspaces of kind='collection') ---
// A collection is the loose, user-curated bag of palettes. It shares the
// unified `workspaces` + `workspace_palettes` storage with Projects; the only
// differences are `kind` and that a collection has no tag-derived membership.
export function getCollections(): Collection[] {
  const db = getDb();
  try {
    const rows = db
      .prepare(
        `
      SELECT w.slug AS id, w.name, w.description, w.created_at,
             COUNT(wp.palette_id) AS palette_count
      FROM workspaces w
      LEFT JOIN workspace_palettes wp ON w.slug = wp.workspace_slug
      WHERE w.kind = 'collection'
      GROUP BY w.slug
      ORDER BY w.created_at DESC
    `,
      )
      .all() as any[];
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
  // Same id scheme as before: slugified name + Date.now(). The timestamp
  // suffix keeps collection slugs from ever colliding with project slugs.
  const id =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") +
    "-" +
    Date.now();
  try {
    db.prepare(
      "INSERT INTO workspaces (slug, kind, name, description) VALUES (?, 'collection', ?, ?)",
    ).run(id, name, description || "");
    return id;
  } catch (error) {
    console.error("Failed to create collection:", error);
    throw error;
  }
}

export function deleteCollection(id: string): void {
  const db = getDb();
  try {
    // FKs are OFF on this connection, so cascade explicitly in a transaction
    // and clear any dangling design-system associations.
    db.transaction(() => {
      db.prepare("DELETE FROM workspace_palettes WHERE workspace_slug = ?").run(
        id,
      );
      db.prepare("DELETE FROM workspace_presets WHERE workspace_slug = ?").run(
        id,
      );
      db.prepare(
        "UPDATE design_systems SET workspace_slug = NULL WHERE workspace_slug = ?",
      ).run(id);
      db.prepare(
        "UPDATE design_systems SET project_slug = NULL WHERE project_slug = ?",
      ).run(id);
      db.prepare(
        "DELETE FROM workspaces WHERE slug = ? AND kind = 'collection'",
      ).run(id);
    })();
  } catch (error) {
    console.error("Failed to delete collection:", error);
    throw error;
  }
}

export function addPaletteToCollection(
  collectionId: string,
  paletteId: string,
): void {
  const db = getDb();
  try {
    db.prepare(
      "INSERT OR IGNORE INTO workspace_palettes (workspace_slug, palette_id) VALUES (?, ?)",
    ).run(collectionId, paletteId);
  } catch (error) {
    console.error("Failed to add palette to collection:", error);
    throw error;
  }
}

export function removePaletteFromCollection(
  collectionId: string,
  paletteId: string,
): void {
  const db = getDb();
  try {
    db.prepare(
      "DELETE FROM workspace_palettes WHERE workspace_slug = ? AND palette_id = ?",
    ).run(collectionId, paletteId);
  } catch (error) {
    console.error("Failed to remove palette from collection:", error);
    throw error;
  }
}

export function getCollectionPalettes(collectionId: string): Palette[] {
  return getWorkspacePalettes(collectionId);
}

// --- History Log ---
export function getPaletteHistory(paletteId: string): HistoryEntry[] {
  const db = getDb();
  try {
    return db
      .prepare(
        "SELECT * FROM palette_history WHERE palette_id = ? ORDER BY timestamp DESC",
      )
      .all(paletteId) as any[];
  } catch (error) {
    console.error("Failed to fetch palette history:", error);
    return [];
  }
}

export function logPaletteHistory(
  paletteId: string,
  action: string,
  changes: any,
): void {
  const db = getDb();
  try {
    db.prepare(
      "INSERT INTO palette_history (palette_id, action, changes_json) VALUES (?, ?, ?)",
    ).run(paletteId, action, JSON.stringify(changes));
  } catch (error) {
    console.error("Failed to log palette history:", error);
  }
}

// --- Workspaces core (shared by Collections + Projects) ---------------------
// A workspace is a named set of palettes with a `kind` discriminator.
// `kind='collection'` is a loose, user-curated bag; `kind='project'` is a
// product workspace whose membership is the union of tag-derived palettes
// (palette_tags where tag_type='project', written by the data pipeline) and
// manual additions in `workspace_palettes`. Project *identity* is still
// data-derived: canonical project names come from those tags, and project
// rows are lazily materialized. A promoted collection is a project-kind row
// with no tag backing — its membership is purely manual.

export type WorkspaceKind = "collection" | "project";

export interface Workspace {
  slug: string;
  kind: WorkspaceKind;
  name: string;
  type: string;
  description: string;
  promoted_at: string | null;
  created_at: string;
}

// Seeded default types for the projects that ship as data (editable in-app).
const PROJECT_TYPE_SEED: Record<string, string> = {
  "wrd-leads-crm": "CRM",
  "signal-scout": "Web App",
};

export function slugifyProject(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Canonical project names, taken from the shipped `project` tags. */
function projectNames(): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT DISTINCT tag_value AS name FROM palette_tags WHERE tag_type = 'project'`,
    )
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

/** Resolve a tag-derived project name by slug (no workspace row required). */
function resolveProjectName(slug: string): string | null {
  return projectNames().find((n) => slugifyProject(n) === slug) ?? null;
}

function getWorkspaceRow(slug: string): Workspace | null {
  const db = getDb();
  const r = db.prepare(`SELECT * FROM workspaces WHERE slug = ?`).get(slug) as
    any | undefined;
  if (!r) return null;
  return {
    slug: r.slug,
    kind: r.kind,
    name: r.name,
    type: r.type ?? "",
    description: r.description ?? "",
    promoted_at: r.promoted_at ?? null,
    created_at: r.created_at,
  };
}

/** Ensure a project-kind workspace row exists (seeded type) and return meta. */
function ensureProjectWorkspace(
  slug: string,
  name: string,
): { type: string; description: string } {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO workspaces (slug, kind, name, type, description)
     VALUES (?, 'project', ?, ?, '')`,
  ).run(slug, name, PROJECT_TYPE_SEED[slug] ?? "Product");
  const row = db
    .prepare(`SELECT type, description FROM workspaces WHERE slug = ?`)
    .get(slug) as
    { type: string | null; description: string | null } | undefined;
  return { type: row?.type ?? "Product", description: row?.description ?? "" };
}

function taggedPaletteIds(name: string): string[] {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT palette_id FROM palette_tags WHERE tag_type = 'project' AND tag_value = ?`,
      )
      .all(name) as { palette_id: string }[]
  ).map((r) => r.palette_id);
}

function manualPaletteIds(slug: string): string[] {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT palette_id FROM workspace_palettes WHERE workspace_slug = ?`,
      )
      .all(slug) as { palette_id: string }[]
  ).map((r) => r.palette_id);
}

/**
 * All palette ids in a workspace. For a project this is the tag-derived set ∪
 * manual additions; for a collection it is just the manual set. Handles a
 * tag-derived project whose row hasn't been materialized yet.
 */
export function getWorkspacePaletteIds(slug: string): string[] {
  const ws = getWorkspaceRow(slug);
  const manual = manualPaletteIds(slug);
  const name = ws?.name ?? resolveProjectName(slug);
  const isProject = ws?.kind === "project" || (!ws && !!name);
  if (isProject && name) {
    return Array.from(new Set([...taggedPaletteIds(name), ...manual]));
  }
  return manual;
}

export function getWorkspacePalettes(slug: string): Palette[] {
  try {
    return stitchByIds(getWorkspacePaletteIds(slug)).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  } catch (error) {
    console.error("Failed to load workspace palettes:", error);
    return [];
  }
}

/** A workspace's display name (materialized row, else tag-derived project). */
export function getWorkspaceName(slug: string): string | null {
  return getWorkspaceRow(slug)?.name ?? resolveProjectName(slug);
}

export interface WorkspaceSummary extends ProjectSummary {
  kind: WorkspaceKind;
}

function summarizeWorkspace(slug: string): WorkspaceSummary | null {
  const db = getDb();
  const name = getWorkspaceName(slug);
  if (!name) return null;
  const ws = getWorkspaceRow(slug);
  const kind: WorkspaceKind = ws?.kind ?? "project";
  const meta =
    kind === "project"
      ? ensureProjectWorkspace(slug, name)
      : { type: ws?.type ?? "", description: ws?.description ?? "" };
  const ids = getWorkspacePaletteIds(slug);
  const firstId = [...ids].sort()[0];
  const preview = firstId
    ? (
        db
          .prepare(
            `SELECT hex FROM palette_colors WHERE palette_id = ? ORDER BY color_index LIMIT 12`,
          )
          .all(firstId) as { hex: string }[]
      ).map((c) => c.hex)
    : [];
  return {
    name,
    slug,
    kind,
    type: meta.type,
    description: meta.description,
    count: ids.length,
    preview,
  };
}

/**
 * List workspaces of a given kind (or all). Projects are enumerated as the
 * union of tag-derived names (lazily materialized) and any project-kind rows
 * (e.g. a promoted collection), so both surface.
 */
export function listWorkspaces(kind?: WorkspaceKind): WorkspaceSummary[] {
  const db = getDb();
  try {
    const slugs = new Set<string>();
    if (kind !== "collection") {
      for (const name of projectNames()) {
        const slug = slugifyProject(name);
        ensureProjectWorkspace(slug, name);
        slugs.add(slug);
      }
    }
    const rows = db
      .prepare(
        kind
          ? `SELECT slug FROM workspaces WHERE kind = ?`
          : `SELECT slug FROM workspaces`,
      )
      .all(...(kind ? [kind] : [])) as { slug: string }[];
    for (const r of rows) slugs.add(r.slug);

    return Array.from(slugs)
      .map((slug) => summarizeWorkspace(slug))
      .filter((w): w is WorkspaceSummary => w !== null)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to list workspaces:", error);
    return [];
  }
}

/** Promote a collection into a project (flip kind, add product metadata). */
export function promoteToProject(
  slug: string,
  type: string,
  description: string,
): void {
  getDb()
    .prepare(
      `UPDATE workspaces
       SET kind = 'project', type = ?, description = ?, promoted_at = CURRENT_TIMESTAMP
       WHERE slug = ? AND kind = 'collection'`,
    )
    .run(type, description, slug);
}

// --- Projects (palettes grouped by the product they were designed for) ------
// A project is a workspace of kind='project'. Membership = the `project`
// palette_tags rows (the "designed-for" set) ∪ manual `workspace_palettes`
// additions. Metadata (type, description) lives in the `workspaces` row; role
// presets in `workspace_presets`. All runtime tables survive sync_palettes.py.

export interface ProjectSummary {
  name: string;
  slug: string;
  type: string;
  description: string;
  count: number;
  preview: string[]; // representative hexes for a color strip
}

export interface ProjectPreset {
  id: string;
  project_slug: string;
  name: string;
  palette_id: string;
  mapping: Record<string, string>;
  created_at: string;
}

export function getProjectName(slug: string): string | null {
  return getWorkspaceName(slug);
}

export function getManualPaletteIds(slug: string): string[] {
  return manualPaletteIds(slug);
}

export function getProjects(): ProjectSummary[] {
  // Projects are workspaces of kind='project' (tag-derived ∪ promoted).
  return listWorkspaces("project").map((w) => ({
    name: w.name,
    slug: w.slug,
    type: w.type,
    description: w.description,
    count: w.count,
    preview: w.preview,
  }));
}

export function getProjectMeta(
  slug: string,
): { type: string; description: string } | null {
  const name = getWorkspaceName(slug);
  if (!name) return null;
  return ensureProjectWorkspace(slug, name);
}

export function updateProjectMeta(
  slug: string,
  type: string,
  description: string,
): void {
  const db = getDb();
  const name = getWorkspaceName(slug);
  if (!name) return;
  ensureProjectWorkspace(slug, name);
  db.prepare(
    `UPDATE workspaces SET type = ?, description = ? WHERE slug = ?`,
  ).run(type, description, slug);
}

export function getProjectPalettes(slug: string): Palette[] {
  return getWorkspacePalettes(slug);
}

export function addPaletteToProject(slug: string, paletteId: string): void {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO workspace_palettes (workspace_slug, palette_id) VALUES (?, ?)`,
  ).run(slug, paletteId);
}

export function removePaletteFromProject(
  slug: string,
  paletteId: string,
): void {
  const db = getDb();
  db.prepare(
    `DELETE FROM workspace_palettes WHERE workspace_slug = ? AND palette_id = ?`,
  ).run(slug, paletteId);
}

// --- Per-workspace role-mapping presets (project_slug aliases workspace_slug) ---
export function getProjectPresets(slug: string): ProjectPreset[] {
  const db = getDb();
  try {
    const rows = db
      .prepare(
        `SELECT * FROM workspace_presets WHERE workspace_slug = ? ORDER BY created_at DESC`,
      )
      .all(slug) as any[];
    return rows.map((r) => ({
      id: r.id,
      project_slug: r.workspace_slug,
      name: r.name,
      palette_id: r.palette_id,
      mapping: JSON.parse(r.mapping_json),
      created_at: r.created_at,
    }));
  } catch (error) {
    console.error("Failed to load project presets:", error);
    return [];
  }
}

export function createProjectPreset(
  slug: string,
  name: string,
  paletteId: string,
  mapping: Record<string, string>,
): string {
  const db = getDb();
  const id = `${slug}-${slugifyProject(name)}-${paletteId}`.slice(0, 120);
  db.prepare(
    `INSERT OR REPLACE INTO workspace_presets (id, workspace_slug, name, palette_id, mapping_json)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, slug, name, paletteId, JSON.stringify(mapping));
  return id;
}

export function deleteProjectPreset(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM workspace_presets WHERE id = ?`).run(id);
}

/* ------------------------------------------------------------------ *
 * Design systems — full, reusable Brand System artifacts.            *
 * Standalone; a nullable project_slug optionally associates one with *
 * a project. Columns carry queryable fields; system_json holds the   *
 * editable payload (inputs + tokens + preset + mode).                *
 * ------------------------------------------------------------------ */

function rowToSavedSystem(r: any): SavedDesignSystem {
  const j = JSON.parse(r.system_json);
  return {
    id: r.id,
    name: r.name,
    paletteId: r.palette_id ?? undefined,
    // Prefer the unified workspace_slug; fall back to the dormant legacy column.
    projectSlug: r.workspace_slug ?? r.project_slug ?? null,
    inputs: j.inputs,
    tokens: j.tokens,
    presetId: j.presetId,
    mode: j.mode,
    composed: j.composed ?? false,
    assignments: j.assignments ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listDesignSystems(projectSlug?: string): SavedDesignSystem[] {
  const db = getDb();
  try {
    const rows = (
      projectSlug
        ? db
            .prepare(
              `SELECT * FROM design_systems WHERE COALESCE(workspace_slug, project_slug) = ? ORDER BY updated_at DESC`,
            )
            .all(projectSlug)
        : db
            .prepare(`SELECT * FROM design_systems ORDER BY updated_at DESC`)
            .all()
    ) as any[];
    return rows.map(rowToSavedSystem);
  } catch (error) {
    console.error("Failed to load design systems:", error);
    return [];
  }
}

export function getDesignSystem(id: string): SavedDesignSystem | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM design_systems WHERE id = ?`)
    .get(id) as any;
  return row ? rowToSavedSystem(row) : null;
}

/** Upsert a design system (Save for new, Update for existing). Returns saved. */
export function saveDesignSystem(rec: SavedDesignSystem): SavedDesignSystem {
  const db = getDb();
  const id =
    rec.id ||
    `ds-${slugifyProject(rec.name) || "system"}-${Date.now().toString(36)}`;
  const systemJson = JSON.stringify({
    inputs: rec.inputs,
    tokens: rec.tokens,
    presetId: rec.presetId,
    mode: rec.mode,
    // Composer artifacts (optional; absent on single-palette systems).
    composed: rec.composed ?? false,
    assignments: rec.assignments ?? null,
  });
  // ON CONFLICT preserves created_at and bumps updated_at. The association is
  // dual-written to workspace_slug (unified) and project_slug (dormant legacy)
  // so a rollback still sees it; Phase 3 drops the legacy column.
  db.prepare(
    `INSERT INTO design_systems (id, name, palette_id, workspace_slug, project_slug, system_json, updated_at)
     VALUES (@id, @name, @palette_id, @slug, @slug, @system_json, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       palette_id = excluded.palette_id,
       workspace_slug = excluded.workspace_slug,
       project_slug = excluded.project_slug,
       system_json = excluded.system_json,
       updated_at = CURRENT_TIMESTAMP`,
  ).run({
    id,
    name: rec.name,
    palette_id: rec.paletteId ?? null,
    slug: rec.projectSlug ?? null,
    system_json: systemJson,
  });
  return getDesignSystem(id)!;
}

export function renameDesignSystem(id: string, name: string): void {
  getDb()
    .prepare(
      `UPDATE design_systems SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(name, id);
}

export function duplicateDesignSystem(id: string): SavedDesignSystem | null {
  const existing = getDesignSystem(id);
  if (!existing) return null;
  return saveDesignSystem({
    ...existing,
    id: "", // force a fresh id
    name: `${existing.name} copy`,
  });
}

/** Attach a design system to any workspace (collection or project), or null. */
export function setDesignSystemWorkspace(
  id: string,
  workspaceSlug: string | null,
): void {
  // Dual-write during the transition (see saveDesignSystem).
  getDb()
    .prepare(
      `UPDATE design_systems
       SET workspace_slug = ?, project_slug = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .run(workspaceSlug, workspaceSlug, id);
}

/** Back-compat alias — project association is now a workspace association. */
export function setDesignSystemProject(
  id: string,
  projectSlug: string | null,
): void {
  setDesignSystemWorkspace(id, projectSlug);
}

export function deleteDesignSystem(id: string): void {
  getDb().prepare(`DELETE FROM design_systems WHERE id = ?`).run(id);
}
