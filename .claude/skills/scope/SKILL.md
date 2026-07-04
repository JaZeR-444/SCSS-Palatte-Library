---
name: scope
description: Check a proposed change against scope and protected decisions before building. Invoke with /scope <change>.
disable-model-invocation: true
argument-hint: [proposed change]
allowed-tools: Read, Grep, Glob
---

# /scope

Check this proposed change before implementing it: $ARGUMENTS

Run the `scope-guard` skill against `rules/product-scope.md` and
`references/protected-decisions.md`. Return a proceed / clarify / decline verdict.
