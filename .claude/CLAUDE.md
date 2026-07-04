# Project Operating Instructions

> This is the primary instruction file for Claude Code in this repository.
> Keep it concise, strategic, and durable. Do not turn it into a task log or
> a checklist dump — those belong in `rules/`, `checklists/`, and `references/`.

## Project Identity

This project is **[PROJECT_NAME]**.

It exists to **[PROJECT_PURPOSE]**.

Primary user: **[PRIMARY_USER]**.

## Product Scope

This project is responsible for:

- [SCOPE_ITEM]
- [SCOPE_ITEM]
- [SCOPE_ITEM]

This project is **not** responsible for:

- [OUT_OF_SCOPE_ITEM]
- [OUT_OF_SCOPE_ITEM]
- [OUT_OF_SCOPE_ITEM]

## Architecture Summary

- Language / stack: **[TECH_STACK]**
- Framework: **[FRAMEWORK]**
- Routing: **[ROUTING_SYSTEM]**
- State management: **[STATE_MANAGEMENT]**
- Styling: **[STYLING_SYSTEM]**
- Persistence: **[PERSISTENCE]**

Full detail lives in `.claude/references/architecture-map.md`.

## Protected Decisions

Claude must preserve the following unless explicitly told to change them:

- [PROTECTED_DECISION]
- [PROTECTED_DECISION]
- [PROTECTED_DECISION]

The authoritative list is `.claude/references/protected-decisions.md`.

## Build and Test Commands

Run these before considering meaningful code changes complete:

```bash
[LINT_COMMAND]
[TEST_COMMAND]
[BUILD_COMMAND]
```

## Working Rules

- Inspect before editing. Read the relevant files first.
- Preserve existing architecture unless explicitly asked to change it.
- Prefer small, reviewable changes over large rewrites.
- Do not rename core product concepts without instruction (see `rules/terminology.md`).
- Do not introduce new dependencies without a clear, stated reason.
- When a task matches a workflow in `.claude/skills/`, follow that process.
- Validate finished work against the relevant file in `.claude/checklists/`.

## How To Use This Folder

1. Read this file.
2. Inspect relevant files in `.claude/references/`.
3. Apply standards from `.claude/rules/`.
4. Use `.claude/skills/` for repeatable workflows.
5. Use `.claude/agents/` for specialized review.
6. Validate against `.claude/checklists/`.
7. Format outputs with `.claude/templates/`.
