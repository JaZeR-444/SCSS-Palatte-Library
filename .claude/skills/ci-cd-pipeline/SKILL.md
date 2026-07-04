---
name: ci-cd-pipeline
description: Use to safely scaffold or modify GitHub Actions / GitLab CI configuration files.
allowed-tools: Read, Write
context: current
agent: Builder
---

# CI/CD Pipeline

## Purpose
Ensure CI/CD configurations are secure, efficient, and accurately run project checks.

## Process
1. Identify the required pipeline steps (lint, test, build, deploy).
2. Read project scripts to find the correct execution commands.
3. Scaffold the YAML configuration (e.g., `.github/workflows/main.yml`).
4. Ensure caching strategies (like `actions/setup-node` caching) are implemented.
5. Review for secret exposure or insecure third-party actions.

## Output
Pipeline YAML files.
