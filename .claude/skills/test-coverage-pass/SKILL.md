---
name: test-coverage-pass
description: Use when adding missing tests for critical paths and edge cases without changing behavior.
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# Test Coverage Pass

## Purpose
Raise confidence on the paths that matter most (`rules/testing.md`).

## Process
1. Identify critical paths from `references/route-map.md` and core business logic.
2. Map existing tests to those paths; find gaps.
3. Prioritize: untested critical paths > error handling > edge cases > nice-to-have.
4. Write focused tests (unit/integration) following existing test conventions.
5. Add a regression test for any previously fixed-but-untested bug.
6. Run `[TEST_COMMAND]`; confirm all pass and no behavior changed.

## Output format
- Path / module
- Current coverage state
- Tests added
- Remaining gaps
- Priority
