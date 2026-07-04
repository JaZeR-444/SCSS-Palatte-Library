---
name: debug
description: Investigate and fix a bug at its root cause, with a regression test. Invoke with /debug <bug>.
disable-model-invocation: true
argument-hint: [bug description or failing behavior]
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# /debug

Investigate and fix: $ARGUMENTS

Run the `debug-investigation` skill: reproduce, isolate, fix the root cause, add a
regression test, and run lint/test/build. Document with `templates/bug-report.md`.
