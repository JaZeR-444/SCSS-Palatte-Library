---
name: storybook-gen
description: Use to create a robust Storybook file for a UI component with multiple states.
allowed-tools: Read, Write
context: current
agent: Builder
---

# Storybook Generation

## Purpose
Automatically generate comprehensive `.stories.tsx` or `.stories.jsx` files for existing UI components.

## Process
1. Read the target component and identify all props and their types.
2. Scaffold a Storybook file matching the component's path.
3. Create a Default story.
4. Create additional stories for critical states (e.g., Loading, Error, Empty, Disabled, Various sizes).
5. Use proper Storybook args/controls.

## Output
A new Storybook file.
