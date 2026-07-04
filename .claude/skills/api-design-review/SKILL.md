---
name: api-design-review
description: Use when reviewing API surface for consistency, status codes, error contracts, validation, and versioning. Returns findings; does not edit code.
allowed-tools: Read, Grep, Glob
context: fork
agent: Explore
---

# API Design Review

## Purpose
Keep the API consistent, predictable, and safe to evolve.

## Process
1. Enumerate endpoints (or operations) and group by resource.
2. Check naming, HTTP verbs, and status codes for consistency.
3. Review request/response schemas and validation.
4. Confirm a consistent error contract (shape, codes, messages).
5. Check pagination, filtering, and rate-limit conventions.
6. Assess versioning and backward-compatibility of any changes.
7. Confirm authn/authz on each endpoint (`rules/security.md`).

## Output format
- Endpoint / operation
- Issue (naming / status / contract / validation / versioning)
- Why it matters
- Recommended fix
- Breaking? (yes/no)
