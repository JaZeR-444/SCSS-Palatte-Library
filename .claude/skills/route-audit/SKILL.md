---
name: route-audit
description: Use when auditing routes for completeness — layout, loading, empty, error, and auth states. Returns per-route findings; does not edit code.
allowed-tools: Read, Grep, Glob
context: fork
agent: Explore
---

# Route Audit

## Purpose
Ensure every route is complete: layout, navigation, loading, empty, and error states.

## Process
1. Enumerate all routes (`references/route-map.md`).
2. For each route confirm: layout, data loading, empty state, error state, auth gating.
3. Check navigation links resolve and redirects behave.
4. Confirm 404/unknown-route handling.
5. Validate against `checklists/route-readiness.md`.

## Output format
- Route
- Missing state(s)
- Navigation/redirect issues
- Recommended fix
- Priority
