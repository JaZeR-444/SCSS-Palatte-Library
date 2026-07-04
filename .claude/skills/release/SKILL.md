---
name: release
description: Run a release readiness check and draft release notes. Invoke with /release.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
---

# /release

Run a release readiness check. Use the `release-check` skill plus
`checklists/deployment.md`, `checklists/qa.md`, and `checklists/security.md`.
Return a go/no-go and draft release notes (`templates/release-notes.md`).
