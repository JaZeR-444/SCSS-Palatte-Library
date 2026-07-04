---
name: dependency-audit
description: Use when auditing dependencies for staleness, vulnerabilities, duplicates, unused packages, and license risk. Returns an action list; does not edit code.
allowed-tools: Read, Grep, Glob
context: fork
agent: Explore
---

# Dependency Audit

## Purpose
Keep the dependency tree healthy, lean, and safe (`rules/security.md`).

## Process
1. Read the manifest(s) and lockfile(s).
2. Flag outdated packages (major vs minor/patch) and end-of-life versions.
3. Run the available audit tool (e.g. `npm audit`, `pip-audit`) and triage by severity.
4. Detect duplicate/overlapping packages serving the same purpose.
5. Identify unused dependencies (imported nowhere) and missing ones (used but undeclared).
6. Note license concerns for redistributed code.
7. Recommend an upgrade order: security fixes first, then low-risk patches, then majors behind a plan.

## Output format
- Package
- Issue (outdated / vuln / unused / duplicate / license)
- Severity
- Recommended action
- Breaking-change risk
