---
name: responsive-pass
description: Use to sweep UI components and ensure mobile and tablet layouts are handled properly.
allowed-tools: Read, Write, Grep
context: current
agent: Builder
---

# Responsive Design Pass

## Purpose
Check and fix CSS/Tailwind classes to ensure the interface looks great on mobile, tablet, and desktop.

## Process
1. Analyze the target component's current layout classes.
2. Identify fixed widths, lack of flex/grid wrapping, or missing breakpoints.
3. Add responsive utilities (e.g., in Tailwind: `flex-col md:flex-row`, `w-full md:w-1/2`).
4. Ensure touch targets on mobile are adequately sized.

## Output
Updated component files with responsive layouts.
