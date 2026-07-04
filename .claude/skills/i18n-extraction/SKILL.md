---
name: i18n-extraction
description: Use when extracting hardcoded strings from UI components into localization/translation files.
allowed-tools: Read, Write, Grep
context: current
agent: Builder
---

# i18n Extraction

## Purpose
Sweep files for hardcoded user-facing strings and replace them with localization hooks/methods.

## Process
1. Scan the target file(s) for raw text in JSX/templates.
2. Generate semantic keys for each string (e.g., `greeting.welcomeUser`).
3. Update the translation JSON/TS files with the new keys and values.
4. Replace the hardcoded strings in the component with the appropriate i18n method (e.g., `t('key')`).

## Output
Modified component files and updated localization dictionaries.
