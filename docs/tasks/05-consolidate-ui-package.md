# Task 5: Decouple UI Package from Business Logic

## Status: Not Started
## Dependencies: Task 4 (client data consolidation) — `@pengana/upload-client` must be merged into `@pengana/local-db` first since UI currently depends on it
## Difficulty: Medium

## Why Fifth
With the client data layer consolidated (Task 4), we can now cleanly remove business logic dependencies from `@pengana/ui` and make it a pure presentational component library.

## Current State
`@pengana/ui` has `peerDependencies` on:
- `@pengana/org-client` — org-aware components
- `@pengana/upload-client` → now `@pengana/local-db`
- `@pengana/sync-engine` → now `@pengana/sync`
- `@pengana/upload-queue` → now `@pengana/sync`

This means the UI package can't be used without pulling in business logic, and creates circular dependency risks.

## Goal
`@pengana/ui` contains only presentational components (buttons, inputs, modals, layout, etc.) with no business logic imports. Business-aware components move to app-level feature code.

## Implementation Steps
1. Identify which UI components import from `org-client`, `upload-client`/`local-db`, `sync-engine`/`sync`, or `upload-queue`
2. For each business-aware component:
   - If it's a thin wrapper (e.g., passes org context to a presentational component): move to `apps/web/src/widgets/` or relevant feature directory
   - If it has reusable presentational parts: extract the presentational part into `@pengana/ui`, move the business logic wrapper to app code
3. Remove `@pengana/org-client`, `@pengana/local-db`, `@pengana/sync`, `@pengana/upload-queue` from `packages/ui/package.json` peer/dependencies
4. Update imports in all apps that used the moved components
5. Verify `@pengana/ui` only depends on: React, TailwindCSS, Radix/shadcn primitives, icon libraries, utility libs (clsx, cva, etc.)

## Key Files to Modify
- `packages/ui/package.json` — remove business deps
- `packages/ui/src/components/` — identify and move business-aware components
- `apps/web/src/widgets/` or `apps/web/src/features/` — receive moved components
- `apps/native/`, `apps/extension/` — update imports for moved components

## Verification
- [ ] `@pengana/ui` has zero imports from business packages
- [ ] `packages/ui/package.json` has no business-logic peer/dependencies
- [ ] All apps still render correctly
- [ ] No circular dependency warnings
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run test` passes
