---
name: doc-sync-pass
description: Use when bringing README and .claude/references/* back in line with the current codebase.
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# Doc Sync Pass

## Purpose
Keep documentation truthful so future sessions trust it.

## Process
1. Read README and every file in `references/`.
2. Compare each claim to the current code.
3. Update inaccurate or stale content; remove what no longer applies.
4. Fill gaps where reality is undocumented.
5. Flag anything that needs a human decision rather than guessing.

## Output format
- Doc / reference file
- Inaccuracy found
- Update made (or flagged)
