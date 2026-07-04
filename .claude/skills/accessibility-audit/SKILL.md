---
name: accessibility-audit
description: Use when checking the UI against WCAG 2.1 AA — keyboard, focus, semantics, contrast, labels. Returns findings; does not edit code.
allowed-tools: Read, Grep, Glob
context: fork
agent: Explore
---

# Accessibility Audit

## Purpose
Make the product usable for everyone (`checklists/accessibility.md`).

## Process
1. Enumerate interactive views and components.
2. Test keyboard navigation and focus order; confirm visible focus states.
3. Check semantic markup and ARIA roles where needed.
4. Verify color contrast (4.5:1 text, 3:1 large/UI).
5. Confirm labels on inputs and accessible names on controls.
6. Check that dynamic content is announced and nothing relies on color alone.
7. Validate against `checklists/accessibility.md`.

## Output format
- Component / view
- WCAG criterion at risk
- Issue
- Recommended fix
- Severity
