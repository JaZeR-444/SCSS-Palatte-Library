---
name: docker-optimization
description: Use to review and optimize Dockerfiles for caching, size, and security.
allowed-tools: Read, Write
context: current
agent: Builder
---

# Docker Optimization

## Purpose
Write or rewrite Dockerfiles to use multi-stage builds, leverage layer caching, and minimize image bloat.

## Process
1. Analyze the current `Dockerfile` and `.dockerignore`.
2. Identify missing ignore patterns (e.g., `node_modules`, `.git`).
3. Implement multi-stage builds (Builder -> Runner) to exclude build tools from the final image.
4. Reorder commands to maximize layer caching (e.g., copying package files before source code).
5. Apply fixes.

## Output
Optimized `Dockerfile` and `.dockerignore`.
