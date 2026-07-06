#!/usr/bin/env python3
"""
enrich_palettes.py — quality passes over the canonical palette dataset.

Operates on ``generated/palettes.json`` (the single source of truth), applies a
series of enrichment passes, then rebuilds the derived content tables in
``generated/palettes.db`` so JSON and DB stay consistent. Run ``sync_palettes.py``
afterwards to propagate everything to the deployed app.

Passes
------
  1. Accessibility metadata  -> palette["accessibility"]  (WCAG pairs, roles, ui-readiness)
  2. Distinctive color names -> palette["colors"][*]["name"]  (rich corpus, protects design tokens)
  3. Category cleanup        -> palette["category"], palette["source"]  (strip "Procedural ")
  4. Description rewrite      -> palette["description"]  (replace templated "inspired by" filler)
  5. Palette kind            -> palette["kind"]  (palette / extended / collection)
  6. Derived attributes      -> palette["derived"]  (hue family, temperature, harmony, sort key)
  +  Path normalization: strip leaked absolute machine paths to repo-relative.

Every colour formula mirrors web-showcase/src/utils/{contrast-utils,palette-metrics,
role-mapping}.ts so precomputed values match what the app computes at runtime.

The color-name corpus (``color-names.csv``) is the curated "best of" list from
meodai/color-name-list (https://github.com/meodai/color-names, MIT) — recognizable
names only. Idempotent: safe to re-run.

Color names are only re-derived for procedural/systematic palettes (where the
repetitive xkcd nearest-match vocabulary lives). Curated palettes keep their
hand-picked names, and design-token names (Primary, Bg Canvas, …) are protected.

Usage:
  python enrich_palettes.py            # enrich JSON + rebuild generated/palettes.db
  python enrich_palettes.py --dry-run  # report + write nothing (prints before/after samples)
"""

import argparse
import csv
import json
import math
import os
import re
import sqlite3
import sys
from collections import Counter, defaultdict

import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_JSON = os.path.join(ROOT, "generated", "palettes.json")
SRC_DB = os.path.join(ROOT, "generated", "palettes.db")
CORPUS = os.path.join(ROOT, "color-names.csv")

# Repo-root prefix (any slash flavour) that leaked into some absolute `path` values.
ABS_PREFIX_RE = re.compile(re.escape(ROOT).replace(r"\ ", " ").replace("\\\\", "[\\\\/]") + r"[\\/]")

SYSTEMATIC_CATS = {"Web Development System", "Singular Hue Span", "Multi Color Composition"}

# ── colour math (mirrors contrast-utils.ts) ──────────────────────────────────


def _rgb(hexstr):
    c = hexstr.lstrip("#")
    if len(c) in (3, 4):
        c = "".join(ch * 2 for ch in c)
    return int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)


def luminance(hexstr):
    r, g, b = (v / 255 for v in _rgb(hexstr))
    lin = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return lin(r) * 0.2126 + lin(g) * 0.7152 + lin(b) * 0.0722


def contrast_ratio(a, b):
    l1, l2 = luminance(a), luminance(b)
    ratio = (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)
    return round(ratio * 100) / 100


def hex_to_hsl(hexstr):
    r, g, b = (v / 255 for v in _rgb(hexstr))
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2
    h = s = 0.0
    if mx != mn:
        d = mx - mn
        s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
        if mx == r:
            h = ((g - b) / d + (6 if g < b else 0)) / 6
        elif mx == g:
            h = ((b - r) / d + 2) / 6
        else:
            h = ((r - g) / d + 4) / 6
    return round(h * 360), round(s * 100), round(l * 100)


def chroma(hexstr):
    _, s, l = hex_to_hsl(hexstr)
    return s * (1 - abs(l - 50) / 50)


def wcag_level(ratio):
    if ratio >= 7:
        return "AAA"
    if ratio >= 4.5:
        return "AA"
    if ratio >= 3:
        return "AA-Large"
    return "Fail"


# ── hue families ─────────────────────────────────────────────────────────────

FAMILY_BANDS = [
    ("Red", 345, 360), ("Red", 0, 15), ("Orange", 15, 45), ("Yellow", 45, 70),
    ("Green", 70, 160), ("Cyan", 160, 195), ("Blue", 195, 255),
    ("Purple", 255, 290), ("Magenta", 290, 345),
]
FAMILY_ORDER = ["Red", "Orange", "Yellow", "Green", "Cyan", "Blue", "Purple", "Magenta", "Neutral"]


def hue_family(hue):
    for name, lo, hi in FAMILY_BANDS:
        if lo <= hue < hi:
            return name
    return "Red"


# ── pass 2 helpers: protected design tokens ──────────────────────────────────

SEMANTIC_TOKENS = {
    "bg canvas", "bg surface", "bg elevated", "bg overlay", "border subtle",
    "border strong", "text muted", "text base", "text strong", "text inverse",
    "primary", "primary hover", "secondary", "secondary hover", "accent",
    "accent soft", "success", "warning", "danger", "error", "info", "link",
    "focus ring", "surface", "background", "foreground", "muted",
}
SCALE_RE = re.compile(r"^(neutral|support|gray|grey|shade|tint|step|swatch|color|primary|secondary|accent)\s*\d+$", re.I)
TOKEN_PREFIX_RE = re.compile(r"^(bg|fg|text|border|surface|focus)\b", re.I)


def is_protected_name(name):
    n = name.strip().lower()
    return n in SEMANTIC_TOKENS or bool(SCALE_RE.match(name)) or bool(TOKEN_PREFIX_RE.match(name))


# ── pass 2: rich colour naming (vectorised nearest-match in CIE-Lab) ──────────


def _labs(hex_list):
    a = np.array([_rgb(h) for h in hex_list], dtype=np.float64) / 255.0
    m = a <= 0.04045
    a = np.where(m, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    r, g, b = a[:, 0], a[:, 1], a[:, 2]
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    fx, fy, fz = f(x), f(y), f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], axis=1)


def build_name_lookup(unique_hexes, top_k=3):
    """Return {hex: [name1, name2, name3]} nearest corpus names by Lab ΔE."""
    names, chexes = [], []
    with open(CORPUS, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            names.append(row["name"])
            chexes.append(row["hex"])
    anchors = _labs(chexes)
    a2 = (anchors ** 2).sum(1)  # (A,)
    pts = _labs(unique_hexes)
    out = {}
    step = 1000
    for s in range(0, len(unique_hexes), step):
        chunk = pts[s : s + step]
        # squared euclidean via |p|^2 + |a|^2 - 2 p·a
        d = (chunk ** 2).sum(1)[:, None] + a2[None, :] - 2 * chunk @ anchors.T
        part = np.argpartition(d, top_k, axis=1)[:, :top_k]
        for i, hx in enumerate(unique_hexes[s : s + step]):
            cand = part[i]
            cand = cand[np.argsort(d[i, cand])]
            out[hx] = [names[j] for j in cand]
    return out


# ── pass 6: harmony classification ───────────────────────────────────────────


# representative center angle of each hue family, for measuring separation
_FAMILY_CENTER = {
    "Red": 0, "Orange": 30, "Yellow": 57, "Green": 115,
    "Cyan": 177, "Blue": 225, "Purple": 272, "Magenta": 317,
}


def _circ(a, b):
    d = abs(a - b) % 360
    return min(d, 360 - d)


def classify_harmony(hues, sats):
    """Classify by the set of distinct hue families present (no chaining)."""
    fams = {hue_family(h) for h, s in zip(hues, sats) if s >= 12}
    k = len(fams)
    if k == 0:
        return "neutral"
    if k == 1:
        return "monochromatic"
    centers = [_FAMILY_CENTER[f] for f in fams]
    if k == 2:
        return "complementary" if _circ(centers[0], centers[1]) >= 120 else "analogous"
    if k == 3:
        # triadic if roughly evenly spaced, otherwise a run of neighbours
        return "triadic" if min(_circ(a, b) for i, a in enumerate(centers)
                                 for b in centers[i + 1:]) >= 90 else "analogous"
    if k == 4:
        return "tetradic"
    return "polychrome"


# ── pass 4: description generator ────────────────────────────────────────────

_FILLER_TEMPLATE_RE = re.compile(
    r"^a (vibrant|diverse|bold|calm|modern|soft|warm|cool|rich|deep)?\s*\d+[- ]colou?r "
    r"(palette|composition)\b", re.I)


def is_filler_description(desc):
    d = (desc or "").strip()
    if not d:
        return True
    low = d.lower()
    if "inspired by" in low:
        return True
    if "broad creative and ui exploration" in low:
        return True
    if _FILLER_TEMPLATE_RE.match(low):
        return True
    if len(d.split()) <= 3:  # "Autonomous expansion." / "Signal Scout targeting."
        return True
    return False


def _hue_phrase(families):
    chroma_fams = [f for f in families if f != "Neutral"]
    words = {
        "Red": "reds", "Orange": "oranges", "Yellow": "yellows", "Green": "greens",
        "Cyan": "teals", "Blue": "blues", "Purple": "purples", "Magenta": "magentas",
    }
    parts = [words[f] for f in chroma_fams if f in words]
    if not parts:
        return "neutral tones"
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return f"{parts[0]} and {parts[1]}"
    return ", ".join(parts[:-1]) + f", and {parts[-1]}"


def generate_description(count, kind, temp, sat_profile, families, harmony, contrast_word, seed):
    hue = _hue_phrase(families)
    # distinct word from the temperature axis so "balanced, balanced" never happens
    sat = {"muted": "muted", "balanced": "even-toned", "vibrant": "vibrant"}[sat_profile]
    harmony_clause = {
        "monochromatic": "a monochromatic build",
        "analogous": "an analogous range",
        "complementary": "a complementary pairing",
        "triadic": "a triadic spread",
        "tetradic": "a four-way split",
        "polychrome": "a broad, polychrome mix",
        "neutral": "a restrained, neutral feel",
    }[harmony]
    skeletons = [
        f"{temp.capitalize()}, {sat} {hue} across {count} tones — a {kind} with {contrast_word} and {harmony_clause}.",
        f"A {count}-color {kind} of {sat} {hue}; {temp} in feel, with {contrast_word}.",
        f"{hue.capitalize()} anchor this {temp} {count}-color {kind}, held together by {harmony_clause} and {contrast_word}.",
        f"{sat.capitalize()} {hue} in {harmony_clause} — a {temp} {count}-color {kind} with {contrast_word}.",
    ]
    return skeletons[seed % len(skeletons)]


# ── main enrichment ──────────────────────────────────────────────────────────


def enrich(palettes):
    stats = Counter()

    # -- provenance + category cleanup (pass 3) + path normalisation + kind (5)
    for p in palettes:
        cat = p.get("category", "") or ""
        author = p.get("author", "") or ""
        if cat.startswith("Procedural ") or author == "PaletteAgent":
            source = "procedural"
        elif cat in SYSTEMATIC_CATS:
            source = "systematic"
        else:
            source = "curated"
        if cat.startswith("Procedural "):
            p["category"] = cat[len("Procedural "):]
            stats["category_renamed"] += 1
        p["source"] = source

        path = p.get("path", "") or ""
        newpath = ABS_PREFIX_RE.sub("", path).replace("\\", "/")
        if newpath != path:
            p["path"] = newpath
            stats["path_normalised"] += 1

        n = p.get("count", len(p.get("colors", [])))
        p["kind"] = "palette" if n <= 12 else "extended" if n <= 20 else "collection"

    # -- color names (pass 2): re-derive only for procedural/systematic palettes
    # (curated palettes keep their hand-picked names); protect design tokens.
    rename_sources = {"procedural", "systematic"}
    all_hexes = sorted({c["hex"][:7].lower() for p in palettes
                        if p["source"] in rename_sources for c in p["colors"]})
    lookup = build_name_lookup(all_hexes) if all_hexes else {}
    for p in palettes:
        if p["source"] not in rename_sources:
            stats["name_kept_curated"] += len(p["colors"])
            continue
        used = {}  # hex -> chosen name (so identical hexes stay identical)
        chosen_names = set()
        for c in p["colors"]:
            if is_protected_name(c["name"]):
                stats["name_protected"] += 1
                chosen_names.add(c["name"])
                continue
            hx = c["hex"][:7].lower()
            if hx in used:
                new = used[hx]
            else:
                cands = lookup.get(hx, [c["name"]])
                new = next((x for x in cands if x not in chosen_names), cands[0])
                used[hx] = new
            chosen_names.add(new)
            if new != c["name"]:
                stats["name_changed"] += 1
            c["name"] = new

    # -- accessibility (1) + derived (6) + descriptions (4)
    for p in palettes:
        hexes = [c["hex"][:7] for c in p["colors"]]
        lums = [luminance(h) for h in hexes]
        hsls = [hex_to_hsl(h) for h in hexes]
        hues = [h for h, s, l in hsls]
        sats = [s for h, s, l in hsls]
        chromas = [chroma(h) for h in hexes]
        n = len(hexes)

        min_l, max_l = min(lums), max(lums)
        contrast_range = round((max_l + 0.05) / (min_l + 0.05), 2)
        avg_lum = sum(lums) / n
        avg_sat = sum(sats) / n

        aa = aaa = total = 0
        best = (0.0, hexes[0], hexes[0])
        for i in range(n):
            for j in range(i + 1, n):
                total += 1
                r = contrast_ratio(hexes[i], hexes[j])
                if r >= 4.5:
                    aa += 1
                if r >= 7:
                    aaa += 1
                if r > best[0]:
                    lighter, darker = (hexes[i], hexes[j]) if lums[i] >= lums[j] else (hexes[j], hexes[i])
                    best = (r, lighter, darker)
        wcag_pass_rate = (aa / total) if total else 0.0

        # roles (compact mirror of buildRoleMapping)
        order = sorted(range(n), key=lambda i: lums[i])  # dark -> light
        median_lum = lums[order[len(order) // 2]]
        light_theme = median_lum >= 0.35
        bg_i = order[-1] if light_theme else order[0]
        surface_pool = order[::-1] if light_theme else order
        surface_i = surface_pool[min(1, n - 1)]
        canvas = hexes[bg_i]
        text_i = max(range(n), key=lambda i: contrast_ratio(hexes[i], canvas))
        accent_i = max(range(n), key=lambda i: chromas[i])

        # structure / temperature (mirror palette-metrics)
        anchor = hues[0] if hues else 0
        hue_spread = max((min(abs(h - anchor), 360 - abs(h - anchor)) for h in hues), default=0)
        structure = "single-span" if hue_spread <= 26 else "multi-hue"
        sat_profile = "muted" if avg_sat < 38 else "vibrant" if avg_sat > 64 else "balanced"
        warm = cool = 0
        for h, s in zip(hues, sats):
            if s < 20:
                continue
            if (0 <= h <= 70) or h >= 330:
                warm += 1
            elif 160 <= h <= 280:
                cool += 1
        temperature = "warm" if warm > cool * 1.35 else "cool" if cool > warm * 1.35 else "balanced"

        ui_readiness = round(max(0, min(100,
            30 * wcag_pass_rate
            + 25 * min(1, contrast_range / 9)
            + 20 * (1 - min(1, abs(avg_lum - 0.5) / 0.5))
            + 15 * min(1, avg_sat / 70)
            + 10 * (1 if structure == "multi-hue" else 0.8))))

        # dominant hue family: most common family among chromatic colours, chroma-weighted
        fam_weight = defaultdict(float)
        for h, ch in zip(hues, chromas):
            if ch >= 10:
                fam_weight[hue_family(h)] += ch
        if fam_weight:
            dominant_family = max(fam_weight, key=fam_weight.get)
        else:
            dominant_family = "Neutral"
        families_present = [f for f in FAMILY_ORDER if f != "Neutral" and f in fam_weight]
        if not families_present:
            families_present = ["Neutral"]
        harmony = classify_harmony(hues, sats)

        sort_key = FAMILY_ORDER.index(dominant_family) * 1000 + (255 - round(avg_lum * 255))

        p["accessibility"] = {
            "uiReadiness": ui_readiness,
            "wcagPassRate": round(wcag_pass_rate, 3),
            "contrastRange": contrast_range,
            "aaPairs": aa,
            "aaaPairs": aaa,
            "totalPairs": total,
            "hasAccessibleText": aa > 0,
            "bestTextPair": {
                "background": best[1], "text": best[2],
                "ratio": round(best[0], 2), "level": wcag_level(best[0]),
            },
            "roles": {
                "background": hexes[bg_i], "surface": hexes[surface_i],
                "text": hexes[text_i], "accent": hexes[accent_i],
            },
        }
        p["derived"] = {
            "hueFamily": dominant_family,
            "hueFamilies": families_present,
            "temperature": temperature,
            "harmony": harmony,
            "structure": structure,
            "saturationProfile": sat_profile,
            "averageLuminance": round(avg_lum, 3),
            "averageSaturation": round(avg_sat, 1),
            "sortKey": sort_key,
        }

        # description rewrite (pass 4) — replace generic/templated filler only
        if is_filler_description(p.get("description", "")):
            if contrast_range >= 8 and aaa > 0:
                contrast_word = "bold, high contrast"
            elif contrast_range < 3:
                contrast_word = "soft, low contrast"
            else:
                contrast_word = "balanced contrast"
            seed = sum(ord(ch) for ch in p["id"])
            p["description"] = generate_description(
                n, p["kind"], temperature, sat_profile, families_present, harmony, contrast_word, seed)
            stats["description_rewritten"] += 1

    return stats


# ── DB rebuild (generated/palettes.db content tables + FTS) ───────────────────


def rebuild_db(palettes):
    conn = sqlite3.connect(SRC_DB)
    try:
        conn.execute("PRAGMA foreign_keys = OFF")
        conn.execute("BEGIN")
        for t in ("palette_colors", "palette_tags", "palette_stats", "palettes"):
            conn.execute(f"DELETE FROM {t}")

        for p in palettes:
            pid = p["id"]
            conn.execute(
                "INSERT INTO palettes (id,name,category,color_count,description,author,version,path,created,updated)"
                " VALUES (?,?,?,?,?,?,?,?,?,?)",
                (pid, p["name"], p.get("category"), p.get("count", len(p["colors"])),
                 p.get("description"), p.get("author"), p.get("version"), p.get("path"),
                 p.get("created"), p.get("updated")),
            )
            for idx, c in enumerate(p["colors"]):
                r, g, b = _rgb(c["hex"])
                h, s, l = hex_to_hsl(c["hex"])
                conn.execute(
                    "INSERT INTO palette_colors (palette_id,color_index,name,hex,r,g,b,h,s,l)"
                    " VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (pid, idx, c["name"], c["hex"], r, g, b, h, s, l),
                )

            # tags: original mood/aesthetic + new derived facets (searchable via FTS)
            tags = p.get("tags", {}) or {}
            rows = []
            if isinstance(tags, dict):
                for tv in tags.get("mood", []):
                    rows.append(("mood", tv))
                for tv in tags.get("aesthetic", []):
                    rows.append(("aesthetic", tv))
            d, acc = p["derived"], p["accessibility"]
            rows += [
                ("hue", d["hueFamily"].lower()),
                ("temperature", d["temperature"]),
                ("harmony", d["harmony"]),
                ("kind", p["kind"]),
                ("source", p["source"]),
            ]
            if acc["hasAccessibleText"]:
                rows.append(("accessibility", "accessible-text"))
            if acc["aaaPairs"] > 0:
                rows.append(("accessibility", "aaa"))
            if "qualityScore" in p:
                q = p["qualityScore"]
                rows.append(("quality", "high" if q >= 70 else "medium" if q >= 45 else "low"))
            if p.get("project"):
                rows.append(("project", p["project"]))
            for tt, tv in rows:
                conn.execute(
                    "INSERT INTO palette_tags (palette_id,tag_type,tag_value) VALUES (?,?,?)",
                    (pid, tt, tv))

            conn.execute(
                "INSERT INTO palette_stats (palette_id,average_luminance,contrast_range,dominant_hue,vibrancy_score)"
                " VALUES (?,?,?,?,?)",
                (pid, d["averageLuminance"], acc["contrastRange"],
                 FAMILY_ORDER.index(d["hueFamily"]), d["averageSaturation"]),
            )

        # rebuild FTS deterministically (also fixes any stale index)
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
        return conn.execute("SELECT COUNT(*) FROM palettes").fetchone()[0]
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report only; write nothing")
    args = ap.parse_args()

    if not os.path.exists(SRC_JSON) or not os.path.exists(CORPUS):
        print("[ERROR] missing generated/palettes.json or color-names.csv")
        return 1

    with open(SRC_JSON, encoding="utf-8") as f:
        palettes = json.load(f)

    before = [dict(id=p["id"], desc=p.get("description", ""),
                   colors=[c["name"] for c in p["colors"]], cat=p.get("category")) for p in palettes[:0]]

    stats = enrich(palettes)

    print(f"[enrich] {len(palettes)} palettes")
    for k in sorted(stats):
        print(f"   {k:22} {stats[k]}")

    if args.dry_run:
        print("\n[dry-run] no files written. sample rewrites:")
        shown = 0
        for p in palettes:
            if shown >= 4:
                break
            print(f"  - {p['name']!r} [{p['category']}/{p['source']}/{p['kind']}]")
            print(f"      desc: {p['description'][:100]}")
            print(f"      colours: {[c['name'] for c in p['colors']][:6]}")
            print(f"      derived: hue={p['derived']['hueFamily']} temp={p['derived']['temperature']}"
                  f" harmony={p['derived']['harmony']}  ui={p['accessibility']['uiReadiness']}"
                  f" bestPair={p['accessibility']['bestTextPair']['ratio']}({p['accessibility']['bestTextPair']['level']})")
            shown += 1
        return 0

    with open(SRC_JSON, "w", encoding="utf-8") as f:
        json.dump(palettes, f, ensure_ascii=False, indent=4)
    print(f"[OK] wrote {SRC_JSON}")

    n = rebuild_db(palettes)
    print(f"[OK] rebuilt generated/palettes.db content tables + FTS ({n} palettes)")
    print("[DONE] now run: python sync_palettes.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
