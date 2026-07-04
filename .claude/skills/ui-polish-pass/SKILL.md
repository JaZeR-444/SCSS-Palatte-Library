---
name: ui-polish-pass
description: Use when running a UI/UX polish pass across routes, views, and states without changing product scope.
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# UI Polish Pass

## Purpose
Improve the interface without changing core purpose or architecture.

## Process
1. Identify all routes and major views (`references/route-map.md`).
2. Review navigation and page hierarchy.
3. Inspect buttons, cards, forms, modals, tabs, and empty states.
4. Check responsive behavior across desktop, tablet, and mobile.
5. Verify design-token usage (`rules/design-system.md`).
6. Flag inconsistent spacing, typography, and visual weight.
7. Validate against `checklists/ui-ux.md` and `checklists/accessibility.md`.

## Output format
- View or component
- Issue
- Impact
- Recommended fix
- Priority
- Files likely involved
