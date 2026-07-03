#!/usr/bin/env python3
"""
sync_palettes.py — propagate the canonical palette dataset to every consumer.

Single source of truth: ``generated/`` (``palettes.json`` + ``palettes.db``).
This is the complete union of every palette (curated SCSS palettes + procedurally
generated ones). Running this script rebuilds the deployed app's local dataset
from it so the two never drift.

Targets (nothing is deleted; only regenerated):
  * web-showcase/src/data/palettes.json   (imported by client components)
  * web-showcase/src/data/palettes.db      (homepage grid + FTS search)
      - only the CONTENT tables are replaced; the app's runtime tables
        (collections, favorites, palette_history, role_mappings) are preserved.

The curated SCSS library remains the subset of palettes that have real ``.scss``
source files and is maintained by ``build_index.py`` (the retired static gallery
now lives in ``archive/showcase/``). Every curated palette also lives in
``generated/``.
"""

import json
import os
import sqlite3
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_JSON = os.path.join(ROOT, "generated", "palettes.json")
SRC_DB = os.path.join(ROOT, "generated", "palettes.db")

WS_DIR = os.path.join(ROOT, "web-showcase", "src", "data")
WS_JSON = os.path.join(WS_DIR, "palettes.json")
WS_DB = os.path.join(WS_DIR, "palettes.db")

CONTENT_TABLES = ["palette_colors", "palette_tags", "palette_stats", "palettes"]


def sync_json() -> int:
    with open(SRC_JSON, encoding="utf-8") as f:
        data = json.load(f)
    # Match the deployed file's compact style to keep diffs minimal.
    with open(WS_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    return len(data)


def sync_db() -> int:
    if not os.path.exists(WS_DB):
        # No local seed yet: just copy the canonical db wholesale.
        import shutil

        shutil.copyfile(SRC_DB, WS_DB)
    conn = sqlite3.connect(WS_DB)
    try:
        conn.execute("PRAGMA foreign_keys = OFF")
        conn.execute("ATTACH DATABASE ? AS src", (SRC_DB,))
        conn.execute("BEGIN")
        # Replace content tables (children first), preserving runtime tables.
        for t in CONTENT_TABLES:
            conn.execute(f"DELETE FROM {t}")
        conn.execute("INSERT INTO palettes SELECT * FROM src.palettes")
        conn.execute("INSERT INTO palette_colors SELECT * FROM src.palette_colors")
        conn.execute("INSERT INTO palette_tags SELECT * FROM src.palette_tags")
        conn.execute("INSERT INTO palette_stats SELECT * FROM src.palette_stats")
        # Rebuild the FTS index deterministically from the content tables.
        conn.execute("DELETE FROM palettes_fts")
        conn.execute(
            """
            INSERT INTO palettes_fts (id, name, description, category, tags)
            SELECT p.id, p.name, p.description, p.category,
                   COALESCE((SELECT group_concat(lower(t.tag_value), ' ')
                             FROM palette_tags t WHERE t.palette_id = p.id), '')
            FROM palettes p
            """
        )
        conn.execute("COMMIT")
        conn.execute("DETACH DATABASE src")
        count = conn.execute("SELECT COUNT(*) FROM palettes").fetchone()[0]
        return count
    finally:
        conn.close()


def main() -> int:
    if not os.path.exists(SRC_JSON) or not os.path.exists(SRC_DB):
        print(f"[ERROR] Canonical dataset not found in {os.path.dirname(SRC_JSON)}")
        return 1
    n_json = sync_json()
    n_db = sync_db()
    print(f"[OK] Synced web-showcase JSON  ({n_json} palettes)")
    print(f"[OK] Synced web-showcase DB    ({n_db} palettes, FTS rebuilt)")
    if n_json != n_db:
        print(f"[WARN] JSON/DB counts differ ({n_json} vs {n_db})")
        return 1
    print("[DONE] web-showcase is in sync with generated/ (single source of truth).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
