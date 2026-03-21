# Task 6: Simplify State Management (Replace xState)

## Status: Not Started
## Dependencies: Tasks 3-4 (sync and client data consolidation) — sync coordination patterns must be settled first
## Difficulty: Medium

## Why Sixth
With sync and client data layers consolidated, the xState machines that coordinate them can be simplified. This is lower priority than the structural refactors but reduces bundle size and cognitive overhead.

## Current State
xState 5 is used for:
- **Onboarding machine** (`apps/web/src/machines/onboarding-machine.ts`) — manages the onboarding flow
- **Sync coordination** — manages sync state transitions across the app
- xState adds ~15KB+ to the bundle and requires understanding state machine concepts

## Goal
Replace xState with simpler, lighter patterns where the flows are essentially linear.

## Proposed Replacements

### Onboarding
**Current**: xState machine with states and transitions.
**Proposed**: Route guard + React context with a status enum.

```typescript
type OnboardingStatus = 'loading' | 'needs-org' | 'needs-profile' | 'complete'

// Context provider checks lifecycle data and sets status
// Route guard reads status and redirects accordingly
```

- The existing `requireAuthAndOrg()` route guard in `apps/web/src/lib/auth-client.ts` already does most of this
- The shared `fetchUserLifecycleData()` in `packages/org-client/src/lib/user-lifecycle.ts` provides the data

### Sync Coordination
**Current**: xState machine managing sync states.
**Proposed**: Simple pub/sub event emitter or a lightweight store (e.g., Zustand if needed).

```typescript
// Simple event emitter for sync triggers
const syncBus = new EventTarget()
syncBus.dispatchEvent(new CustomEvent('sync-needed', { detail: { scope: 'personal' } }))
```

## Implementation Steps
1. Audit all xState usage — list every machine and where it's consumed
2. For onboarding:
   - Create a simple `OnboardingContext` with status enum
   - Migrate onboarding components to read from context instead of xState
   - Remove the onboarding machine
3. For sync coordination:
   - Replace with event emitter or simple state in the sync runtime
   - Update consumers to use the new pattern
4. Remove `xstate` and `@xstate/react` from all `package.json` files
5. Update `packages/org-client/` (has xState as a peer dependency)

### Note on CLAUDE.md
The project CLAUDE.md describes a future "User Actor" pattern using xState. If xState is removed, update that section to describe the simpler context-based approach instead.

## Key Files to Modify
- `apps/web/src/machines/onboarding-machine.ts` — replace or remove
- `apps/web/src/features/onboarding/` — update to use new pattern
- `apps/web/src/lib/auth-client.ts` — may simplify route guards
- `packages/org-client/package.json` — remove xState peer dep
- `apps/web/package.json`, `apps/native/package.json` — remove xState deps
- `CLAUDE.md` — update User Lifecycle section

## Verification
- [ ] No xState imports remain in the codebase
- [ ] Onboarding flow works: new user → org creation → app access
- [ ] Invitation acceptance flow works
- [ ] Sync coordination still triggers correctly
- [ ] Bundle size reduced (check with `vite-bundle-analyzer` or similar)
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run test` passes
- [ ] E2E onboarding tests pass
