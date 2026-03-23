# Task 6: Simplify State Management (Replace xState)

## Status: Done
## Dependencies: Tasks 3-4 (sync and client data consolidation) — sync coordination patterns must be settled first
## Difficulty: Medium

## Why Sixth
With sync and client data layers consolidated, the xState machines that coordinate them can be simplified. This is lower priority than the structural refactors but reduces bundle size and cognitive overhead.

## What Was Done

Audit found xState was used in exactly ONE place: the onboarding flow. Sync coordination already used event listeners + imperative methods (no state machines). The onboarding machine was a linear flow replaced with a plain `useReducer`.

### Changes Made

1. **Replaced xState machine with `onboardingReducer`** in `packages/org-client/src/machines/onboarding-machine.ts`
   - Exported `OnboardingStep` type, `OnboardingEvent` type, `getInitialStep()`, and `onboardingReducer()`
   - Same state transitions, same event types — just a plain reducer instead of `setup().createMachine()`

2. **Rewrote tests** in `packages/org-client/src/machines/onboarding-machine.test.ts`
   - 9 test cases covering all transitions (up from 8), no xState `createActor` dependency

3. **Updated `useOnboarding` hooks** in both web and native
   - `useMachine(onboardingMachine)` → `useReducer(onboardingReducer, hasPendingInvitations, getInitialStep)`
   - Return type changed from xState `[State, Send]` to `[OnboardingStep, Dispatch<OnboardingEvent>]`

4. **Updated view components** in both web and native
   - `state.matches({ organizationStep: "viewInvitations" })` → `step === "viewInvitations"`
   - `send()` calls unchanged (same event objects)

5. **Removed xState from all package.json files**
   - `packages/org-client/package.json` — removed `xstate` peer dep
   - `apps/web/package.json` — removed `xstate` + `@xstate/react`
   - `apps/native/package.json` — removed `xstate` + `@xstate/react`

6. **Updated CLAUDE.md** — "User Lifecycle State Management" section now references `useReducer` and `UserLifecycleContext` instead of xState machines and actors

### Sync Coordination (No Change Needed)
The task doc originally assumed xState was used for sync coordination. Audit confirmed sync uses:
- `SyncRuntime` class with snapshot-based subscriptions
- Event listeners for online/foreground detection
- `setInterval` for periodic sync
- WebSocket + `SharedNotifyManager` for realtime sync
- No state machines anywhere in the sync system

## Key Files Modified
- `packages/org-client/src/machines/onboarding-machine.ts` — xState machine → reducer
- `packages/org-client/src/machines/onboarding-machine.test.ts` — rewritten for reducer
- `packages/org-client/src/index.ts` — updated exports
- `apps/web/src/features/onboarding/hooks/use-onboarding.ts` — `useMachine` → `useReducer`
- `apps/web/src/features/onboarding/ui/views/onboarding-view.tsx` — `state.matches()` → `step ===`
- `apps/native/src/features/onboarding/use-onboarding.ts` — `useMachine` → `useReducer`
- `apps/native/src/app/onboarding.tsx` — `state.matches()` → `step ===`
- `packages/org-client/package.json` — removed xstate peer dep
- `apps/web/package.json` — removed xstate + @xstate/react
- `apps/native/package.json` — removed xstate + @xstate/react
- `CLAUDE.md` — updated lifecycle section

## Verification
- [x] No xState imports remain in the codebase
- [x] Bundle size reduced (~38 KiB: precache 1913 KiB → 1875 KiB)
- [x] `pnpm run build` succeeds
- [x] `pnpm run test` passes (all 7 suites, including 9 onboarding reducer tests)
- [x] `pnpm run check` passes (0 errors)
