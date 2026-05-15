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
- [x] **Phase 6** — UI / Tailwind minor
- [x] **Phase 7** — Core library minors (data layer) — zod 4.4.3 landed under `typescript-6-upgrade.md` Phase 6 (Rung 1 + Rung 2 paired, plus i18n peer-resolution dedup)
- [x] **Phase 8** — TanStack ecosystem minor
- [~] **Phase 9** — React Native ecosystem minor — reanimated 4.3.1 deferred (needs worklets 0.8 from Phase 14)
- [x] **Phase 10** — better-auth ecosystem
- [x] **Phase 11** — Major: `@vitejs/plugin-react` 6
- [x] **Phase 12** — Major: i18n stack (i18next 26 + react-i18next 17)
- [x] **Phase 13** — Major: UI surface (`react-day-picker` 10 + `lucide-react` 1)
- [ ] **Phase 14** — Major: React Native 0.85 + worklets — fully deferred to 14b (worklets 0.8 + reanimated 4.3 trial landed then reverted, see notes)
- [x] **Phase 15** — Catalog audit / expansion

---

## Versions Centralised in Catalog

Several deps are managed via `pnpm-workspace.yaml` `catalog:`. Updating these in catalog updates every workspace consumer at once:

```text
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

```text
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

### Phase 6 — UI / Tailwind minor ✅ Done

- `@base-ui/react` ^1.3.0 → ^1.4.1 *(packages/ui, web, extension)*
- `@tabler/icons-react` ^3.40.0 → ^3.44.0 *(apps/web)*
- `@tailwindcss/vite` ^4.0.15 → ^4.3.0 *(apps/web, extension)*
- `tailwindcss` ^4.0.15 / ^4.2.1 → ^4.3.0 *(packages/ui + apps/web, extension)* — drift closed
- `tailwind-merge` ^3.3.1 → ^3.6.0 *(packages/ui)*
- `shadcn` ^4.0.8 → ^4.7.0 *(packages/ui, web, extension)* — CLI only, no runtime change
- `react-resizable-panels` ^4.7.3 → ^4.11.0 *(packages/ui)*

Side benefit: the long-standing `@tailwindcss/vite → unmet peer vite` warning is gone (Tailwind 4.3 added vite 8 to its peer range).

### Phase 7 — Core library minors (data layer) ✅ Done

ORPC was pulled into Phase 2; this phase covers the remaining data-layer minors.

- `dexie` ^4.0.11 → ^4.4.2 *(packages/local-db + extension, native, web)* ✅
- `dexie-react-hooks` ^4.2.0 → ^4.4.0 ✅
- `zod` ^4.3.6 → ^4.4.3 *(catalog)* ✅ — landed under `typescript-6-upgrade.md` Phase 6

**zod 4.4 history:** Initially deferred because `@tanstack/react-form` 1.28.5 + zod 4.4 hit `TS2589: Type instantiation is excessively deep and possibly infinite` across every TanStack-form schema callsite and OOM'd `tsc` (>8GB heap). Retry under `@tanstack/react-form` 1.32 reproduced the same blow-up, confirming the root cause was in zod's 4.4 type machinery (rewritten internal optionality machinery produces heavier-to-resolve types even for plain `z.object({ ... })` schemas, multiplied across ~20 `useZodForm` callsites).

**Resolution:** Landed under the TS 6 plan's Phase 6, where Rung 1 (catalog bump alone) reproduced the OOM under TS 6 as well, so Rung 2 was paired in: `packages/org/src/hooks/use-zod-form.ts` widened the schema constraint from `z.ZodType<T, any, any>` to `z.ZodType<any, any, any>` (`T` still pins through `defaultValues` and `onSubmit`'s `value`, so callsite ergonomics are unchanged). A third edit aligned `packages/i18n`'s zod resolution with the catalog to dedupe a pnpm peer-resolution holdover at 4.3.6. See `docs/plans/typescript-6-upgrade.md` Phase 6 for the full diagnosis and verification trail.

### Phase 8 — TanStack ecosystem minor ✅ Done

- `@tanstack/react-form` ^1.28.5 → ^1.32.0 *(catalog)*
- `@tanstack/react-query` ^5.90.21 → ^5.100.10 *(catalog)*
- `@tanstack/react-router` ^1.167.4 → ^1.169.2 *(apps/web)*

Side benefit: cleared three pre-existing peer warnings (`@tanstack/react-query-devtools`, `@tanstack/react-router-devtools`, `@tanstack/router-plugin`) that all wanted newer query/router versions.

Phase 7's deferred `zod` 4.4 bump was retried under this phase's TanStack form 1.32 — same OOM/TS2589, so the deferral stood at the time. It eventually landed under `typescript-6-upgrade.md` Phase 6 with a paired `useZodForm` constraint relaxation (see Phase 7 above).

### Phase 9 — React Native ecosystem minor ⚠️ Partial

- `@react-navigation/bottom-tabs` 7.15.5 → 7.16.0 ✅
- `@react-navigation/drawer` 7.9.4 → 7.10.0 ✅
- `@react-navigation/native` 7.1.33 → 7.2.4 ✅
- `react-native-gesture-handler` 2.30.0 → 2.31.2 ✅
- `react-native-reanimated` 4.2.1 → 4.3.1 ❌ **Deferred to Phase 14**
- `react-native-safe-area-context` 5.6.2 → 5.7.0 ✅
- `react-native-screens` 4.23.0 → 4.25.0 ✅

**Reanimated deferral:** `react-native-reanimated@4.3.1` requires `react-native-worklets@0.8.x` (peer dep), but we're on worklets 0.7.4 (paired with RN 0.83.x from Phase 4). Bumping reanimated alone produces an unmet peer warning. Coupling it with the worklets 0.8 + RN 0.85 bump in Phase 14 keeps the matched-version constraint clean. Phase 14 should now also include `react-native-reanimated 4.3.1`.

**Expo-doctor regression:** Drops from 17/18 (Phase 4) → 16/18. The new failure is the "packages match versions required by installed Expo SDK" check — Expo SDK 55's recommended pins (`~2.30.0` / `~5.6.2` / `~4.23.0`, etc.) lag the bumped versions. The drift is minor-only and all five verification checks (`check`, `check-types`, `test`, `e2e`, `build`) pass. Expo SDK 56 is expected to widen the recommended ranges; until then this warning is acceptable.

All `native` only. Smoke-test: drawer + tab navigation; reanimated screen transitions.

### Phase 10 — better-auth ecosystem (1.5.5 → 1.6.10) ✅ Done

Three packages bumped together (shared internal protocol):

- `better-auth` 1.5.5 → 1.6.10 *(catalog, exact pin retained)*
- `@better-auth/expo` 1.5.5 → 1.6.10 *(catalog, exact pin retained)*
- `@better-auth/i18n` ^1.5.4 → 1.6.10 *(packages/auth, switched from caret to exact pin to match catalog and avoid an `@better-auth/core ^1.6.11` peer-warning when caret resolved up to 1.6.11)*

Changelog scan for 1.6.0–1.6.10 surfaced no breaking changes affecting our config surface — the 1.6 line is security/patch only (device-auth binding, magic-link race fix, OIDC provider hardening, invitation-takeover guard). `oidc-provider` deprecation in favor of `@better-auth/oauth-provider` does not affect us (not used). Drizzle adapter import path `better-auth/adapters/drizzle` still works in 1.6.

`@polar-sh/better-auth@1.8.4` peer range (`better-auth: ^1.4.12`) covers 1.6.10 — no need to bump.

Verification: all five checks (`check`, `check-types`, `test`, `e2e`, `build`) green; 83/83 e2e tests pass including the org sign-in/invitation flows that exercise the `organization` plugin hooks. `expo-doctor` baseline unchanged at 16/18 from Phase 9.

### Phase 11 — Major: `@vitejs/plugin-react` 6 ✅ Done

Two edits landed:
1. `pnpm.overrides["@vitejs/plugin-react"]` in root `package.json` bumped `^5.2.0` → `^6.0.0`.
2. `apps/web/package.json` devDep bumped `^5.2.0` → `^6.0.0`.

`apps/extension` did **not** need a direct-dep edit — it relies on `@wxt-dev/module-react@1.2.2` to auto-wire the React plugin, and that module's peer range (`^4.4.1 || ^5.0.0 || ^6.0.0`) already accepts v6. The root override forces v6 across the transitive graph.

**v6 changelog impact:** Babel removed from the plugin (use `@rolldown/plugin-babel` if needed). We call `react()` with no options in `apps/web/vite.config.ts`, so the babel-option removal is a no-op. Vite 8+ requirement already satisfied. Node engine `^20.19.0 || >=22.12.0` satisfied (running 24.x locally).

**Tooling tweak:** Added `!**/expo-env.d.ts` to `biome.json` `files.includes`. The Expo-CLI-regenerated `apps/native/expo-env.d.ts` (gitignored) was emitted without a trailing newline by the post-Phase-9 `expo-doctor` run and started failing `pnpm check`. Ignoring this managed artifact prevents future drift from blocking the lint gate.

Verification: all five checks (`check`, `check-types`, `test`, `e2e`, `build`) green; 83/83 e2e tests pass; forced `pnpm turbo build --filter=web --force` rebuilt cleanly against v6 (PWA generates, chunks emit, no transform errors). Extension prod build stable at 1.29 MB.

### Phase 12 — Major: i18n stack (i18next 26 + react-i18next 17) ✅ Done

Bundled per the peer constraint (`react-i18next@17` peer-requires `i18next: >= 26.0.10`):

- `i18next` `^25.8.18` → `^26.1.0` *(packages/i18n + apps/web; web has its own direct pin, not catalog-managed)*
- `react-i18next` `^16.5.8` → `^17.0.7` *(packages/i18n)*

**No code changes required.** All of i18next 26's removed APIs (`initImmediate`, legacy `interpolation.format` callback, `showSupportNotice`, `simplifyPluralSuffix`, `@babel/polyfill`) were unused in our four bootstraps (`web.ts`, `native.ts`, `extension.ts`, `server.ts`). react-i18next 17's only breaking change — the `transKeepBasicHtmlNodesFor` serialization fix — does not apply because the codebase has zero `<Trans>` usage. v26.0.6 security note about `$t()` nesting with `escapeValue: false` does not apply either (no `$t(` callsites).

Side effect: web `i18n-*.js` chunk dropped from 62.83 kB → 62.53 kB (i18next 26 dropped `@babel/runtime`). Extension bundle stable at 1.29 MB.

**Tooling tweak:** Added `!**/.claude/settings.local.json` to `biome.json` `files.includes` (continuing the Phase 11 pattern for ignoring user-local, gitignored Claude Code state). The file uses 2-space indentation that conflicts with biome's tab config; ignoring it prevents the lint gate from blocking on a file no developer manually edits.

Verification: all five checks plus `pnpm check:i18n` green (no missing keys, no invalid translations across 11 locales × 10 namespaces); 83/83 e2e tests pass; forced `pnpm turbo build --filter=web --force` rebuilt cleanly against the new versions; no deprecation warnings in install output.

### Phase 13 — Major: UI surface (`react-day-picker` 10 + `lucide-react` 1) ✅ Done

Two independent UI library majors bumped together:

- `react-day-picker` `^9.14.0` → `^10.0.0` *(packages/ui)*
- `lucide-react` `^0.577.0` → `^1.14.0` *(packages/ui, apps/web, apps/extension)*

**react-day-picker v10 was a no-op for our codebase** — `packages/ui/src/components/calendar.tsx` (the only callsite, also unused by any app) doesn't touch any of the removed v9 aliases (`fromMonth`/`toMonth`, `initialFocus`, `formatMonthCaption`, `isMatch`, `components.Button`, etc.). It uses `DayPicker`, `getDefaultClassNames`, type `DayButton`, type `Locale` — all preserved in v10. lucide-react was the same story for icon names — the 0.577 → 1.14 jump preserved all 19 distinct icons we import (including the un-suffixed `Bell`/`CircleAlert`/`Globe`/`Loader2`/`Mail`/`Moon`/`Sun` style).

**Real friction came from the v1.14 ESM layout change**, surfaced by `apps/web/src/shared/lib/lucide-react-adapter.tsx`. That file uses a deep import path (`lucide-react/dist/esm/...`) on purpose: `apps/web/vite.config.ts:55` aliases bare `^lucide-react$` to this adapter file, so the adapter itself must bypass the alias to get at the real package without an infinite loop. v1.14 renamed the ESM bundle from `dist/esm/lucide-react.js` → `dist/esm/lucide-react.mjs` and dropped the `.d.mts` type sibling. Fix landed in this phase:

- Updated both import lines in `lucide-react-adapter.tsx` from `lucide-react/dist/esm/lucide-react.js` → `lucide-react/dist/esm/lucide-react.mjs`.
- Added `apps/web/src/shared/lib/lucide-react-deep-path.d.ts` — a one-line module shim (`declare module "lucide-react/dist/esm/lucide-react.mjs" { export * from "lucide-react"; }`) so TypeScript sees the same exports for the deep path as for the bare specifier. Without it, tsc emits TS7016 because v1.14 ships type declarations only at the top-level entry.

Side notes:
- The diagnostic path took two false turns first — production build said "rolldown failed to resolve" the old `.js` path; the fix to bare `"lucide-react"` looked clean at type-check but produced a blank page in e2e because of the alias loop. The deep `.mjs` path + type shim is the durable solution.
- Web prod bundle stable (122 entries / 1456.30 KiB); extension prod bundle stable at 1.29 MB.

Verification: all five checks green; 83/83 e2e pass; forced web rebuild clean. No code changes needed in `packages/ui/src/components/calendar.tsx` for react-day-picker v10.

### Phase 14 — Major: React Native 0.85 + worklets ❌ Fully Deferred to 14b

**Status:** Worklets 0.8.3 + reanimated 4.3.1 were landed as a "partial Phase 14" then **reverted** in the same branch after the simulator-boot smoke test surfaced the regression that purely-JS verification (`check`/`check-types`/`test`/`e2e`/`build`) couldn't catch.

**Final state of `apps/native/package.json`:**
- `react-native-worklets` stays at `0.7.4` (matches Expo Go SDK 55's bundled native ABI)
- `react-native-reanimated` stays at `4.2.1`
- `react-native` stays at `0.83.6`
- `react` / `react-dom` stay at `19.2.0`

**Why the partial attempt was reverted:** Booting on Expo Go (`exp://…` URL on a simulator) crashed at module-load time with `[Error: Exception in HostFunction: <unknown>]` repeated three times, followed by "missing default export" warnings on every drawer-layout route (`(drawer)/_layout.tsx`, `(drawer)/(org)/_layout.tsx`, `(drawer)/settings/_layout.tsx`) and a final `[Layout children]: No route named "(drawer)" exists in nested children` failure. Diagnosis: **Expo Go for SDK 55 ships a pre-compiled native worklets 0.7.x**; loading worklets 0.8.3 JS against that older C++ ABI fails on the first worklet declaration, which cascades into reanimated, which cascades into `@react-navigation/drawer`, which cascades into the layouts losing their default export. There is no JS-only fix — the only paths forward would be (a) build a custom dev client with `expo run:ios` / `run:android` so worklets 0.8.3 native code gets compiled in, or (b) revert. We chose (b) to preserve the Expo Go dev loop until the SDK 56 cohort upgrade lands.

**Lesson for future native bumps:** purely-JS verification (`pnpm e2e` here is web-only Playwright) misses native-ABI regressions. Any phase touching `react-native`, `react-native-worklets`, `react-native-reanimated`, or `react-native-gesture-handler` needs an explicit simulator-boot gate before merging, even if `apps/native/src/` has zero direct callsites for the bumped package.

**Side note on the noisy peer warning:** The `react-native-reanimated 4.3.1 / unmet peer react-native-worklets@0.8.x` warning that has appeared on every install since Phase 9 went **silent** after the revert too. pnpm appears to resolve the transitive 4.3.1 from `@react-navigation/drawer@7.10` differently when our direct pin is back at reanimated 4.2.1. Watch for it on future installs.

**Phase 14b (deferred):** see "Out-of-Scope (deferred)" section below.

### Phase 15 — Catalog audit / expansion ✅ Done

Consolidated every cross-workspace dep into `pnpm-workspace.yaml` `catalog:`. Future bumps for any of these now require a single edit in the workspace yaml instead of 2–6 lockstep `package.json` edits.

**17 new catalog entries added** (versions reflect resolved state post Phase 13):

```yaml
'@base-ui/react': ^1.4.1
'@tailwindcss/vite': ^4.3.0
'@types/pg': ^8.20.0
'@types/react': ^19.2.14
'@types/react-dom': ^19.2.3
dexie: ^4.4.2
dexie-react-hooks: ^4.4.0
drizzle-kit: ^0.31.10
drizzle-orm: ^0.45.2
i18next: ^26.1.0
lucide-react: ^1.14.0
next-themes: ^0.4.6
pg: ^8.17.1
shadcn: ^4.7.0
sonner: ^2.0.5
tailwindcss: ^4.3.0
tw-animate-css: ^1.2.5
```

`@logtape/logtape` was already cataloged from Phase 1 — no work.

**Three intentional pin-style drift-ups** (all `@types/*`, all resolved version unchanged today):
- `apps/web` `@types/react`: exact `19.2.14` → catalog caret `^19.2.14`
- `apps/web` `@types/react-dom`: exact `19.2.3` → catalog caret `^19.2.3`
- `apps/native` `@types/react`: tilde `~19.2.14` → catalog caret `^19.2.14`

These align all consumers to the same caret style so a future single catalog edit propagates everywhere. Current resolved versions identical.

**Consumer swaps applied:** ~36 direct pins across 10 `package.json` files replaced with `"catalog:"` (`packages/ui`, `apps/web`, `apps/extension`, `apps/native`, `apps/e2e`, `packages/db`, `packages/local-db`, `packages/email-dev`, `packages/i18n`, `packages/org`). The `react` / `react-dom` pins in `apps/native` were **intentionally NOT moved** — they stay at exact `19.2.0` because Phase 4 deliberately diverged from the catalog to match Expo SDK 55's expected version.

**Lockfile diff:** 1665 lines changed (1061 insertions / 604 deletions) but the resolved-version numbers (left side of `version:` colons) are byte-identical for every catalog entry. The diff is entirely peer-disambiguation hash recompute — pnpm rebuilt the peer graph and added `@react-native/metro-config@0.85.3` to some peer-disambiguation suffixes. No new direct version, no new peer warning.

**Verification:** all five checks green; 83/83 e2e pass; pre-existing peer warnings unchanged (tsdown→typescript@^6, vite-plugin-pwa→workbox@^7.4.1 chain, local-db→react-dom@19.2.6 chain — three pre-existing entries, no new ones).

**Out of scope (correctly excluded):** Expo SDK (`expo`, `expo-*`, `@expo/*`), React Native (`react-native`, `react-native-*`), Tauri (`@tauri-apps/cli`), WXT (`wxt`, `@wxt-dev/*`), and the single-workspace deps `@phosphor-icons/react`, `@tabler/icons-react`, `@remixicon/react`, `postcss`.

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
- **Phase 14b — RN 0.85 + React 19.2.3 + Expo SDK 56 cohort** (split out of Phase 14 on 2026-05-14, then partial-Phase-14 worklets/reanimated bumps reverted same day). Trigger: Expo SDK 56 stable release. Currently only `expo@56.0.0-preview.X` exists. Items to land together: `react-native` → 0.85.3, `react-native-worklets` → 0.8.x, `react-native-reanimated` → 4.3.x, `react` / `react-dom` → 19.2.3+ (RN 0.85's peer), `expo` + `expo-*` + `@expo/*` → SDK 56 cohort. The worklets bump must happen inside this cohort so the new native ABI lands at the same time as the dev-client switch — Expo Go for SDK 55 ships worklets 0.7.x natively and crashes (`Exception in HostFunction`) on a worklets 0.8 JS bundle. Steps after bump: stop using Expo Go for this app (switch to a custom dev client built via `expo run:ios` / `run:android`), `cd apps/native && npx expo-doctor`, `rm -rf ios/build android/.gradle android/build`, full simulator boot + login + sync round-trip.

## Rollback

Each phase is a single commit. If CI fails on a pushed phase, `git revert <sha>` and reopen the phase as its own investigation.
