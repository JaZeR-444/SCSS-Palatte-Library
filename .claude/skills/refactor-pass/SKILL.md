---
name: refactor-pass
description: Run deliberately to clean up implementation without changing behavior. User-invoked only to avoid unintended large refactors.
allowed-tools: Read, Grep, Glob, Edit, Bash
disable-model-invocation: true
---

# Refactor Pass

## Purpose
Improve code quality while preserving behavior and public interfaces.

## Process
1. Confirm the target area and its current behavior.
2. Identify duplication, dead code, unclear naming, and oversized units.
3. Plan small, reviewable changes (`rules/code-style.md`, `rules/architecture.md`).
4. Refactor without changing user-facing behavior.
5. Run `[LINT_COMMAND]`, `[TEST_COMMAND]`, `[BUILD_COMMAND]`.
6. Confirm no protected decision was reversed.

## Output format
- Change
- Rationale
- Behavior preserved (yes/no + how verified)
- Files touched
- Risk
