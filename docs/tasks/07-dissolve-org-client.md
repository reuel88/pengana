# Task 7: Dissolve `@pengana/org-client` into App-Level Code

## Status: Not Started
## Dependencies: Task 6 (state management) — xState removal from org-client must happen first
## Difficulty: Low-Medium

## Why Seventh
With xState removed (Task 6) and UI decoupled (Task 5), `org-client` has less reason to exist as a shared package. Its hooks, contexts, and utilities can move into app-level feature code, reducing the package count.

## Current State
`@pengana/org-client` contains:
- React hooks for org/team/invitation queries
- xState machines (being removed in Task 6)
- React contexts for org state
- `user-lifecycle.ts` — shared lifecycle checks
- Type definitions for org entities
- TanStack Form utilities for org forms

Used by: `apps/web`, `apps/native`, `apps/extension`, `packages/ui`

## Goal
Move org-client logic into the apps that use it. If web, native, and extension share significant org code, keep a thin shared module — but only if truly needed after the move.

## Implementation Steps
1. Inventory all exports from `@pengana/org-client` and where they're consumed
2. Move hooks → `apps/web/src/hooks/` (and native/extension equivalents)
3. Move contexts → `apps/web/src/features/org/` (and equivalents)
4. Move `user-lifecycle.ts` → `apps/web/src/lib/` (and equivalents)
5. Move types → `apps/web/src/types/` or inline where used
6. If significant duplication across apps, create a lightweight `packages/org-shared/` with just the types and pure utility functions (no React, no hooks)
7. Remove `packages/org-client/`
8. Update all imports

## Key Files to Modify
- `packages/org-client/src/` — everything moves out
- `apps/web/src/hooks/use-org-queries.ts` — already exists, may absorb more
- `apps/web/src/features/org/` — receives org components and contexts
- `apps/native/`, `apps/extension/` — receive their copies
- `packages/ui/package.json` — should already be clean after Task 5

## Verification
- [ ] `@pengana/org-client` package directory removed
- [ ] No imports from `@pengana/org-client` anywhere
- [ ] Org switching, member management, invitations all work
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run test` passes
