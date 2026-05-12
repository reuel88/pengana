# Outdated Package Updates

## Context

`pnpm outdated -r` against `main` (snapshot 2026-05-12) lists ~60 outdated packages across the monorepo, spanning patches, minors, and seven majors. Routine dependency hygiene has fallen behind since the last bulk bump (commit `5f3a8dd`, dev-deps batch).

The goal is to land these updates in small, independently testable phases so that any regression is bisectable to a narrow surface area. CI on `main` runs `pnpm check`, `pnpm check:i18n`, `pnpm check-types`, `pnpm build`, and `pnpm test` (`.github/workflows/ci.yml`) — each phase must pass all of these locally before commit.

**Scope decisions (from planning conversation):**
- TypeScript 6 is **deferred** — handled in a follow-up plan.
- `better-auth` ecosystem (1.5.5 → 1.6.10) is **included** as an isolated phase even though catalog versions are exact-pinned.
- `@vitejs/plugin-react` 5 → 6 is **included** — the `pnpm.overrides` cap in `package.json:60` must be updated.
- `react-native` 0.83 → 0.85 + `react-native-worklets` is **included** — needs Expo alignment and native build verification.

**Security-driven reorder (2026-05-12):** Phases 2 and 3 were pulled forward in response to two CVE reports — see those phase notes.

Branch: `chore/update-outdated-packages`. Catalog edits live in `pnpm-workspace.yaml`; package-local overrides live in the relevant `package.json`.

## Progress

- [x] **Phase 1** — Patch bumps
- [x] **Phase 2** — Security: ORPC stack minor (CVE-2026-33331)
- [x] **Phase 3** — Security: `@hono/node-server` 2.x major (CVE-2026-39406)
- [x] **Phase 4** — Expo SDK patches
- [x] **Phase 5** — Frontend build tooling minor
- [ ] Phase 6 — UI / Tailwind minor
- [ ] Phase 7 — Core library minors (data layer)
- [ ] Phase 8 — TanStack ecosystem minor
- [ ] Phase 9 — React Native ecosystem minor
- [ ] Phase 10 — better-auth ecosystem
- [ ] Phase 11 — Major: `@vitejs/plugin-react` 6
- [ ] Phase 12 — Major: i18n stack (i18next 26 + react-i18next 17)
- [ ] Phase 13 — Major: UI surface (`react-day-picker` 10 + `lucide-react` 1)
- [ ] Phase 14 — Major: React Native 0.85 + worklets
- [ ] Phase 15 — Catalog audit / expansion

---

## Versions Centralised in Catalog

Several deps are managed via `pnpm-workspace.yaml` `catalog:`. Updating these in catalog updates every workspace consumer at once:

```
@better-auth/expo, @logtape/logtape, @orpc/*, @polar-sh/better-auth,
@tanstack/react-form, @tanstack/react-query, react, react-dom,
@types/node, better-auth, dotenv, hono, typescript, vite, vitest, zod
```

When a phase below touches one of these, edit `pnpm-workspace.yaml` (not the dependent `package.json`s).

---

## Per-Phase Verification Loop

After each phase:

```bash
pnpm install
pnpm check          # biome
pnpm check-types    # turbo type-check
pnpm test           # turbo test
pnpm e2e            # turbo e2e
pnpm build          # turbo build
```

For phases touching:
- **i18n**: also run `pnpm check:i18n`
- **web**: also run `pnpm dev:web` and smoke-test the golden path in browser
- **native**: also run `pnpm dev:native` and verify boot on simulator; for Expo bumps, run `npx expo-doctor` from `apps/native`
- **server**: also run `pnpm dev:server` and hit `/rpc` + `/api-reference` endpoints

Commit per phase using the existing `chore(deps):` prefix style. Push and let CI run.

---

## Phases

### Phase 1 — Patch bumps (low-risk batch) ✅ Done

Single batched commit; all are patch-level upgrades with negligible breaking-change risk.

- `@logtape/logtape` 2.0.4 → 2.0.7 *(catalog)*
- `@polar-sh/better-auth` 1.8.3 → 1.8.4 *(catalog)*
- `@polar-sh/sdk` 0.46.4 → 0.47.1 *(packages/auth)*
- `@t3-oss/env-core` 0.13.10 → 0.13.11 *(packages/env)*
- `drizzle-orm` 0.45.1 → 0.45.2 *(packages/db, local-db, email-dev, apps/native)*
- `hono` 4.12.8 → 4.12.18 *(catalog)*
- `react` / `react-dom` 19.2.0 / 19.2.4 → 19.2.6 *(catalog; native uses 19.2.0 — needs catalog or local bump)*
- `recharts` 3.8.0 → 3.8.1 *(packages/ui)*
- `ws` 8.19.0 → 8.20.0 *(apps/server)*

### Phase 2 — Security: ORPC stack minor (CVE-2026-33331) ✅ Done

**CVE-2026-33331** (CVSS 8.2, High) on `@orpc/openapi@1.13.7`. Fix lands in 1.14.x. Catalog edit propagates to all consumers.

- `@orpc/client`, `@orpc/openapi`, `@orpc/server`, `@orpc/tanstack-query`, `@orpc/zod` 1.13.7 → 1.14.3 *(catalog)*

ORPC versions must remain matched across all packages — catalog handles this. Hit `/rpc` and `/api-reference` after bump.

### Phase 3 — Security: `@hono/node-server` 2.x major (CVE-2026-39406) ✅ Done

**CVE-2026-39406** (CVSS 5.3, Medium) on `@hono/node-server@1.19.11` — middleware bypass via repeated slashes in `serveStatic`. Directly affects `apps/server/src/index.ts:113` which mounts `/uploads/*` via `serveStatic({ root: "./" })`.

v2.0 release notes confirmed public API unchanged; breaks are Node 18 EOL (we're on Node 22 per `.nvmrc`) and Vercel adapter removal (unused). All four callsites (`serve`, `serveStatic`, `ServerType`, `getConnInfo` from `/conninfo`) work without code changes.

- `@hono/node-server` 1.19.11 → 2.0.2 *(apps/server only)*

Read the 2.0 release notes for handler signature changes. API surface used in `apps/server/`:
- `serve()` and `serveStatic` (`src/index.ts`)
- `type ServerType` (`src/ws.ts`)
- `getConnInfo` from `@hono/node-server/conninfo` (`src/rate-limit.ts`)

Verification: server boots, `/rpc` + `/api-reference` respond, websocket route still upgrades, rate limiter still attaches client IP. Additionally test `/uploads//<known-file>` (double-slash) to confirm CVE fix applies.

### Phase 4 — Expo SDK patches (all together) ✅ Done

Expo expects matched versions within an SDK release. Bump together and run `npx expo-doctor` in `apps/native`.

**SDK-coherence cleanup also performed in this phase:**
- Reverted native `react` / `react-dom` from 19.2.6 (Phase 1) to `19.2.0` to match Expo SDK 55's expected version (catalog stays at 19.2.6 for web/extension).
- Bumped `react-native` 0.83.2 → `0.83.6` and `react-native-worklets` 0.7.2 → `0.7.4` (still within 0.83.x / 0.7.x — the 0.85 major remains in Phase 14).
- Added explicit native deps `@expo/metro-runtime ~55.0.11` and `@expo/dom-webview ~55.0.6` because pnpm was holding stale transitive versions (55.0.6 / 55.0.3) that failed `expo-router` and `@expo/log-box` peer ranges.

`expo-doctor` ends with 17/18 checks passing; the remaining failure is unrelated duplicate `react`/`react-dom` copies pinned by third-party deps (`@polar-sh/checkout`, `@polar-sh/ui`, `@tanstack/react-store`).

```
expo 55.0.6 → 55.0.23
expo-constants 55.0.9 → 55.0.16
expo-crypto 55.0.10 → 55.0.14
expo-document-picker 55.0.9 → 55.0.13
expo-file-system 55.0.11 → 55.0.19
expo-font 55.0.4 → 55.0.7
expo-image-picker 55.0.13 → 55.0.20
expo-linking 55.0.8 → 55.0.15
expo-localization 55.0.9 → 55.0.13
expo-network 55.0.9 → 55.0.13
expo-router 55.0.7 → 55.0.14
expo-secure-store 55.0.9 → 55.0.13
expo-splash-screen 55.0.12 → 55.0.20
expo-sqlite 55.0.11 → 55.0.15
expo-status-bar 55.0.4 → 55.0.6
expo-system-ui 55.0.10 → 55.0.17
expo-web-browser 55.0.10 → 55.0.15
```

Verification: cold boot the native app, exercise login + a synced todo write (sync engine relies on `expo-sqlite`).

### Phase 5 — Frontend build tooling minor ✅ Done

- `vite` 8.0.0 → 8.0.12 *(catalog)*
- `vitest` 4.1.0 → 4.1.6 *(catalog)*
- `vite-plugin-pwa` 1.0.1 → 1.3.0 *(apps/web)*
- `dotenv` 17.3.1 → 17.4.2 *(catalog)*
- `@types/node` 25.5.0 → 25.7.0 *(catalog)*

Also aligned `apps/web/package.json` `vite` from direct `^8.0.0` pin to `catalog:` (matches `apps/extension`); `vite-plugin-pwa` 1.3.0 added vite 8 to its peer range, clearing the long-standing `unmet peer vite` warning. Residual warning on transitive `workbox-build`/`workbox-window` 7.4.0 (peer wants ^7.4.1) is left as noise — pnpm won't re-resolve a deeply transitive dep without an override and the patch drift is functionally irrelevant.

### Phase 6 — UI / Tailwind minor

- `@base-ui/react` 1.3.0 → 1.4.1 *(packages/ui, web, extension)*
- `@tabler/icons-react` 3.40.0 → 3.44.0 *(apps/web)*
- `@tailwindcss/vite` 4.2.1 → 4.3.0 *(apps/web, extension)*
- `tailwindcss` 4.2.1 → 4.3.0 *(packages/ui + apps/web, extension)*
- `tailwind-merge` 3.5.0 → 3.6.0 *(packages/ui)*
- `shadcn` 4.0.8 → 4.7.0 *(packages/ui, web, extension)*
- `react-resizable-panels` 4.7.3 → 4.11.0 *(packages/ui)*

Smoke-test: open a few primary screens in web app; check resizable panel still drags.

### Phase 7 — Core library minors (data layer)

ORPC was pulled into Phase 2; this phase now covers only the remaining data-layer minors.

- `dexie` 4.3.0 → 4.4.2 *(packages/local-db + consumers)*
- `dexie-react-hooks` 4.2.0 → 4.4.0
- `zod` 4.3.6 → 4.4.3 *(catalog)*

### Phase 8 — TanStack ecosystem minor

- `@tanstack/react-form` 1.28.5 → 1.32.0 *(catalog)*
- `@tanstack/react-query` 5.90.21 → 5.100.10 *(catalog)*
- `@tanstack/react-router` 1.167.4 → 1.169.2 *(apps/web)*

Smoke-test: web app navigation + a form submit (e.g. org creation in `apps/web/src/features/onboarding/`).

### Phase 9 — React Native ecosystem minor

- `@react-navigation/bottom-tabs` 7.15.5 → 7.16.0
- `@react-navigation/drawer` 7.9.4 → 7.10.0
- `@react-navigation/native` 7.1.33 → 7.2.4
- `react-native-gesture-handler` 2.30.0 → 2.31.2
- `react-native-reanimated` 4.2.1 → 4.3.1
- `react-native-safe-area-context` 5.6.2 → 5.7.0
- `react-native-screens` 4.23.0 → 4.25.0

All `native` only. Smoke-test: drawer + tab navigation; reanimated screen transitions.

### Phase 10 — better-auth ecosystem (1.5.5 → 1.6.10)

Three packages must move together (they share an internal protocol):

- `better-auth` 1.5.5 → 1.6.10 *(catalog — change exact pin to `1.6.10` or convert to caret)*
- `@better-auth/expo` 1.5.5 → 1.6.10 *(catalog)*
- `@better-auth/i18n` 1.5.5 → 1.6.10 *(packages/auth)*

Read 1.6 changelog before committing. Focus on `packages/auth/src/` and `apps/web/src/shared/lib/auth-client.ts` (referenced in CLAUDE.md). Verification:
- Web: email/password sign-in, magic link, session list/revoke
- Native: sign-in via Expo client
- Server: `/api/auth/*` endpoints

### Phase 11 — Major: `@vitejs/plugin-react` 6

Two edits required:
1. Bump `pnpm.overrides["@vitejs/plugin-react"]` in root `package.json:60` from `^5.2.0` to `^6.0.0`.
2. Bump the dep in `apps/web/package.json` and `apps/extension/package.json`.

Verification: `pnpm dev:web`, `pnpm dev` for extension, both production builds.

### Phase 12 — Major: i18n stack (i18next 26 + react-i18next 17)

Bundle these — `react-i18next` 17 requires `i18next` 26 peer.

- `i18next` 25.8.18 → 26.1.0 *(packages/i18n, apps/web)*
- `react-i18next` 16.5.8 → 17.0.7 *(packages/i18n)*

Run `pnpm check:i18n`. Smoke-test: language switcher in web, RTL (Arabic/Hebrew) layout.

### Phase 13 — Major: UI surface (`react-day-picker` 10 + `lucide-react` 1)

These are independent but small enough to bundle into one UI-focused phase.

- `react-day-picker` 9.14.0 → 10.0.0 *(packages/ui)*
- `lucide-react` 0.577.0 → 1.14.0 *(packages/ui, web, extension)*

`lucide-react` 1.x has renamed and removed some icons — grep `lucide-react` imports across the repo and verify each is still exported.

### Phase 14 — Major: React Native 0.85 + worklets

- `react-native` 0.83.2 → 0.85.3 *(apps/native)*
- `react-native-worklets` 0.7.2 → 0.8.3 *(apps/native)*

Confirm Expo SDK 55 supports RN 0.85 (check Expo SDK release notes — if not, defer until SDK 56). Required steps after bump:
1. `cd apps/native && npx expo-doctor`
2. Clean native artifacts: `rm -rf ios/build android/.gradle android/build`
3. Reinstall pods if iOS local build: `cd ios && pod install`
4. Full simulator boot + login + sync round-trip

If Expo SDK 55 caps RN at 0.83, **skip this phase** and open a follow-up tracking ticket for SDK 56.

### Phase 15 — Catalog audit / expansion

Consolidate every dep used in **2+ workspaces** into `pnpm-workspace.yaml` `catalog:` so future bumps stay single-edit. Closes existing version drift (e.g. `tailwindcss` `^4.0.15` in extension/web vs `^4.2.1` in ui).

**Drift policy:** Resolve drift by choosing the highest existing range (no implicit npm-latest bump in this phase).

**Candidates to add to catalog**

| Dep | Resolved catalog version | Workspaces |
|---|---|---|
| `tailwindcss` | `^4.2.1` (highest of `^4.0.15` / `^4.2.1`) | extension, web, @pengana/ui |
| `@types/react` | `^19.2.14` (style normalised) | native, web, extension, local-db, org, ui |
| `@types/react-dom` | `^19.2.3` | extension, web |
| `dexie` | `^4.0.11` | local-db, native, web, extension |
| `dexie-react-hooks` | `^4.2.0` | local-db, native, web, extension |
| `drizzle-orm` | `^0.45.2` | db, local-db, email-dev, native |
| `shadcn` | `^4.0.8` | ui, web, extension |
| `@base-ui/react` | `^1.3.0` | ui, web, extension |
| `lucide-react` | `^0.577.0` | ui, web, extension |
| `tw-animate-css` | `^1.2.5` | ui, web, extension |
| `@logtape/logtape` | `^2.0.7` | server, @pengana/auth |
| `@tailwindcss/vite` | `^4.0.15` | extension, web |
| `i18next` | `^25.8.18` | web, @pengana/i18n |
| `drizzle-kit` | `^0.31.10` | db, native |
| `next-themes` | `^0.4.6` | ui, web |
| `sonner` | `^2.0.5` | ui, web |
| `pg` | `^8.17.1` | db, e2e |
| `@types/pg` | `^8.20.0` | db, e2e |

**Explicitly excluded:** Expo SDK packages (`expo-*`, `@expo/*`), React Native (`react-native`, `react-native-*`), Tauri/WXT, single-workspace deps, and deps already in catalog.

**Steps:**
1. Add the 18 entries above to `pnpm-workspace.yaml` `catalog:`.
2. Replace every direct pin in each consumer `package.json` with `"catalog:"`.
3. `pnpm install` — confirm no new peer warnings beyond the pre-existing set.
4. Verification: `pnpm check-types`, `pnpm test`, `pnpm e2e`, `pnpm build`.

**Smoke test:** None needed — this is a pure pin-consolidation; resolved versions don't change (drift cases resolve up only).

---

## Critical Files Likely Touched

- `pnpm-workspace.yaml` — catalog version bumps (most phases)
- `package.json` (root) — `pnpm.overrides` for `@vitejs/plugin-react` (Phase 11)
- `apps/web/package.json`, `apps/extension/package.json` — web/extension-specific deps
- `apps/native/package.json` — Expo + RN packages
- `apps/server/package.json` — hono node-server, ws
- `packages/auth/package.json` — better-auth, polar
- `packages/ui/package.json` — Tailwind, lucide, day-picker, base-ui
- `packages/i18n/package.json` — i18next, react-i18next

## Out-of-Scope (deferred)

- **TypeScript 5.9.3 → 6.0.3** — affects every workspace via catalog; warrants its own plan with separate type-error triage.

## Rollback

Each phase is a single commit. If CI fails on a pushed phase, `git revert <sha>` and reopen the phase as its own investigation.
