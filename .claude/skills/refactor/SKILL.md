---
name: refactor
description: Refactor a target area without changing behavior. Invoke with /refactor <area>.
disable-model-invocation: true
argument-hint: [target area or file]
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# /refactor

Refactor $ARGUMENTS without changing behavior.

Run the `refactor-pass` skill: make small reviewable changes, run lint/test/build,
and return a change summary before committing.
