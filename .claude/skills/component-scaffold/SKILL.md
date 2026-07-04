---
name: component-scaffold
description: Use when generating a new UI component. Ensures component structure, styling, and props conform to project standards.
allowed-tools: Read, Write
context: current
agent: Builder
---

# Component Scaffold

## Purpose
Ensure all newly generated UI components follow the exact project architecture, styling conventions, and boilerplate.

## Process
1. Identify the requested component name and its responsibility.
2. Read `rules/components.md` or equivalent frontend standards.
3. Check existing components in the codebase for structural reference.
4. Scaffold the component file, ensuring explicit Prop type definitions.
5. Apply styling based on project rules (e.g., CSS modules, Tailwind).
6. Create an accompanying `index.ts` export file if standard.

## Output
Creates or writes the requested files into the codebase.
