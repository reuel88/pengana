# Task 4: Consolidate Client Data Packages into `@pengana/local-db`

## Status: Complete
## Dependencies: Task 3 (sync consolidation) — sync adapter interfaces must be settled first
## Difficulty: High

## Why Fourth
With the sync layer consolidated (Task 3), the client data packages can now be merged without conflicting with sync refactoring. This task eliminates 3 packages and creates a single client-side data layer.

## Current State
3 separate packages handle client-side data with duplicate adapter patterns:
- `entity-store` — generic entity storage abstraction with Dexie and Drizzle adapters, React hooks
- `todo-client` — todo-specific adapters, hooks, and sync adapter (Dexie + Drizzle)
- `upload-client` — upload-specific adapters, hooks, and state management (Dexie + Drizzle)

Each package defines its own Dexie adapter and Drizzle adapter, leading to repeated patterns.

## Goal
Merge into a single `@pengana/local-db` package that keeps both storage backends (Dexie for web/extension, Drizzle/SQLite for native) with co-located entity logic.

## Proposed Package Structure
```
packages/local-db/
  src/
    adapters/
      dexie/          ← Dexie (IndexedDB) implementations
        db.ts           ← Dexie database definition (all tables)
        todo-adapter.ts
        upload-adapter.ts
        entity-adapter.ts
      drizzle/        ← Drizzle (SQLite) implementations
        todo-adapter.ts
        upload-adapter.ts
        entity-adapter.ts
    hooks/            ← React hooks for both platforms
      use-todos.ts
      use-uploads.ts
      use-entity.ts
    types.ts          ← StorageAdapter interface, entity types
    index.ts          ← public API
  package.json
```

## Implementation Steps
1. Create `packages/local-db/` with new `package.json`
2. Define the unified `StorageAdapter` interface in `types.ts`
3. Move Dexie adapters from all 3 packages → `local-db/src/adapters/dexie/`
4. Move Drizzle adapters from all 3 packages → `local-db/src/adapters/drizzle/`
5. Consolidate the Dexie database definition (single `db.ts` with all tables)
6. Move React hooks from all 3 packages → `local-db/src/hooks/`
7. Set up `package.json` exports:
   ```json
   "exports": {
     ".": "./src/index.ts",
     "./dexie/*": "./src/adapters/dexie/*",
     "./drizzle/*": "./src/adapters/drizzle/*",
     "./hooks/*": "./src/hooks/*",
     "./types": "./src/types.ts"
   }
   ```
8. Update all imports across apps (web, native, extension)
9. Remove the 3 old package directories (`entity-store`, `todo-client`, `upload-client`)
10. Update workspace config

## Key Files to Modify
- Every file that imports from `@pengana/entity-store`, `@pengana/todo-client`, or `@pengana/upload-client`
- `apps/web/package.json`, `apps/native/package.json`, `apps/extension/package.json`
- `packages/ui/package.json` (currently depends on `upload-client`)

## Verification
- [x] All old package imports replaced with `@pengana/local-db` imports
- [x] Dexie database works on web/extension (todos, uploads, entities)
- [x] Drizzle/SQLite works on native (todos, uploads, entities)
- [x] React hooks work on all platforms
- [x] Sync adapters connect properly to `@pengana/sync`
- [x] `pnpm run build` succeeds
- [x] `pnpm run test` passes
- [ ] E2E tests pass on web and native
