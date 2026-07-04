---
name: debug-investigation
description: Use when investigating a bug: reproduce, isolate, fix the root cause, and add a regression test.
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# Debug Investigation

## Purpose
Fix the cause, not the symptom, and prevent recurrence.

## Process
1. Reproduce reliably; capture exact steps and environment.
2. Isolate: narrow to the smallest failing path (bisect, logging, breakpoints).
3. Form a hypothesis for the root cause and confirm it.
4. Propose the minimal fix that addresses the cause.
5. Add a regression test that fails before and passes after.
6. Run `[LINT_COMMAND]`, `[TEST_COMMAND]`, `[BUILD_COMMAND]`.
7. Document with `templates/bug-report.md`.

## Output format
- Symptom
- Reproduction
- Root cause
- Fix
- Regression test
- Verification
