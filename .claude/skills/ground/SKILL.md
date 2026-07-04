---
name: ground
description: Run once after installing the kit to ground .claude/ in this repo. Invoke with /ground.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit
---

# /ground

Ground the .claude/ framework in this repository. Edit only files inside `.claude/`.

Run the `repo-grounding` skill: inspect the repo, fill placeholders you can determine,
update `references/architecture-map.md` and `references/route-map.md`, and flag bad
assumptions. Treat `references/protected-decisions.md` as fixed.

Before editing, return the detected stack, the `.claude/` files you'll change, and
fillable vs. unknown placeholders. Wait for approval.
