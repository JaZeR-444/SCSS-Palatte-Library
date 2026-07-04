---
name: performance-pass
description: Use when fixing performance hotspots — slow renders, large bundles, N+1 queries — while preserving behavior.
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# Performance Pass

## Purpose
Improve speed and responsiveness while preserving behavior.

## Process
1. Establish what "slow" means here: load time, interaction latency, query time, bundle size.
2. Locate hotspots: expensive renders/re-renders, unmemoized work, N+1 data access, oversized imports, blocking I/O.
3. Measure before changing (note the baseline).
4. Apply targeted fixes: memoization, lazy-loading/code-splitting, query batching, caching, debouncing.
5. Re-measure to confirm the win and watch for regressions.
6. Run `[LINT_COMMAND]`, `[TEST_COMMAND]`, `[BUILD_COMMAND]`.

## Output format
- Hotspot
- Baseline metric
- Fix applied
- After metric
- Risk / tradeoff
