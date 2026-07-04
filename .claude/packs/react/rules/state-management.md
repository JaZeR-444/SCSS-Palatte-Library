# State Management Rules — React

## Local first
- Default to `useState`/`useReducer`. Promote to shared state only when 2+ distant components need it.

## Server state
- Use a data-fetching layer (e.g. TanStack Query) for server state; do not hand-roll caching in components.

## Global/client state
- Keep global state minimal (auth, theme, feature flags). Avoid putting server data in a global store.

## Persistence
- Persist only durable user preferences. Namespace keys (`app:theme`). Migrate shape changes explicitly.
