# Task 8: Final Package Graph Cleanup

## Status: Not Started
## Dependencies: All previous tasks (1-7)
## Difficulty: Low

## Why Last
This is the cleanup pass after all consolidation work. Ensures the final package graph is clean, dependencies are minimal, and everything is documented.

## Goal
Verify the final package structure matches the target, clean up any remaining debt, and update documentation.

## Target Package Structure (9 packages)
| Package | Purpose |
|---------|---------|
| `@pengana/db` | Drizzle schema + queries (server-side PostgreSQL) |
| `@pengana/local-db` | Client-side data layer (Dexie + Drizzle/SQLite adapters, hooks) |
| `@pengana/api` | oRPC procedure definitions |
| `@pengana/auth` | Better-Auth configuration and hooks |
| `@pengana/sync` | Custom sync engine + real-time transport + upload queue |
| `@pengana/ui` | Pure presentational components (no business logic) |
| `@pengana/i18n` | Internationalization setup and locales |
| `@pengana/env` | Typed environment variable validation |
| `@pengana/config` | Shared TypeScript and build config |

## Removed Packages
- `sync-engine` → merged into `@pengana/sync`
- `sync-runtime` → merged into `@pengana/sync`
- `realtime-transport` → merged into `@pengana/sync`
- `storage-health` → merged into `@pengana/sync`
- `upload-queue` → merged into `@pengana/sync`
- `entity-store` → merged into `@pengana/local-db`
- `todo-client` → merged into `@pengana/local-db`
- `upload-client` → merged into `@pengana/local-db`
- `org-client` → dissolved into app-level code
- `email-dev` → inlined into server dev mode (or kept if still useful)

## Cleanup Steps
1. Verify no stale package directories remain in `packages/`
2. Verify `pnpm-workspace.yaml` only lists active packages
3. Run `pnpm install` to regenerate lockfile
4. Check for orphan dependencies — packages listed in `package.json` but never imported
5. Run `pnpm run build` across all apps
6. Run `pnpm run check-types` — no TypeScript errors
7. Run `pnpm run check` — no lint/format issues
8. Run `pnpm run test` — all unit tests pass
9. Run `pnpm run e2e` — all E2E tests pass
10. Update `docs/plans/clean-slate-architecture.md` to reflect final state
11. Update `CLAUDE.md` if any conventions changed (e.g., org data fetching section)

## Verification
- [ ] Exactly 9 packages in `packages/`
- [ ] No circular dependencies
- [ ] `pnpm run build` — all apps build successfully
- [ ] `pnpm run check-types` — zero errors
- [ ] `pnpm run test` — all pass
- [ ] `pnpm run e2e` — all pass
- [ ] CI pipeline passes
