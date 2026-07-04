---
name: type-safety-pass
description: Use to sweep code for `any` types, implicit types, and strengthen type definitions.
allowed-tools: Read, Write, Grep
context: current
agent: Builder
---

# Type Safety Pass

## Purpose
Improve codebase robustness by eliminating loose typing and enforcing strict TypeScript/Type boundaries.

## Process
1. Search the target area for `any`, `@ts-ignore`, or loose generic types.
2. Infer the correct types by analyzing the usage of the variables/functions.
3. Define strong interfaces or types to replace the loose types.
4. Update function signatures, props, and variable declarations.

## Output
Strictly typed code with a summary of the fixes applied.
