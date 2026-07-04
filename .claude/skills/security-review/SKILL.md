---
name: security-review
description: Use when reviewing for security risk — secrets, input validation, authz, data exposure. Returns prioritized risks; does not edit code.
allowed-tools: Read, Grep, Glob
context: fork
agent: Explore
---

# Security Review

## Purpose
Surface security risk before it ships (`rules/security.md`, `checklists/security.md`).

## Process
1. Scan for secrets in source, history, logs, and config.
2. Map trust boundaries: where untrusted input enters the system.
3. Check input validation/sanitization at each boundary.
4. Verify authentication and authorization on protected actions and routes.
5. Check for data exposure: PII in logs, over-broad API responses, verbose errors.
6. Review dependency risk (defer deep work to `dependency-audit`).
7. Validate against `checklists/security.md`.

## Output format
- Area
- Risk
- Likelihood / impact
- Recommended fix
- Priority
