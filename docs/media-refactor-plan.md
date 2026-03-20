# Media Refactor Plan

## Goal

Refactor `media` to follow the same architectural shape as `todo` without forcing the UI to be identical. The target is shared offline-first data and mutation wiring across web, extension, and native, while preserving media-specific presentation such as drag-and-drop upload, thumbnails, and upload status.

## Why

Today `todo` is built around shared client-side abstractions:

- shared data hook: `useTodos`
- shared mutation wiring: `useTodoListWiring`
- thin page shell that composes sync context, input, list, and devtools

`media` currently keeps too much orchestration in the web feature itself:

- server query + invalidation
- local query + merge logic
- delete flow
- upload enqueueing
- scope-sensitive behavior

That shape will make extension and native support harder than it needs to be.

## Non-Goals

- Do not make `MediaGrid` look or behave exactly like `TodoList`
- Do not over-generalize media and todo into a single shared CRUD abstraction
- Do not rewrite all three platforms at once

## Target Architecture

Keep the media UI distinct, but move the state and behavior toward the todo model.

Page shell responsibilities:

- choose personal vs org scope
- mount the appropriate sync provider
- render `ConnectivityBanner`
- render media input and media list widgets
- optionally render `SyncDevtools`

Shared media client responsibilities:

- read scoped local media records
- join local media with attachment metadata
- expose derived media view models
- centralize upload, retry, delete, and attachment-related handlers
- centralize validation and sync triggers

Platform widget responsibilities:

- `DropZone` / file-picker UI
- `MediaGrid` / list UI
- platform-specific preview and file-access behavior

## Phases

### Phase 1: Audit And Stabilize Current Web Media

Goal: remove obvious drift and correctness risks before extracting shared APIs.

Tasks:

- document the current media flows for upload, retry, delete, and list rendering
- align local media reads with scope semantics instead of filtering only by `userId`
- confirm personal vs org behavior matches the server contract
- define the minimum media view model needed by all platforms

Exit criteria:

- web media behavior is scope-correct
- the current behavior is clearly mapped before extraction starts

### Phase 2: Extract Shared Media Client Layer

Goal: create the media equivalent of the todo client primitives.

Proposed package surface:

- `useMedia` (returns unified view of local+server media)
- `useMediaListWiring` (composes handlers and config)
- `useMediaHandlers` (low-level actions, mirroring `useTodoHandlers`)
- `createMediaActions`
- media config helpers for personal and org scope if needed

Responsibilities:

- local entity reads from `media` and `mediaAttachments`
- stable merge of local and synced media state
- handlers for upload enqueue, delete, retry, and detach
- shared validation for type and size
- scope-aware inputs: `scopeType`, `scopeId`, `organizationId`, `userId`

Design constraints:

- keep upload transport and storage pluggable like todo file handling
- avoid baking React Query or web RPC assumptions into the shared hook
- prefer existing `@pengana/upload-client` primitives instead of duplicating them

Exit criteria:

- web can render media via shared client hooks instead of page-local orchestration
- the extracted APIs are usable by extension and native

### Phase 3: Thin The Web Media Feature

Goal: make the web feature match the todo page ownership model.

Tasks:

- reduce `media-page.tsx` to page composition and scope selection
- keep `DropZone` as a presentational input shell backed by shared upload wiring
- keep `MediaGrid` as a presentational list shell backed by shared list wiring
- add `ConnectivityBanner`
- add `SyncDevtools` if the page remains useful for sync debugging

Exit criteria:

- web media page mostly composes shared hooks and UI widgets
- server fetch and local merge logic no longer live directly in the page

## Recommended File Direction

Likely shared additions:

- `packages/upload-client/src/hooks/use-media.ts`
- `packages/upload-client/src/hooks/use-media-list-wiring.ts`
- `packages/upload-client/src/hooks/use-media-handlers.ts`
- `packages/upload-client/src/lib/media-config.ts`
- `packages/upload-client/src/lib/media-actions.ts` updates if needed

Likely web simplifications:

- `apps/web/src/features/media/media-page.tsx`
- `apps/web/src/features/media/use-standalone-upload.ts`
- `apps/web/src/features/media/media-grid.tsx`

## Tradeoffs

Pros:

- one mental model for todo and media
- easier future cross-platform rollout
- less page-local orchestration
- fewer scope and sync inconsistencies
- more testable shared behavior

Cons:

- upfront refactor cost before shipping native and extension media
- some media behavior is inherently different from todo and should stay different
- risk of premature abstraction if the shared API is made too generic

## Recommendation

Refactor `media` to work more like `todo` at the data, sync, and mutation layer. Keep the media UI separate. The right convergence point is the shared client architecture, not visual or component-level sameness.

## Deferred Follow-Up

Extension and native media screens are intentionally deferred. The output of this plan should make those additions easier later, but they are not part of the current refactor scope.

## Validation Checklist

- personal and org media are scoped consistently in local and server-backed reads
- offline upload, retry, and delete behavior work through shared wiring
- attached media and standalone media coexist cleanly in one model
- future extension and native implementations can provide their own file-input UI without forking business logic
- sync diagnostics remain visible where needed
