---
name: repo-grounding
description: Run once after installing the kit to ground .claude/ in this repo — fill placeholders and update references. Edits only .claude/. User-invoked only.
allowed-tools: Read, Grep, Glob, Edit, Bash
disable-model-invocation: true
---

# Repo Grounding

## Purpose
Turn the generic framework into an accurate operating layer for THIS repo.
Edits are limited to `.claude/` — never application code.

## Process
1. Read `CLAUDE.md` and scan `.claude/` for `[PLACEHOLDERS]`.
2. Inspect the repo: language, framework, routing, state, styling, persistence, and the real lint/test/build commands.
3. Fill placeholders you can determine confidently; leave the rest and list them as open questions.
4. Update `references/architecture-map.md` and `references/route-map.md` to match reality.
5. Compare framework assumptions to the codebase; flag mismatches.
6. Treat `references/protected-decisions.md` as fixed — never propose reversing it.

## Output format
Before editing, return:
- Detected stack summary
- `.claude/` files to be changed
- Placeholders that can be filled vs. need input
Then wait for approval.
