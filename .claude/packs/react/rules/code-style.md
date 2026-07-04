# Code Style Rules — React/TypeScript

## Naming
- Components: PascalCase. Hooks: `useX`. Variables/functions: camelCase. Constants: UPPER_SNAKE.

## Files
- One component per file, named after the component (`UserCard.tsx`).
- Colocate component, styles, and test: `UserCard.tsx`, `UserCard.module.css`, `UserCard.test.tsx`.

## Components
- Function components only. Type props with an explicit `Props` interface.
- Prefer composition over prop drilling; lift state only as far as needed.
- No business logic in JSX — extract to hooks or helpers.

## Hooks
- Custom hooks own side effects and derived state. Keep `useEffect` deps exhaustive.
- No conditional hook calls.

## Imports
- Order: external, internal absolute, relative. Named exports for components.

## Error handling
- Error boundaries around route-level subtrees. Never swallow errors silently.
