---
name: test-gen
description: Use when writing test suites for untested files. Focuses on covering critical paths and edge cases.
allowed-tools: Read, Write, Run
context: current
agent: Builder
---

# Test Suite Generation

## Purpose
Generate high-quality unit or integration tests for an existing piece of code from scratch.

## Process
1. Analyze the target file and identify public functions/components.
2. Identify dependencies that require mocking.
3. Scaffold the test file (`.test.ts`, `.spec.tsx`) in the standard location.
4. Write test cases for:
   - The happy path.
   - Known edge cases and boundary conditions.
   - Error throwing/handling.
5. Run tests if the test command is available.

## Output
Test files and results of running the test suite.
