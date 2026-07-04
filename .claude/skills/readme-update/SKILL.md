---
name: readme-update
description: Use to align the project README.md with the current state of the codebase.
allowed-tools: Read, Write, Glob
context: current
agent: Writer
---

# README Update

## Purpose
Ensure the top-level documentation perfectly reflects current installation instructions, architecture, and features.

## Process
1. Scan `package.json`, environment files, and primary config files.
2. Review the existing `README.md` for outdated scripts or architecture notes.
3. Draft an updated README, including:
   - Project purpose
   - Prereqs and environment setup
   - Run/Build/Test commands
   - Key architectural notes
4. Write the changes.

## Output
An updated `README.md` file.
