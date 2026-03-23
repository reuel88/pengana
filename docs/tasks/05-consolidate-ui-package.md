# Task 5: Decouple UI Package from Business Logic

## Status: Done
## Dependencies: Task 4 (client data consolidation) — `@pengana/upload-client` must be merged into `@pengana/local-db` first since UI currently depends on it
## Difficulty: Medium

## Why Fifth
With the client data layer consolidated (Task 4), we can now cleanly remove business logic dependencies from `@pengana/ui` and make it a pure presentational component library.

## What Was Done
6 of 67 UI components had business logic imports (type-only imports from `@pengana/local-db` and `@pengana/sync`, plus 3 value imports for file validation in `todo-item.tsx`). Rather than moving these genuinely presentational components out (which would duplicate code shared between web and extension), we:

1. **Created `packages/ui/src/types.ts`** — local type definitions for `SyncStatus`, `UploadStatus`, `MediaAttachmentTarget`, `MediaAttachmentInfo`, and `MediaListItem`, mirroring only the fields the UI actually renders
2. **Replaced all business package imports** in the 6 affected components (`todo-item`, `todo-list`, `attachment-indicator`, `attachment-list`, `media-grid-item`, `media-grid-list`) with imports from the local types file
3. **Moved file validation to props** — `todo-item.tsx` now accepts `validateFile` (callback) and `maxAttachments` (number) props instead of importing `isAllowedMimeType`, `MAX_FILE_SIZE_BYTES`, `MAX_ATTACHMENTS` from `@pengana/sync/upload`
4. **Updated app-level wrappers** in `apps/web/src/features/todo/todo-list.tsx` and `apps/extension/src/features/todo/todo-list.tsx` to pass `validateFile` and `maxAttachments` props
5. **Removed all business deps from `packages/ui/package.json`**: `@pengana/org` (was unused/dead dep), `@pengana/local-db` (dependency), `@pengana/sync` (peerDependency)
6. **Added `"./types"` export** to `packages/ui/package.json` for apps that need the shared types

## Key Files Modified
- `packages/ui/src/types.ts` — new local type definitions
- `packages/ui/src/components/todo-item.tsx` — local types + `validateFile`/`maxAttachments` props
- `packages/ui/src/components/todo-list.tsx` — local types, threads new props through
- `packages/ui/src/components/attachment-indicator.tsx` — local types
- `packages/ui/src/components/attachment-list.tsx` — local types
- `packages/ui/src/components/media-grid-item.tsx` — local types
- `packages/ui/src/components/media-grid-list.tsx` — local types
- `packages/ui/package.json` — removed business deps, added types export
- `apps/web/src/features/todo/todo-list.tsx` — passes validateFile + maxAttachments
- `apps/extension/src/features/todo/todo-list.tsx` — passes validateFile + maxAttachments

## Verification
- [x] `@pengana/ui` has zero imports from business packages
- [x] `packages/ui/package.json` has no business-logic peer/dependencies
- [x] No circular dependency warnings
- [x] `pnpm run build` succeeds
- [x] `pnpm run test` passes (all 7 suites)
