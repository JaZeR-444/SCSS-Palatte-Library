---
name: error-handling-audit
description: Use to review and fix error handling in async functions, API calls, and controllers.
allowed-tools: Read, Write, Grep
context: current
agent: Reviewer
---

# Error Handling Audit

## Purpose
Ensure all failure points have proper try/catch blocks, logging, and user-facing error messaging.

## Process
1. Scan for network requests, database queries, and complex async operations.
2. Verify they are wrapped in `try/catch` or have `.catch()` handlers.
3. Ensure the error is logged properly (not just swallowed).
4. If applicable, ensure a user-friendly error message is bubbled up to the UI.
5. Apply fixes or generate a report of missing error bounds.

## Output
Code fixes or a prioritized list of error-handling gaps.
