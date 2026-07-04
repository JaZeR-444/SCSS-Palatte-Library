---
name: test
description: Run a test coverage pass, adding missing tests for critical paths. Invoke with /test [area].
disable-model-invocation: true
argument-hint: [optional area or module to focus on]
allowed-tools: Read, Grep, Glob, Edit, Bash
---

# /test

Run a test coverage pass over $ARGUMENTS (or the whole project if no area given).

Use the `test-coverage-pass` skill and `rules/testing.md`. Add missing tests for
critical paths and edge cases without changing behavior. Run `[TEST_COMMAND]` and
report results.
