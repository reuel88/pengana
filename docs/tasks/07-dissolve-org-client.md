# Task 7: Dissolve `@pengana/org-client` → Rename to `@pengana/org`

## Status: Done
## Dependencies: Task 6 (state management) — xState removal from org-client must happen first
## Difficulty: Low-Medium

## Why Seventh
With xState removed (Task 6) and UI decoupled (Task 5), `org-client` could be simplified. The original plan was to dissolve it into app-level code, but audit showed web and native share 90%+ of the same hooks/utilities (31 files each). Full dissolution would duplicate ~30 files.

## What Was Done

Renamed the package from `@pengana/org-client` to `@pengana/org` and cleaned up internal structure:

1. **Renamed** `packages/org-client/` → `packages/org/` with `"name": "@pengana/org"`
2. **Moved** `machines/onboarding-machine.ts` → `lib/onboarding.ts` (it's a plain reducer since Task 6, not a machine)
3. **Removed** `./machines/*` export path from package.json (no longer needed)
4. **Updated 67 import statements** across 63 consumer files in web/native/extension
5. **Updated** `package.json` deps in all 3 apps (`@pengana/org-client` → `@pengana/org`)
6. **Fixed** stale path references in `apps/extension/tsconfig.json`, `apps/extension/wxt.config.ts`
7. **Removed** stale `@pengana/org` path alias from `packages/ui/tsconfig.json` (leftover from Task 5)

### Why Rename Instead of Dissolve
- Web and native each import from org-client in 31 files with near-identical usage
- Dissolving would create ~30 duplicate files per app with no code sharing
- The package is lean after Task 6 (no xState) — just hooks, types, and pure utilities
- `@pengana/org` is a cleaner name that matches the package graph plan

## Key Files Modified
- `packages/org-client/` → `packages/org/` (directory rename)
- `packages/org/package.json` — name + removed machines export
- `packages/org/src/index.ts` — updated onboarding import path
- `packages/org/src/lib/onboarding.ts` — moved from machines/
- `packages/org/src/lib/onboarding.test.ts` — moved from machines/
- 63 consumer files across apps — import path updates
- `apps/web/package.json`, `apps/native/package.json`, `apps/extension/package.json` — dep rename
- `apps/extension/tsconfig.json`, `apps/extension/wxt.config.ts` — path alias updates
- `packages/ui/tsconfig.json` — removed stale path alias

## Verification
- [x] `packages/org-client/` directory no longer exists
- [x] No imports from `@pengana/org-client` anywhere in source files
- [x] `pnpm run check` passes (0 errors)
- [x] `pnpm run build` succeeds
- [x] `pnpm run test` passes (all 7 suites)
