---
name: commit-pr-pass
description: Run deliberately to turn a working diff into clean commits and a PR description. User-invoked only.
allowed-tools: Read, Grep, Glob, Edit, Bash
disable-model-invocation: true
---

# Commit & PR Pass

## Purpose
Make changes easy to review and easy to read in history later.

## Process
1. Review the diff and group changes by intent.
2. Propose conventional commit messages (e.g. feat / fix / refactor / docs).
3. Draft a PR description: what changed, why, how to test, risks.
4. Note any protected-decision impact and link related issues.
5. Confirm `[LINT_COMMAND]`, `[TEST_COMMAND]`, `[BUILD_COMMAND]` pass before suggesting merge.

## Output format
- Commit plan (message per logical change)
- PR title
- PR body (Summary / Changes / Testing / Risks)
