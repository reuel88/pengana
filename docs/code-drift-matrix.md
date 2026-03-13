# App Code Drift Matrix

This matrix compares overlapping same-purpose modules across `apps/native`, `apps/web`, and `apps/extension`. The classifications are based on logic shape and ownership, not just filename similarity.

## Legend

- `Aligned`: same responsibility and near-same structure
- `Minor`: same responsibility with platform-specific seams
- `Major`: same name or purpose, but materially different architecture or behavior

## Matrix

| Module | Native | Web | Extension | Drift | Why |
| --- | --- | --- | --- | --- | --- |
| `use-sync-engine` | `apps/native/src/features/sync/use-sync-engine.ts` | `apps/web/src/features/sync/use-sync-engine.ts` | `apps/extension/src/features/sync/use-sync-engine.ts` | `Major` | Native and web both call `useSyncEngineCore`, but extension does not. Extension proxies state through background messaging, while the actual engine lives in `apps/extension/src/entrypoints/background.ts`. |
| `sync-context` | `apps/native/src/features/sync/sync-context.tsx` | `apps/web/src/features/sync/sync-context.tsx` | `apps/extension/src/features/sync/sync-context.tsx` | `Major` | Native and web expose `core` and `devtools`; extension passes a flatter sync state through `SyncContext` and skips `SyncDevtoolsContext`. |
| Sync engine platform deps | `apps/native/src/features/sync/use-sync-engine.ts` | `apps/web/src/features/sync/platform-deps.ts` | `apps/extension/src/entrypoints/background.ts` | `Major` | Same sync domain, different implementations. Native adds websocket ticketing, realtime transport, and foreground handling; web adds query invalidation and file cleanup hooks; extension constructs `SyncEngine` manually in the background worker. |
| `todo-input` | `apps/native/src/features/todo/todo-input.tsx` | `apps/web/src/features/todo/todo-input.tsx` | `apps/extension/src/features/todo/todo-input.tsx` | `Minor` | Core behavior is the same: add todo, then `triggerSync()`. Native uses custom React Native UI and local state; web and extension use a shared UI component with different error handling. |
| `todo-list` | `apps/native/src/features/todo/todo-list.tsx` | `apps/web/src/features/todo/todo-list.tsx` | `apps/extension/src/features/todo/todo-list.tsx` | `Major` | All render todos, but native wires actions directly, web delegates to `TodoListConnected`, and extension uses shared `useTodoListWiring` plus IndexedDB-backed file handling. |
| `todo-page` | `apps/native/src/widgets/todo-page.tsx` | `apps/web/src/widgets/todo-page.tsx` | `apps/extension/src/widgets/todo-page.tsx` | `Major` | Native is a single-user page gated by Drizzle migrations; web supports personal and organization tabs plus sync devtools; extension is a smaller popup-oriented personal page with language switching. |
| `sync-devtools` | `apps/native/src/features/sync-devtools/sync-devtools.tsx` | `apps/web/src/features/sync-devtools/sync-devtools.tsx` | n/a | `Minor` | Behavior is close in native and web, but web splits the feature into a lazy wrapper and implementation while native keeps a single in-app component with platform-specific UI. |
| Upload queue exports | `apps/native/src/features/sync/entities/upload-queue/index.ts` | `apps/web/src/features/sync/entities/upload-queue/index.ts` | `apps/extension/src/features/sync/entities/upload-queue/index.ts` | `Major` | Native exports native adapter, schema, and transport; web exports in-memory upload helpers; extension exposes IndexedDB storage and transport only. Same area, different ownership and capabilities. |
| Upload queue transport | `apps/native/src/features/sync/entities/upload-queue/transport.ts` | `apps/web/src/features/sync/entities/upload-queue/transport.ts` | `apps/extension/src/features/sync/entities/upload-queue/transport.ts` | `Major` | Native uploads Expo file data directly, web uses an in-memory upload transport, and extension uses Dexie or IndexedDB-backed retrieval and cleanup logic. |
| `orpc.ts` | `apps/native/src/shared/api/orpc.ts` | `apps/web/src/shared/api/orpc.ts` | `apps/extension/src/shared/api/orpc.ts` | `Major` | Native and web both integrate React Query; extension intentionally does not. Native also handles auth cookies differently for React Native vs web. |
| `auth-client.ts` | `apps/native/src/shared/lib/auth-client.ts` | `apps/web/src/shared/lib/auth-client.ts` | `apps/extension/src/shared/lib/auth-client.ts` | `Major` | All create Better Auth clients, but native uses Expo and SecureStore, web adds Polar, magic link, and route guard helpers, and extension is a thinner web-style client. |
| `auth-flow` | `apps/native/src/shared/lib/auth-flow.ts` | `apps/web/src/shared/lib/auth-flow.ts` | n/a | `Major` | Native only normalizes redirect targets, while web manages pending-invitation persistence and consumption. Same name, materially different responsibility. |
| `auth-mutation` | `apps/native/src/shared/lib/auth-mutation.ts` | `apps/web/src/shared/lib/auth-mutation.ts` | n/a | `Minor` | Both wrap the same core auth mutation helper, but native binds React Native alerts and web binds toast notifications. |
| `language-switcher` | `apps/native/src/features/i18n/language-switcher.tsx` | `apps/web/src/features/i18n/language-switcher.tsx` | `apps/extension/src/features/i18n/language-switcher.tsx` | `Major` | Same feature, different UI and persistence behavior. Native owns a custom modal and RTL restart flow; web and extension wrap a shared UI component but differ in URL and persistence behavior. |
| `onboarding-create-org` | `apps/native/src/features/onboarding/onboarding-create-org.tsx` | `apps/web/src/features/onboarding/onboarding-create-org.tsx` | n/a | `Minor` | Same onboarding step and callbacks, but native owns the org form directly while web delegates to a separate org-create form and shared UI shell. |
| `onboarding-invitations` | `apps/native/src/features/onboarding/onboarding-invitations.tsx` | `apps/web/src/features/onboarding/onboarding-invitations.tsx` | n/a | `Minor` | Same invitation-accept flow, but native uses package invitation actions directly with app-local UI while web routes through a local wrapper and shared invitation card component. |
| `onboarding-invite-members` | `apps/native/src/features/onboarding/onboarding-invite-members.tsx` | `apps/web/src/features/onboarding/onboarding-invite-members.tsx` | n/a | `Major` | Same onboarding step, but native uses a local batch-invite hook, native validation schema, and custom controls, while web uses shared org-client hooks and web form components. |
| `use-onboarding` | `apps/native/src/features/onboarding/use-onboarding.ts` | `apps/web/src/features/onboarding/use-onboarding.ts` | n/a | `Minor` | Both use the same onboarding machine and complete on the same state transition; navigation and lifecycle side effects differ. |
| `org-switcher` | `apps/native/src/features/org/org-switcher.tsx` | `apps/web/src/features/org-management/org-switcher.tsx` | n/a | `Major` | Both handle organization switching, but native owns a modal picker plus create flow while web uses a dropdown and dialog with more shared package logic. |
| `use-org-queries` | `apps/native/src/shared/hooks/use-org-queries.ts` | `apps/web/src/shared/hooks/use-org-queries.ts` | n/a | `Major` | Native keeps a local wrapper implementation; web re-exports package hooks directly. The surface is similar, but ownership has drifted. |
| `use-sign-out` | `apps/native/src/shared/hooks/use-sign-out.ts` | `apps/web/src/shared/hooks/use-sign-out.ts` | n/a | `Minor` | Same basic purpose, but web adds redirect behavior and callback wiring; native signs out and clears query cache directly. |

## Overall Findings

- `apps/native` and `apps/web` have moderate drift. They often share the same conceptual API, but web has pushed more behavior into shared packages and factories while native still owns more app-local logic.
- `apps/extension` has high drift relative to the other two apps. It shares names and some local-Dexie concepts, but the sync architecture is materially different.
- The expectation that `use-sync-engine` should be relatively the same across all three apps is not true in the current repo state.

## Best Candidates For Cleanup

- Sync stack: `use-sync-engine`, `sync-context`, upload queue wiring
- Todo stack: `todo-list`, `todo-page`
- Shared client layer: `orpc.ts`, `auth-client.ts`
- Auth and onboarding ownership: `auth-flow`, `onboarding-invite-members`, `org-switcher`
- Shared hooks ownership: `use-org-queries`

## Notes

- This is a sampled audit of overlapping same-purpose modules, not a full mechanical diff of every file under the three app directories.
- The matrix reflects the repo state inspected on March 13, 2026.
