---
name: scope-guard
description: Use BEFORE implementing a change to check it against product scope and protected decisions. Returns a proceed / clarify / decline verdict.
allowed-tools: Read, Grep, Glob
---

# Scope Guard

## Purpose
Catch scope drift and protected-decision conflicts before any code is written.

## Process
1. Restate the proposed change in one sentence.
2. Check it against `rules/product-scope.md` (in scope / out of scope / drift risk).
3. Check it against `references/protected-decisions.md` for conflicts.
4. Check terminology against `rules/terminology.md`.
5. If it's out of scope or reverses a protected decision, stop and surface it rather than proceeding.

## Output format
- Proposed change
- Scope verdict (in / out / drift)
- Protected-decision conflicts (or "none")
- Terminology issues (or "none")
- Recommendation (proceed / clarify / decline)
