# Security Rules

## Sensitive files
- Never read or print `.env`, `.env.*`, `secrets/**`, keys, or certs.

## Environment variables
- [How env vars are loaded and named]
- Never hardcode secrets in source.

## API keys
- [Where keys live and how they're accessed]

## Data exposure
- Never log secrets, tokens, or PII.
- [Data handling constraints]

## Logging restrictions
- [What may and may not be logged]

## Dependency safety
- Vet new dependencies; prefer well-maintained packages.
- Do not add dependencies without a stated reason.
