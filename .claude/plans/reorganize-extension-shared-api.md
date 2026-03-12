# Plan: Reorganize Extension `shared/api/` Folder

## Context
The extension app's `shared/api/` folder mixes two concerns: server communication (`orpc.ts`, `session-schema.ts`) and internal browser extension messaging (`background-messages.ts`, `send-background-message.ts`). Other apps (web, native) use `shared/api/` strictly for server communication. This cleanup aligns the extension with that convention.

## Changes

### 1. Create `apps/extension/src/shared/messaging/`
Move internal browser extension communication files here:
- `shared/api/background-messages.ts` → `shared/messaging/background-messages.ts`
- `shared/api/send-background-message.ts` → `shared/messaging/send-background-message.ts`

### 2. Update imports
Find all files importing from `shared/api/background-messages` or `shared/api/send-background-message` and update paths to `shared/messaging/...`.

Files likely affected (verify at execution time):
- `apps/extension/src/entrypoints/background.ts`
- `apps/extension/src/entrypoints/popup/App.tsx`
- Any content scripts importing `sendBackgroundMessage`

### 3. Keep in `shared/api/`
These stay since they talk to the backend:
- `orpc.ts`
- `session-schema.ts`

## Result
- `shared/api/` = server communication only (consistent with web/native apps)
- `shared/messaging/` = popup ↔ background worker communication
- `shared/lib/` = SDK clients and utilities (auth-client stays here)

## Verification
1. `pnpm --filter extension typecheck` — no broken imports
2. `pnpm --filter extension build` — extension builds successfully
3. Manually test popup ↔ background communication still works

## Notes
- Do this in a separate cleanup PR, not on `feat/polar`
- Only 2 files move, so the diff should be minimal
