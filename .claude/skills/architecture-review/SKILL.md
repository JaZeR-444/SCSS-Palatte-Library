---
name: architecture-review
description: Use when reviewing whether project structure, data flow, component boundaries, and routing match the documented architecture. Returns gaps and prioritized fixes; does not edit code.
allowed-tools: Read, Grep, Glob
context: fork
agent: Explore
---

# Architecture Review

## Purpose
Confirm the codebase matches `rules/architecture.md` and `references/architecture-map.md`, and surface drift.

## Process
1. Read `references/architecture-map.md` and `rules/architecture.md`.
2. Map the actual folder structure and compare to the documented one.
3. Trace data flow and state ownership.
4. Check component/module boundaries and dependency direction.
5. Identify anti-patterns and circular dependencies.
6. Note any conflicts with `references/protected-decisions.md`.

## Output format
- Area
- Documented expectation
- Actual state
- Gap / risk
- Recommended fix
- Priority
