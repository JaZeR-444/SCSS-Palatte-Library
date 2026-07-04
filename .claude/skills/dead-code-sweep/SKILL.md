---
name: dead-code-sweep
description: Use when finding unused exports, files, and assets. Reports candidates with evidence; does not delete unless explicitly asked.
allowed-tools: Read, Grep, Glob
context: fork
agent: Explore
---

# Dead Code Sweep

## Purpose
Reduce surface area and maintenance cost while preserving behavior.

## Process
1. Identify unreferenced files, exports, components, and assets.
2. Confirm they're truly unused (search imports, dynamic references, config).
3. Cross-check against `references/protected-decisions.md` — never remove protected scaffolding.
4. Remove in small, reviewable commits.
5. Run `[LINT_COMMAND]`, `[TEST_COMMAND]`, `[BUILD_COMMAND]` after each batch.
6. Flag anything ambiguous instead of deleting it.

## Output format
- Item
- Evidence it's unused
- Action (remove / keep / flag)
- Risk
