#!/usr/bin/env python3
"""
refine_palettes.py — second-stage structural quality passes over the dataset.

Where ``enrich_palettes.py`` computes *metadata* (accessibility, derived, names,
descriptions), this script changes the *content*: it prunes near-duplicates,
fixes unusable palettes, cleans display order, consolidates the category tail,
freshens formulaic procedural names, and assigns a quality score. It then re-runs
the enrichment recompute + DB rebuild from ``enrich_palettes`` so all derived
metadata reflects the refined content.

Passes
------
  #6  Prune perceptual near-duplicates (CIE-Lab ΔE within size groups)
  #3  Remediate palettes with no readable text pair (minimal lightness nudge)
  #4  Reorder colors by luminance for clean ramps (procedural palettes only)
  low Fix within-palette duplicate colors; backfill missing mood/aesthetic tags
  #1  Consolidate the category long tail (count <= 9) into a canonical taxonomy
  #5  Regenerate formulaic procedural palette names (evocative + unique)
  #2  Composite quality score (0-100) for ranking

Systematic palettes (Web Development System / Singular Hue Span / Multi Color
Composition) keep their semantic color order and categories. Curated palettes
keep their author-chosen order and names. Everything is git-reversible; run with
--dry-run first to review before writing.

Usage:
  python refine_palettes.py --dry-run
  python refine_palettes.py            # writes JSON + rebuilds generated/palettes.db
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict

import numpy as np

import enrich_palettes as ep

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_JSON = os.path.join(ROOT, "generated", "palettes.json")

# ── small color helpers (build on enrich_palettes) ───────────────────────────


def hsl_to_hex(h, s, l, alpha="ff"):
    h, s, l = h / 360.0, s / 100.0, l / 100.0
    if s == 0:
        r = g = b = l
    else:
        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q

        def hue2rgb(t):
            t %= 1
            if t < 1 / 6:
                return p + (q - p) * 6 * t
            if t < 1 / 2:
                return q
            if t < 2 / 3:
                return p + (q - p) * (2 / 3 - t) * 6
            return p

        r, g, b = hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)
    return "#" + "".join(f"{round(v * 255):02x}" for v in (r, g, b)) + alpha


def max_pair_ratio(hexes):
    best = 0.0
    for i in range(len(hexes)):
        for j in range(i + 1, len(hexes)):
            r = ep.contrast_ratio(hexes[i], hexes[j])
            if r > best:
                best = r
    return best


# ── pass #6: prune near-duplicates ───────────────────────────────────────────

SOURCE_RANK = {"curated": 0, "systematic": 1, "procedural": 2}


def _palette_source(p):
    cat = p.get("category", "") or ""
    if cat.startswith("Procedural ") or p.get("author") == "PaletteAgent":
        return "procedural"
    if cat in ep.SYSTEMATIC_CATS:
        return "systematic"
    return "curated"


def prune_near_duplicates(palettes, mean_thresh=3.0, max_thresh=6.0):
    by_count = defaultdict(list)
    for idx, p in enumerate(palettes):
        by_count[len(p["colors"])].append(idx)

    # sorted-by-L Lab signature per palette
    sig = {}
    for idx, p in enumerate(palettes):
        lab = ep._labs([c["hex"][:7] for c in p["colors"]])
        sig[idx] = lab[np.argsort(lab[:, 0])]

    parent = {i: i for i in range(len(palettes))}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    for cnt, idxs in by_count.items():
        for a in range(len(idxs)):
            for b in range(a + 1, len(idxs)):
                ia, ib = idxs[a], idxs[b]
                delta = np.sqrt(((sig[ia] - sig[ib]) ** 2).sum(1))
                if delta.mean() < mean_thresh and delta.max() < max_thresh:
                    union(ia, ib)

    clusters = defaultdict(list)
    for i in range(len(palettes)):
        clusters[find(i)].append(i)

    remove = set()
    examples = []
    for members in clusters.values():
        if len(members) < 2:
            continue
        # keep best: curated first, then more colors, then lexicographic id
        keep = min(members, key=lambda i: (SOURCE_RANK[_palette_source(palettes[i])],
                                           -len(palettes[i]["colors"]), palettes[i]["id"]))
        for i in members:
            if i != keep:
                remove.add(i)
        if len(examples) < 6:
            examples.append((palettes[keep]["name"],
                             [palettes[i]["name"] for i in members if i != keep]))
    kept = [p for i, p in enumerate(palettes) if i not in remove]
    return kept, len(remove), examples


# ── pass #3: remediate unreadable palettes ───────────────────────────────────


def remediate(palettes, target=4.6):
    fixed = 0
    samples = []
    for p in palettes:
        hexes = [c["hex"][:7] for c in p["colors"]]
        if max_pair_ratio(hexes) >= 4.5:
            continue
        lums = [ep.luminance(h) for h in hexes]
        di = min(range(len(hexes)), key=lambda i: lums[i])  # darkest
        li = max(range(len(hexes)), key=lambda i: lums[i])  # lightest
        before = ep.contrast_ratio(hexes[di], hexes[li])
        dark, light = p["colors"][di], p["colors"][li]
        dh, ds, dl = ep.hex_to_hsl(dark["hex"][:7])
        lh, ls, ll = ep.hex_to_hsl(light["hex"][:7])
        da = dark["hex"][7:] or "ff"
        la = light["hex"][7:] or "ff"
        # push the two apart in lightness, minimally, until we clear the target
        for _ in range(60):
            if ep.contrast_ratio(dark["hex"][:7], light["hex"][:7]) >= target:
                break
            if dl > 0:
                dl = max(0, dl - 2)
                dark["hex"] = hsl_to_hex(dh, ds, dl, da)
            if ll < 100:
                ll = min(100, ll + 2)
                light["hex"] = hsl_to_hex(lh, ls, ll, la)
        # Names are left to the enrich() recompute (which re-derives procedural/
        # systematic names); curated palettes keep their hand-picked names.
        after = ep.contrast_ratio(dark["hex"][:7], light["hex"][:7])
        fixed += 1
        if len(samples) < 6:
            samples.append((p["name"], round(before, 2), round(after, 2)))
    return fixed, samples


# ── pass #4: reorder colors (procedural only) ────────────────────────────────


def reorder(palettes):
    changed = 0
    for p in palettes:
        if _palette_source(p) != "procedural":
            continue
        cols = p["colors"]
        ordered = sorted(cols, key=lambda c: ep.luminance(c["hex"][:7]))
        if [c["hex"] for c in ordered] != [c["hex"] for c in cols]:
            p["colors"] = ordered
            changed += 1
    return changed


# ── low-value: dup colors within palette + tag backfill ──────────────────────


def fix_within_dups(palettes):
    fixed = 0
    for p in palettes:
        seen = {}
        for c in p["colors"]:
            key = c["hex"][:7].lower()
            if key in seen:
                h, s, l = ep.hex_to_hsl(c["hex"][:7])
                l = min(100, l + 4) if l < 96 else max(0, l - 4)
                c["hex"] = hsl_to_hex(h, s, l, c["hex"][7:] or "ff")
                fixed += 1
            seen[c["hex"][:7].lower()] = True
    return fixed


# ── pass #1: category consolidation ──────────────────────────────────────────

# theme keyword -> canonical category, checked in priority order (distinctive first)
THEME_RULES = [
    (("cosmic", "cosmos", "celestial", "stellar", "nocturnal"), "Cosmic"),
    (("cyber", "neon", "electric", "futuristic", "synth", "vapor"), "Cyberpunk & Neon"),
    (("coastal", "nautical", "aquatic", "icy", "polar", "marine", "arctic"), "Aquatic & Polar"),
    (("industrial", "mechanical"), "Industrial"),
    (("technical", "tech", "digital", "interface", "data", "dashboard", "analytical", "dev"), "Tech"),
    (("professional", "saas", "enterprise", "corporate", "commercial", "premium",
      "trustworthy", "reliable", "accessible", "scholarly", "balanced", "usable"), "Professional"),
    (("urban",), "Urban"),
    (("natural", "nature", "organic", "earthy", "botanical", "floral"), "Natural"),
    (("retro", "nostalgia", "vintage"), "Vintage"),
    (("minimal", "mono", "editorial", "elegant", "refined", "muted"), "Minimalist"),
    (("moody", "dramatic", "dark", "regal", "mystical", "spiritual", "layered",
      "expressive", "cinematic"), "Cinematic"),
    (("playful", "bold", "vibrant", "pop", "optimistic", "energetic", "colorful",
      "luminous", "bright", "fresh", "creative"), "Vibrant & Pop"),
    (("soft", "pastel", "delicate", "airy", "calm", "warm", "atmospheric"), "Atmospheric"),
]


def consolidate_categories(palettes):
    counts = Counter(p["category"] for p in palettes)
    mapping = {}
    for p in palettes:
        cat = p["category"]
        if counts[cat] > 9:  # keep all meaningful categories intact
            continue
        low = cat.lower()
        target = None
        for keys, canon in THEME_RULES:
            if any(k in low for k in keys):
                target = canon
                break
        if target and target != cat:
            mapping[cat] = target
            p["category"] = target
    return mapping


# ── pass #5: regenerate formulaic procedural names ───────────────────────────

_COLOR_WORDS = {
    "Red": ["Crimson", "Ember", "Scarlet", "Ruby", "Vermilion", "Garnet"],
    "Orange": ["Amber", "Copper", "Rust", "Marigold", "Tangerine", "Sienna"],
    "Yellow": ["Golden", "Honey", "Citrine", "Saffron", "Amberlight", "Flax"],
    "Green": ["Verdant", "Jade", "Fern", "Moss", "Viridian", "Basil"],
    "Cyan": ["Teal", "Aqua", "Lagoon", "Seaglass", "Turquoise", "Reef"],
    "Blue": ["Azure", "Cobalt", "Cerulean", "Indigo", "Sapphire", "Slateblue"],
    "Purple": ["Violet", "Amethyst", "Plum", "Mauve", "Iris", "Wisteria"],
    "Magenta": ["Fuchsia", "Orchid", "Rose", "Magenta", "Berry", "Peony"],
    "Neutral": ["Ashen", "Slate", "Ivory", "Graphite", "Pewter", "Sand"],
}
_NOUNS = ["Drift", "Haze", "Bloom", "Echo", "Veil", "Current", "Mirage", "Cascade",
          "Horizon", "Whisper", "Pulse", "Tide", "Dawn", "Dusk", "Reverie", "Nocturne",
          "Prism", "Halo", "Ember", "Quartz", "Meridian", "Vellum", "Lull", "Spire"]
_PREFIX = ["Deep", "Soft", "Bright", "Muted", "Warm", "Cool", "Electric", "Faded",
           "Vivid", "Pale", "Dusky", "Lucid"]


def regenerate_names(palettes):
    taken = {p["name"] for p in palettes if _palette_source(p) != "procedural"}
    changed = 0
    samples = []
    for p in palettes:
        if _palette_source(p) != "procedural":
            continue
        fam = p.get("derived", {}).get("hueFamily") or "Neutral"
        colors = _COLOR_WORDS.get(fam, _COLOR_WORDS["Neutral"])
        seed = sum(ord(ch) * (i + 1) for i, ch in enumerate(p["id"]))
        cand = None
        for attempt in range(400):
            cw = colors[(seed + attempt) % len(colors)]
            nn = _NOUNS[(seed // 3 + attempt * 7) % len(_NOUNS)]
            name = f"{cw} {nn}"
            if attempt >= len(colors) * len(_NOUNS) // 4:
                pf = _PREFIX[(seed + attempt) % len(_PREFIX)]
                name = f"{pf} {cw} {nn}"
            if name not in taken:
                cand = name
                break
        if not cand:  # extreme fallback
            cand = f"{colors[0]} {_NOUNS[0]} {p['id'][:4]}"
        taken.add(cand)
        if cand != p["name"]:
            if len(samples) < 8:
                samples.append((p["name"], cand))
            p["name"] = cand
            changed += 1
    return changed, samples


# ── project reclassification ─────────────────────────────────────────────────

# Brand names that were mistakenly used as categories. These are products the
# user builds custom palettes for — the brand belongs in `project`, not category.
BRAND_CATEGORIES = {"WRD Leads CRM", "Signal Scout"}


def assign_projects(palettes):
    """Move brand-as-category palettes into a `project` field and give each a real
    (hue-family) aesthetic category. Requires derived metadata (run after enrich)."""
    moved = 0
    for p in palettes:
        brand = p.get("category")
        if brand in BRAND_CATEGORIES:
            p["project"] = brand
            p["category"] = (p.get("derived", {}) or {}).get("hueFamily", "Neutral")
            moved += 1
    return moved


# ── pass #2: quality score ───────────────────────────────────────────────────

_HARMONY_BONUS = {"analogous": 1.0, "complementary": 1.0, "triadic": 1.0,
                  "tetradic": 0.85, "monochromatic": 0.7, "polychrome": 0.6, "neutral": 0.5}


def score_quality(palettes):
    for p in palettes:
        acc, d = p["accessibility"], p["derived"]
        ui = acc["uiReadiness"] / 100
        wcag = acc["wcagPassRate"]
        crange = min(1, acc["contrastRange"] / 12)
        sat = 1 - min(1, abs(d["averageSaturation"] - 55) / 55)
        harm = _HARMONY_BONUS.get(d["harmony"], 0.6)
        curated = 1.0 if p.get("source") == "curated" else 0.6
        q = 100 * (0.35 * ui + 0.25 * wcag + 0.15 * crange
                   + 0.10 * sat + 0.10 * harm + 0.05 * curated)
        p["qualityScore"] = round(q, 1)


# ── driver ───────────────────────────────────────────────────────────────────


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--mean", type=float, default=3.0, help="near-dup mean ΔE threshold")
    ap.add_argument("--max", type=float, default=6.0, help="near-dup max ΔE threshold")
    args = ap.parse_args()

    with open(SRC_JSON, encoding="utf-8") as f:
        palettes = json.load(f)
    n0 = len(palettes)

    if args.dry_run:
        # report near-dup counts at several thresholds before committing
        for m in (2.0, 3.0, 4.0, 5.0):
            _, removed, _ = prune_near_duplicates(palettes, m, m * 2)
            print(f"  near-dup @ mean<{m} max<{m*2}: would remove {removed}")

    palettes, pruned, dup_ex = prune_near_duplicates(palettes, args.mean, args.max)
    remediated, rem_ex = remediate(palettes)
    reordered = reorder(palettes)
    within = fix_within_dups(palettes)
    cat_map = consolidate_categories(palettes)

    # recompute all derived metadata on the refined content
    ep.enrich(palettes)

    projected = assign_projects(palettes)  # needs derived.hueFamily from enrich()
    renamed, name_ex = regenerate_names(palettes)
    score_quality(palettes)

    print(f"\n[refine] {n0} -> {len(palettes)} palettes")
    print(f"   pruned near-duplicates : {pruned}")
    print(f"   remediated (contrast)  : {remediated}")
    print(f"   reordered (procedural) : {reordered}")
    print(f"   within-palette dups fix: {within}")
    print(f"   categories consolidated: {len(cat_map)} names -> canonical")
    print(f"   procedural names redone: {renamed}")
    print(f"   moved brand->project    : {projected}")
    qs = [p["qualityScore"] for p in palettes]
    print(f"   quality score: min={min(qs):.0f} med={sorted(qs)[len(qs)//2]:.0f} max={max(qs):.0f}")

    if dup_ex:
        print("\n  near-dup examples (kept <- dropped):")
        for keep, dropped in dup_ex[:4]:
            print(f"    {keep!r} <- {dropped}")
    if rem_ex:
        print("\n  remediation (name: before -> after ratio):")
        for nm, b, a in rem_ex:
            print(f"    {nm!r}: {b} -> {a}")
    if cat_map:
        print("\n  category remap:")
        for k, v in sorted(cat_map.items()):
            print(f"    {k!r} -> {v!r}")
    if name_ex:
        print("\n  name examples (before -> after):")
        for b, a in name_ex:
            print(f"    {b!r} -> {a!r}")

    if args.dry_run:
        print("\n[dry-run] nothing written.")
        return 0

    with open(SRC_JSON, "w", encoding="utf-8") as f:
        json.dump(palettes, f, ensure_ascii=False, indent=4)
    print(f"\n[OK] wrote {SRC_JSON}")
    n = ep.rebuild_db(palettes)
    print(f"[OK] rebuilt generated/palettes.db ({n} palettes)")
    print("[DONE] now run: python sync_palettes.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
