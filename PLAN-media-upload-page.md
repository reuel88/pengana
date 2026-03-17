# Media Upload Page

## Context

Media is now a standalone entity with a separate `mediaAttachments` join table. The upload infrastructure (queue, transport, lifecycle callbacks) is fully entity-agnostic — `entityType`/`entityId` are optional throughout. What's missing is the web UI: a drag-and-drop page to upload standalone media and view all media in the current scope.

## What's Already Done

- `media` table: standalone entity (`id, userId, url, mimeType, scopeType, scopeId, organizationId, ...`)
- `mediaAttachments` table: join table (`mediaId, entityType, entityId, position`)
- Upload handler (`packages/api/src/routers/upload.ts`): supports standalone uploads (no entity required)
- Transport (`packages/upload-client/src/adapters/upload-transport.ts`): `entityType`/`entityId` optional
- Upload queue (`packages/sync-engine/src/core/upload-queue.ts`): `enqueue({ id, fileUri, mimeType, entityType?, entityId? })`
- `enqueueUpload(fileUri, mimeType, mediaId, entityType?, entityId?)` — from `SyncContextValue`
- `addMedia(db, options)` — creates local media record without requiring entity
- Lifecycle callbacks: `onCompleted(url, mediaId)` / `onFailed(mediaId)` — entity-agnostic

## Remaining Changes

### 1. Add `findMediaByScope` query

**File:** `packages/db/src/media-queries.ts`

```ts
export async function findMediaByScope(opts: {
  scopeType: "personal" | "org";
  scopeId: string;
  limit?: number;
  offset?: number;
}): Promise<MediaRow[]>
```

Select all media where `scopeType` + `scopeId` match, ordered by `createdAt desc`, with pagination. Returns all media regardless of whether it has attachments or not.

### 2. Create `listMedia` API procedure

**File:** Create `packages/api/src/routers/media.ts`

```ts
export const mediaRouter = {
  listMedia: protectedProcedure
    .route({ method: "GET", path: "/media/list", summary: "List media" })
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
    .output(envelopeOutput(z.array(mediaOutputSchema)))
    .handler(...)
}
```

- Scope from session: if `activeOrganizationId` → `scopeType: "org", scopeId: activeOrgId`; else `scopeType: "personal", scopeId: userId`
- Calls `findMediaByScope`
- Returns media with their attachments (join with `findMediaAttachmentsByMediaIds` or similar)

### 3. Register media router

**File:** `packages/api/src/routers/index.ts`

- Add `media: mediaRouter` to `appRouter`

### 4. Create `/media` route

**File:** Create `apps/web/src/routes/media.tsx`

Follow `todos.tsx` pattern:
```ts
export const Route = createFileRoute("/media")({
  component: MediaRoute,
  beforeLoad: requireAuthAndOrg,
});
```

Pass `userId` and `organizationId` to `MediaPage`.

### 5. Create media feature module

**Directory:** `apps/web/src/features/media/`

**`media-page.tsx`** — Page layout:
- `DropZone` component at the top
- `MediaGrid` below, combining:
  - Server data from `media.listMedia` query (uploaded media)
  - Local IndexedDB data for in-progress uploads (queued/uploading/failed items not yet on server)

**`drop-zone.tsx`** — Drag-and-drop upload area:
- Native HTML5 DnD: `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop`
- Hidden `<input type="file" multiple accept="image/jpeg,image/png,image/heic,application/pdf">`
- Visual states: idle (dashed border), drag-over (highlighted)
- On file drop/select → delegate to `useStandaloneUpload` hook
- Show validation errors via toast (wrong type, too large)

**`media-grid.tsx`** — Grid of all media:
- Image thumbnails (use `localUri` for pending, `url` for uploaded), PDF icon placeholder
- Upload status indicators: queued (pulsing), uploaded (green), failed (red + retry)
- Source badge: standalone vs todo attachment (from attachments data)
- Delete button for standalone media only (via `upload.deleteMedia` RPC)
- Empty state

**`use-standalone-upload.ts`** — Upload hook:
- Gets `enqueueUpload` and `triggerSync` from `useSync()`
- On file selection:
  1. Validate MIME type against `ALLOWED_MIME_TYPES` and size against `MAX_FILE_SIZE_BYTES`
  2. `const mediaId = await addMedia(appDb, { userId, localUri: "", mimeType, scopeType, scopeId, organizationId, createdBy })` — creates record, returns `mediaId`
  3. `await storeFileInIndexedDB(appDb, mediaId, file)` — store in IndexedDB using the returned `mediaId`
  4. `await updateMediaLocalUri(mediaId, "indexeddb://" + mediaId)` — update the media record with the correct localUri
  5. `enqueueUpload("indexeddb://" + mediaId, mimeType, mediaId)` — no entityType/entityId for standalone
  6. `triggerSync()`
- The queue processes it automatically; lifecycle callbacks update local status
- Invalidate `listMedia` query after upload completes

### 6. Add nav link

**File:** `apps/web/src/widgets/header.tsx`

Add `{ to: "/media", label: t("nav.media") }` to `links` array.

### 7. Add i18n keys

**Files:** `packages/i18n/src/locales/*/common.json` — add `nav.media`
**Files:** Create `packages/i18n/src/locales/*/media.json` with keys:
- `dropzone.idle`, `dropzone.active`, `dropzone.rejected.type`, `dropzone.rejected.size`
- `grid.empty`, `upload.success`, `upload.error`, `delete.success`
- `source.standalone`, `source.todo`

## Key Files & Reuse

| What | Where |
|------|-------|
| `addMedia` | `packages/upload-client/src/lib/media-actions.ts` |
| `storeFileInIndexedDB` | `packages/upload-client/src/adapters/dexie-file-store.ts` |
| `useSync` (enqueueUpload, triggerSync) | `packages/sync-engine/src/hooks/use-sync-context.ts` |
| `ALLOWED_MIME_TYPES`, `MAX_FILE_SIZE_BYTES` | `packages/sync-engine/src/constants/allowed-mime-types.ts` |
| `appDb` | `apps/web/src/shared/db.ts` |
| `requireAuthAndOrg` | `apps/web/src/shared/lib/auth-client.ts` |
| `upload.deleteMedia` | `packages/api/src/routers/upload.ts` |
| Route pattern | `apps/web/src/routes/todos.tsx` |

## Verification

1. Navigate to `/media` — drop zone + empty state renders
2. Drag an image → appears in grid as "queued" → processes to "uploaded"
3. Click drop zone → file picker, select multiple → all queue and upload
4. Drop a non-image/non-PDF → rejection toast
5. Drop a >10MB file → size rejection toast
6. Go offline → drop a file → stored locally, shows as "queued"
7. Go back online → queue processes, status becomes "uploaded"
8. Delete a standalone file → removed from grid
9. Upload a todo attachment on `/todos` → appears in `/media` grid with "Todo" badge
10. Switch org → grid shows org media; switch back → personal media
