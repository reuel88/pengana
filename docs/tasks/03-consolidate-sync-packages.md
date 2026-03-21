# Task 3: Consolidate Sync Packages into `@pengana/sync`

## Status: Complete
## Dependencies: None
## Difficulty: High

## Why Third
The sync layer is the largest area of complexity (6 packages). Consolidating it reduces the dependency graph significantly and sets the stage for the client data consolidation in Task 4.

## Current State
6 separate packages handle sync-related concerns:
- `sync-engine` — core sync protocol, conflict resolution, event log
- `sync-runtime` — runtime orchestration, coordinator
- `realtime-transport` — WebSocket client, reconnection, fallback polling
- `storage-health` — IndexedDB quota monitoring
- `upload-queue` — upload queue schema, retry logic
- (portions of `entity-store` also contain sync adapter interfaces)

## Goal
Merge into a single `@pengana/sync` package with clear internal module boundaries.

## Proposed Package Structure
```
packages/sync/
  src/
    core/           ← from sync-engine (protocol, conflict resolution, event log)
    runtime/        ← from sync-runtime (coordinator, initialization)
    transport/      ← from realtime-transport (WebSocket, polling, reconnection)
    upload/         ← from upload-queue (queue schema, retry)
    health/         ← from storage-health (quota monitoring, cleanup triggers)
    types.ts        ← consolidated type exports
    index.ts        ← public API
  package.json
```

## Implementation Steps
1. Create `packages/sync/` with new `package.json`
2. Move `sync-engine/src/core/` → `sync/src/core/`
3. Move `sync-engine/src/schemas/`, `sync-engine/src/types/` → `sync/src/core/`
4. Move `sync-runtime/src/` → `sync/src/runtime/`
5. Move `realtime-transport/src/` → `sync/src/transport/`
6. Move `upload-queue/src/` → `sync/src/upload/`
7. Move `storage-health/src/` → `sync/src/health/`
8. Set up `package.json` exports matching the old package boundaries (for gradual migration):
   ```json
   "exports": {
     ".": "./src/index.ts",
     "./core/*": "./src/core/*",
     "./runtime/*": "./src/runtime/*",
     "./transport/*": "./src/transport/*",
     "./upload/*": "./src/upload/*",
     "./health/*": "./src/health/*",
     "./types": "./src/types.ts",
     "./schemas": "./src/core/schemas.ts"
   }
   ```
9. Update all imports across apps (web, native, extension, server) and remaining packages
10. Remove the 5 old package directories
11. Update `turbo.json` if needed
12. Update root `pnpm-workspace.yaml` if needed

## Sync Protocol Improvements (can be done incrementally after consolidation)
- **Hybrid logical clocks (HLC)** instead of wall-clock timestamps — solves clock skew
- **Per-field LWW registers** instead of whole-record conflict resolution — avoids losing concurrent edits to different fields
- **Single `SyncAdapter` interface** that both Dexie and Drizzle implement
- **Media reconciliation in core sync loop** rather than as a separate concern

## Key Files to Modify
- Every file that imports from `@pengana/sync-engine`, `@pengana/sync-runtime`, `@pengana/realtime-transport`, `@pengana/storage-health`, or `@pengana/upload-queue`
- `apps/web/package.json`, `apps/native/package.json`, `apps/extension/package.json`
- `packages/api/package.json` (if it imports sync types)
- Root workspace config

## Verification
- [ ] All old package imports replaced with `@pengana/sync` imports
- [ ] No references to old package names in any `package.json`
- [ ] Sync works end-to-end: offline edits sync when back online
- [ ] WebSocket reconnection still works
- [ ] Upload queue retry still works
- [ ] Storage health monitoring still works
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run test` passes
- [ ] E2E sync tests pass
