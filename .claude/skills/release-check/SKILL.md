---
name: release-check
description: Run deliberately before shipping to verify build, tests, regressions, and release notes. User-invoked only.
allowed-tools: Read, Grep, Glob, Edit, Bash
disable-model-invocation: true
---

# Release Check

## Purpose
Confirm the project is ready to ship.

## Process
1. Run `[LINT_COMMAND]`, `[TEST_COMMAND]`, `[BUILD_COMMAND]`.
2. Run smoke tests on critical paths.
3. Validate against `checklists/deployment.md`, `checklists/qa.md`, `checklists/security.md`.
4. Confirm environment/config readiness for [DEPLOYMENT_TARGET].
5. Draft release notes with `templates/release-notes.md`.

## Output format
- Gate
- Result (pass/fail)
- Blockers
- Go / No-go
- Release notes draft
