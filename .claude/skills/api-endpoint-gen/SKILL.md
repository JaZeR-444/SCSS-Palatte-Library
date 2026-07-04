---
name: api-endpoint-gen
description: Use when scaffolding a new backend route or API endpoint. Ensures validation, error handling, and documentation standards are met.
allowed-tools: Read, Write
context: current
agent: Builder
---

# API Endpoint Generation

## Purpose
Ensure newly generated endpoints conform to project REST/GraphQL conventions, include input validation, and handle errors properly.

## Process
1. Read existing endpoints in the routing directory as reference.
2. Draft the request/response schema or types.
3. Implement the controller/handler with appropriate status codes (200, 201, 400, 500).
4. Integrate project-standard error handling and logging.
5. Add route to the main router if applicable.

## Output
Creates or writes the new endpoint files into the codebase.
