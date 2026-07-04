---
name: audit
description: Run a full read-only audit sweep across architecture, dependencies, security, and dead code. Invoke with /audit.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# /audit

Run a full audit sweep and return one prioritized report. Do not edit code.

Run these audit skills in order and consolidate findings:
`architecture-review`, `dependency-audit`, `security-review`, `dead-code-sweep` (report only).

Return results using `templates/audit-report.md`.
