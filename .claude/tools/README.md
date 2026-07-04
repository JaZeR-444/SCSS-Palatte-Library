# Tools & Scripts

This directory contains executable scripts (Bash, Python, Node.js) that act as custom tools for the agent.

If an AI agent has permission to execute terminal commands, you can write scripts here to give them powerful, sandboxed ways to interact with your codebase or external services.

## Examples:

- `analyze_bundle.sh` - A script the agent can run to check if their code changes bloated the webpack bundle.
- `fetch_jira_ticket.py` - A script the agent can run to pull requirements from your issue tracker.
- `run_evals.js` - A script to run the AI through a test suite to ensure its changes didn't break core workflows.
