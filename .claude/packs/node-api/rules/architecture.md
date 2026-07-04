# Architecture Rules — Node API

## Layering
- routes/controllers → services (business logic) → data access. Controllers stay thin.
- No DB calls in controllers; no HTTP concerns in services.

## Boundaries
- Validate input at the edge (controller) with a schema; trust nothing downstream.
- One module owns each external dependency (DB, queue, third-party API).

## Errors
- A single error type/contract surfaced to clients. Map internal errors to safe responses.
- Never leak stack traces or internal identifiers in responses.

## Async
- async/await everywhere; no unhandled promise rejections. Time-box external calls.
