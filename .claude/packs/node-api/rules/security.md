# Security Rules — Node API

## Input & output
- Validate and sanitize every request body, query, and param against a schema.
- Escape/encode output; parameterized queries only (no string-built SQL).

## Auth
- Authn on every non-public route; authz checks at the resource level, not just route level.
- Short-lived tokens; verify signature and expiry on each request.

## Secrets & transport
- Secrets from env/secret manager only. Enforce HTTPS/TLS. Set security headers.

## Operational
- Rate-limit public endpoints. Log requests without secrets or PII. Keep deps patched.
