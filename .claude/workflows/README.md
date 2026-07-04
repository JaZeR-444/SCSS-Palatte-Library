# Workflows

This directory contains multi-step orchestration instructions for complex, repeatable agent tasks.

While `skills/` teach the agent *how* to do a single thing, `workflows/` teach the agent *when* and *in what order* to combine skills, tools, and prompts to accomplish a large objective.

## Example Workflows You Could Add:

- `release-workflow.md`: Instructions for cutting a new release (run tests, bump version, update changelog, build).
- `pr-review.md`: Step-by-step guide for how the agent should review a pull request.
- `database-migration.md`: Standard operating procedure for generating, testing, and applying database migrations.
