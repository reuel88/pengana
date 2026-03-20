# Global Sync Providers — Persist Across Navigation

## Problem

SyncProvider and OrgSyncProvider are mounted inside page components (todo-page, media-page) behind conditional `&&` rendering. Any navigation or tab switch unmounts the provider, calling `engine.shutdown()` which is **terminal** — sets `shuttingDown = true`, aborts in-flight sync, and the engine cannot be reused. Every navigation causes a full engine teardown and rebuild (new adapter, transport, WebSocket connection, initial sync). Queued uploads can be lost.

Affected files:
- `apps/web/src/widgets/todo-page.tsx` (lines 133-158)
- `apps/web/src/features/media/media-page.tsx`
- `apps/native/src/widgets/todo-page.tsx`
- `apps/native/src/widgets/todo-page.web.tsx` (lines 23-42)
- `apps/extension/src/widgets/todo-page.tsx` (lines 145-170)

## Root Cause

Both `useSync()` and `useOrgSync()` are **aliases for the same hook** — both read from `SyncContext`. This works today only because personal and org content are never co-rendered. To mount both providers at the root, we need **separate contexts**.

## Solution

Move sync providers to the app root so they persist across all navigation. This requires:

### Phase 1: Add OrgSyncContext to sync-engine package

**`packages/sync-engine/src/context/sync-context.ts`** — Add alongside existing exports:
- `OrgSyncContext` — new `createContext<SyncContextValue | null>(null)`
- `OrgSyncDevtoolsContext` — new `createContext<SyncDevtoolsValue | null>(null)`
- `useOrgSync()` — reads from `OrgSyncContext`, throws if null
- `useOrgSyncDevtools()` — reads from `OrgSyncDevtoolsContext`, throws if null

**`packages/sync-engine/src/index.ts`** — Export the 4 new symbols.

### Phase 2: Update each app's sync-context.tsx

All 4 files follow the same change pattern:
- `apps/web/src/features/sync/sync-context.tsx`
- `apps/native/src/features/sync/sync-context.tsx`
- `apps/native/src/features/sync/sync-context.web.tsx`
- `apps/extension/src/features/sync/sync-context.tsx`

Changes per file:
1. Import `OrgSyncContext`, `OrgSyncDevtoolsContext` from `@pengana/sync-engine`
2. Change re-exports: `useOrgSync` and `useOrgSyncDevtools` now come from the package's new dedicated hooks (remove the aliases like `useSync as useOrgSync`)
3. `OrgSyncProvider` wraps children in `OrgSyncContext`/`OrgSyncDevtoolsContext` instead of `SyncContext`/`SyncDevtoolsContext`
4. `SyncProvider` stays unchanged

### Phase 3: Mount providers at app root

#### Web — `apps/web/src/routes/__root.tsx`

Create a `SyncProviderGate` component (`apps/web/src/features/sync/sync-provider-gate.tsx`) that:
1. Reads session via `authClient.useSession()`
2. If `userId` and `activeOrganizationId` exist, renders both `<SyncProvider>` and `<OrgSyncProvider>` wrapping children
3. Otherwise renders children without providers (login/signup pages don't need sync)

Mount between `OrgDesignPresetPreviewProvider` and the layout div:
```tsx
<OrgDesignPresetPreviewProvider>
  <OrgDesignPresetSync />
  <SyncProviderGate>
    <div className={...}>
      {!hideHeader && <Header />}
      <Outlet />
    </div>
  </SyncProviderGate>
  <Toaster richColors />
</OrgDesignPresetPreviewProvider>
```

#### Native — `apps/native/src/app/_layout.tsx`

Create `apps/native/src/features/sync/sync-provider-gate.tsx`. In `RootLayoutInner` (line 178-193), wrap the `<Stack>` inside `SyncProviderGate`:
- `userId` from `session?.user?.id`
- `organizationId` from `session?.session?.activeOrganizationId`
- Only render providers when both values exist

#### Extension — No change needed

Extension background service already manages long-lived engines. The popup is a single view with no multi-page navigation.

### Phase 4: Remove providers from page components

Strip `<SyncProvider>` and `<OrgSyncProvider>` wrappers from:
- `apps/web/src/widgets/todo-page.tsx`
- `apps/web/src/features/media/media-page.tsx`
- `apps/native/src/widgets/todo-page.tsx`
- `apps/native/src/widgets/todo-page.web.tsx`

Consumer hooks (`useSync()`, `useOrgSync()`) continue to work — they now read from the root-level contexts.

### Phase 5: Fix SyncDevtools scope (low priority, dev-only)

`SyncDevtools` always calls `useSync()`/`useSyncDevtools()`. After this change, org tab devtools would show personal engine data. Fix by adding a `scope: "personal" | "org"` prop and calling the appropriate hook.

## Files Summary

| File | Action |
|------|--------|
| `packages/sync-engine/src/context/sync-context.ts` | Add OrgSyncContext, OrgSyncDevtoolsContext, useOrgSync, useOrgSyncDevtools |
| `packages/sync-engine/src/index.ts` | Export new symbols |
| `apps/web/src/features/sync/sync-context.tsx` | Update OrgSyncProvider context + re-exports |
| `apps/native/src/features/sync/sync-context.tsx` | Update OrgSyncProvider context + re-exports |
| `apps/native/src/features/sync/sync-context.web.tsx` | Update OrgSyncProvider context + re-exports |
| `apps/extension/src/features/sync/sync-context.tsx` | Update OrgSyncProvider context + re-exports |
| `apps/web/src/features/sync/sync-provider-gate.tsx` | **New** — conditional provider wrapper |
| `apps/native/src/features/sync/sync-provider-gate.tsx` | **New** — conditional provider wrapper |
| `apps/web/src/routes/__root.tsx` | Mount SyncProviderGate |
| `apps/native/src/app/_layout.tsx` | Mount SyncProviderGate |
| `apps/web/src/widgets/todo-page.tsx` | Remove provider wrappers |
| `apps/web/src/features/media/media-page.tsx` | Remove provider wrappers |
| `apps/native/src/widgets/todo-page.tsx` | Remove provider wrappers |
| `apps/native/src/widgets/todo-page.web.tsx` | Remove provider wrappers |

## Trade-offs

- Both sync engines run simultaneously from login — two WebSocket connections, two periodic syncs. Acceptable: cost is minimal vs. teardown/rebuild on every navigation.
- Organization switching correctly rebuilds engines: `useSyncEngine`'s effect deps include `scopeId` and `deps`, so changing org triggers cleanup + fresh init.

## Verification

1. Open app, navigate between pages — confirm no engine teardown in DevTools Network tab (WebSocket stays connected)
2. Switch personal/org tabs — confirm no reconnection
3. Queue an upload, navigate away, come back — confirm upload completed
4. Log out then log in — confirm engines shut down on logout, fresh engines on login
5. Switch organizations — confirm both engines rebuild with new org context
6. Open extension — confirm no regression

## Note on React `<Activity />`

React's `<Activity />` component would be ideal for this (keeps components mounted but hidden). However, it's only available in unstable/canary builds, not stable React 19.2.0. When it reaches stable, it could replace the `SyncProviderGate` approach.
