# TypeScript 6 Upgrade

## Context

`pnpm-workspace.yaml` (snapshot 2026-05-14) pins `typescript: ^5` in catalog, resolving to 5.9.3 across all 14 workspace consumers. TypeScript 6.0.x is now stable, and `docs/plans/outdated-package-updates.md` explicitly deferred this bump to its own plan because it "affects every workspace via catalog [and] warrants its own plan with separate type-error triage" (Out-of-Scope section, line 347).

The goal is to land 5.9.3 → ~6.0.3 in small, independently testable phases so any regression is bisectable to a narrow surface area. CI on `main` runs `pnpm check`, `pnpm check:i18n`, `pnpm check-types`, `pnpm build`, and `pnpm test` (`.github/workflows/ci.yml`) — each phase must pass all of these locally before commit.

**Scope decisions:**
- Target: latest stable `~6.0.x` (verify at execution; pin style mirrors the defensive `zod: ~4.3.6` tilde already in catalog so a future 6.1 minor stays opt-in).
- `apps/extension`'s direct pin `typescript: ^5.9.3` (the only outlier — every other workspace uses `catalog:`) is migrated to catalog in Phase 1 so the bump itself is a single catalog edit.
- **Sequencing:** must land **before** Phase 14b (RN 0.85 + Expo SDK 56 cohort) from `outdated-package-updates.md` so TS friction stays isolated from native-ABI friction.
- Phase 6 (zod 4.4.3 retry) is included as an opportunistic follow-up — the prior plan's Phase 7 deferral was rooted in TS2589 depth, and TS 6's constraint-inference work may unblock it.

Branch: `chore/typescript-6-upgrade`. Catalog edits live in `pnpm-workspace.yaml`; the extension drift fix lives in `apps/extension/package.json`.

## Progress

- [x] **Phase 0** — Branch setup
- [x] **Phase 1** — Baseline pin & extension drift fix
- [x] **Phase 2** — TS 6 recon (doc commit, no code change)
- [x] **Phase 3** — Pre-emptive type fixes on 5.9.3
- [x] **Phase 4** — Catalog bump to ~6.0.3
- [x] **Phase 5** — Peer-warning cleanup
- [ ] **Phase 6** — Optional: retry zod 4.4.3

---

## TypeScript Surface Area (audit snapshot, 2026-05-14)

**14 workspace consumers of `typescript`** — all via `catalog:` except `apps/extension`:

| Workspace | Pin | Type-check command | Notes |
|---|---|---|---|
| `apps/e2e` | catalog | `tsc --noEmit` | Playwright suite |
| `apps/extension` | **`^5.9.3` (direct)** | `tsc --noEmit` | wxt 0.20.26; also auto-generates `.wxt/tsconfig.json` |
| `apps/native` | catalog | `tsc --noEmit` | Expo SDK 55; generates `expo-env.d.ts` (already in biome ignore list) |
| `apps/server` | catalog | `tsc -b` (composite) | `composite: true`, `outDir: dist`, emits `dist/**` and `.tsbuildinfo` |
| `apps/web` | catalog | `tsc --noEmit` | Vite 8; uses `lucide-react-deep-path.d.ts` shim from Phase 13 |
| `packages/api` | catalog | `tsc --noEmit` | oRPC procedures |
| `packages/auth` | catalog | `tsc --noEmit` | better-auth 1.6.10 |
| `packages/config` | (no dep) | — | Only hosts `tsconfig.base.json` |
| `packages/db` | catalog | `tsc --noEmit` | drizzle-kit 0.31.10 |
| `packages/email-dev` | catalog | `tsc --noEmit` | |
| `packages/env` | catalog | `tsc --noEmit` | |
| `packages/i18n` | catalog | `tsc --noEmit` | i18next 26 |
| `packages/local-db` | catalog | `tsc --noEmit` | dexie 4.4.2 |
| `packages/org` | catalog | `tsc --noEmit` | onboarding reducer |
| `packages/sync` | catalog | `tsc --noEmit` | custom sync engine |
| `packages/ui` | catalog | `tsc --noEmit` | react-day-picker 10, lucide-react 1 |

**Base tsconfig** (`packages/config/tsconfig.base.json`) — every workspace extends this:
- `strict: true`, `verbatimModuleSyntax: true`, `noUncheckedIndexedAccess: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`, `skipLibCheck: true`
- `target: ESNext`, `module: ESNext`, `moduleResolution: bundler`, `lib: ["ESNext"]`
- `exactOptionalPropertyTypes` **off** — TS 6's default is unchanged here, no action.

**TS-version-sensitive deps already in catalog** (per `outdated-package-updates.md` Phase 15):
- `tsdown` (apps/server build) — peer wants `typescript: ^5 || ^6`; the bump silently resolves its pre-existing warning.
- `drizzle-orm ^0.45.2`, `drizzle-kit ^0.31.10` — both ship TS 6-compatible types.
- `zod ~4.3.6` — intentionally pinned tilde to block 4.4.x due to TS2589 depth with `@tanstack/react-form 1.32` (Phase 7 deferral).
- `@orpc/* ^1.14.3`, `better-auth 1.6.10` — recent, expected TS 6-clean.
- `@types/node ^25.7.0`, `@types/react ^19.2.14`, `@types/react-dom ^19.2.3` — current.

**Existing `@ts-expect-error` cluster:** 2 instances in `apps/native/drizzle/migrations.ts` (Babel plugin `.sql` inline-import shim). Not TS-version-sensitive; expected to survive the bump.

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
- **server**: also boot via `pnpm dev:server` and hit `/rpc` + `/api-reference`; tsc -b composite mode requires `rm -rf apps/server/dist apps/server/*.tsbuildinfo` once after the TS bump to bust the producer-version-stamped cache.
- **web**: `pnpm dev:web` + golden-path smoke test in browser.
- **native**: `pnpm dev:native` + `npx expo-doctor` from `apps/native` (must stay at the 16/18 baseline from Phase 9).
- **extension**: `pnpm dev` (in `apps/extension`) + load unpacked extension in Chrome dev mode.

Commit per phase using the `chore(ts):` prefix style. Push and let CI run.

---

## Phases

### Phase 0 — Branch setup ✅ Done

Branch `chore/typescript-6-upgrade` cut from `main@21d5b46` (origin in sync). Baseline verification on the unchanged working tree:

- `pnpm install` — lockfile up to date, no resolution work.
- `pnpm check` — biome, 767 files, no fixes.
- `pnpm check-types` — turbo, 5/5 tasks (full cache hit).
- `pnpm test` — turbo, 7/7 tasks; 155+ tests across `@pengana/api`, `@pengana/local-db`, `@pengana/org`, `@pengana/sync`.
- `pnpm build` — turbo, 3/3 tasks (full cache hit); web PWA bundle stable at 122 entries / 1456.30 KiB.

The untracked file `docs/plans/typescript-6-upgrade.md` (this plan itself) was created on `main` before the branch cut and carries over on the new branch — it will be committed as part of Phase 1.

Original Phase 0 commands (for reference):

```bash
git checkout main
git pull --ff-only
git status                       # must be clean — no uncommitted edits
git switch -c chore/typescript-6-upgrade
```

Sanity-check the starting baseline once on the new branch *before* any edits:

```bash
pnpm install
pnpm check && pnpm check-types && pnpm test && pnpm build
```

All five checks must be green on the branch tip with zero changes applied. If anything fails here, fix on `main` first (separate PR) — the TS upgrade plan assumes a green starting state. No commit in this phase.

### Phase 1 — Baseline pin & extension drift fix ✅ Done

Two edits applied:

1. `pnpm-workspace.yaml:39` — catalog `typescript: ^5` → `~5.9.3`.
2. `apps/extension/package.json:45` — direct pin `"^5.9.3"` → `"catalog:"`.

Lockfile unchanged (`pnpm install` reported "Already up to date"), confirming the resolution is a true no-op (5.9.3 in, 5.9.3 out). The catalog now matches the resolved version exactly and the extension is no longer the sole drift point — Phase 4's single catalog edit will propagate to all 14 workspaces.

**Verification:** all six checks green.
- `pnpm install` — lockfile up to date; 3 pre-existing peer warnings (`tsdown → typescript@^6`, `vite-plugin-pwa → workbox 7.4.1`, `local-db → react-dom 19.2.6`), no new ones.
- `pnpm check` — 767 files, no fixes.
- `pnpm check-types` — 5/5 tasks (4 cached, 1 fresh — extension's tsc invalidated by the pin-form swap).
- `pnpm test` — 7/7 tasks.
- `pnpm build` — 3/3 tasks (2 cached + extension rebuilt; bundle stable at 1.29 MB matching Phase 11/12/13 baseline).
- `pnpm e2e` — 83/83 tests (1m21s), matching the post-Phase-13 baseline.

Original Phase 1 spec (for reference):

1. `pnpm-workspace.yaml` — tighten catalog `typescript: ^5` → `~5.9.3`. Locks the baseline to the version currently resolved so Phase 4's diff is a pure version bump rather than a "loose-caret-also-collapses-to-tilde" combined change.
2. `apps/extension/package.json:45` — replace direct pin `"typescript": "^5.9.3"` with `"typescript": "catalog:"`. No-op resolution change today (catalog now resolves to the same range), but eliminates the only drift point so Phase 4's single catalog edit propagates everywhere.

Verification: full loop. Expected diff: 2 lines + lockfile churn.

### Phase 2 — TS 6 recon ✅ Done

Trial-bumped TypeScript via a root `pnpm.overrides` entry pinning `typescript: ~6.0.3` (npm `latest` dist-tag at 2026-05-15). Ran the full verification loop, captured errors, then reverted the override; lockfile and working tree returned to the post-Phase-1 state.

**Error inventory (full surface area):**

| Workspace | check-types | Error | Backportable to 5.9.3? |
|---|---|---|---|
| `apps/server` | ❌ 1 | `TS5101` — `tsconfig.json:6` — `Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0` | **Yes** — `baseUrl: "."` is unnecessary under `moduleResolution: bundler`; removing it is valid on 5.9 too |
| `apps/web` | ❌ 1 | `TS5101` — `tsconfig.json:13` — same deprecation | **Yes** — same fix |
| `apps/native` | ✅ 0 | — | — |
| `apps/extension` | ✅ 0 | — | — |
| `apps/e2e` | ✅ 0 | — | — |

That's the entire TS 6 error surface — **two identical TS5101 deprecation errors in two tsconfig files.** Zero source-code type errors. None of the red-flag tripwires (TS2589 in TanStack form callsites, `tsc -b` dependent-invalidation, `.expo`/`.wxt` regeneration drift) materialised.

**Other recon signals under TS 6.0.3:**

- `pnpm test` — 7/7 tasks ✅ (155+ tests). Vitest sidesteps tsc, so this primarily validates that nothing about TS 6's emit shape changes runtime semantics.
- `pnpm build` — 3/3 tasks ✅. `tsc -b` deprecation only affects `check-types`; the build path uses `tsdown` (server), Vite (web), and wxt (extension) which all bypass the tsc CLI deprecation gate. Bundle sizes unchanged: web PWA 122 entries / 1456.30 KiB, server tsdown 12 files / 2.03 MB, extension 1.29 MB — matching the Phase 11/12/13 baselines exactly.
- `pnpm e2e` — 81 passed + 2 flaky (`web/attachment-org-isolation` personal-todo isolation, `web/auth-flows` verify-email invalid-token). Both flakies passed on retry and match pre-existing patterns; not TS-related.

**Peer-warning delta** (pnpm install under TS 6 vs 5.9.3):

- **Cleared:** `tsdown → rolldown-plugin-dts → typescript@^6.0.0` (the pre-existing warning from outdated-package-updates Phase 15). Confirms the Phase 5 prediction.
- **Unchanged:** `vite-plugin-pwa → workbox-build/window 7.4.1`, `local-db → react-dom 19.2.6` (both TS-unrelated, pre-existing).
- **No new warnings** introduced by the bump.

**Implication for Phases 3–6:**

- **Phase 3** collapses to a single trivial commit removing `baseUrl: "."` from both `apps/server/tsconfig.json:6` and `apps/web/tsconfig.json:13` (the original "one commit per workspace" rule was written for a heavier error surface; for two identical 1-line tsconfig edits a single combined commit is more idiomatic and matches the prior plan's bundling style for related fixes).
- **Phase 4** (catalog bump) becomes a near-pure version edit — no bundled type fixes needed, since Phase 3 absorbs the only required source change.
- **Phase 5** has one expected warning-resolution event (`tsdown` peer satisfied); no new warnings to chase.
- **Phase 6** (zod 4.4 retry) remains worthwhile but is now a clean A/B test against TS 6, isolated from any other change.

### Phase 3 — Pre-emptive type fixes on 5.9.3 ✅ Done

Phase 2's inventory came back with a single error pattern across two files, so this phase collapsed to one combined commit removing `baseUrl: "."` from both tsconfigs (the original "one commit per workspace" rule was written for a heavier error surface):

- `apps/server/tsconfig.json:6` — removed `"baseUrl": ".",`
- `apps/web/tsconfig.json:13` — removed `"baseUrl": ".",`

**Why this is the right fix (not `ignoreDeprecations`):** under `moduleResolution: "bundler"` (set in both tsconfigs), `paths` entries already resolve relative to the tsconfig file's directory, so `baseUrl: "."` is a no-op alias. TS 6's TS5101 deprecation message offers `"ignoreDeprecations": "6.0"` as an escape hatch, but that just kicks the can to TS 7. Removing the unused option is forward-compatible and shrinks the surface.

`apps/web/tsconfig.json` is a standalone config (does not extend `@pengana/config/tsconfig.base.json`); the unrelated divergence is out of scope here.

**Verification (on TS 5.9.3 — confirming backport):** all six checks green.
- `pnpm check` — 767 files, no fixes.
- `pnpm check-types` — 5/5 tasks (2 cached, 3 fresh including server's `tsc -b` after `apps/server/dist` + `tsconfig.tsbuildinfo` cleanup).
- `pnpm test` — 7/7.
- `pnpm build` — 3/3; web PWA 122 entries / 1456.30 KiB unchanged.
- `pnpm e2e` — 83/83 in 1m20s (no flakies this run).

The two TS5101 errors Phase 2 surfaced are now structurally impossible under TS 6 — Phase 4's catalog bump should be a pure version edit with no bundled type fixes needed.

### Phase 4 — Catalog bump to TS 6 ✅ Done

Single catalog edit: `pnpm-workspace.yaml:39` `typescript: ~5.9.3` → `~6.0.3`. `pnpm install` swapped the resolved version cleanly (`devDependencies: - typescript 5.9.3 + typescript 6.0.3`). Phase 3's `baseUrl` removal absorbed the only required source change, so no bundled type fixes were needed in this commit.

Forced cache bust ran cleanly: `rm -rf apps/server/dist apps/server/tsconfig.tsbuildinfo` followed by `pnpm turbo check-types --force` rebuilt server's composite from scratch alongside the four other type-check tasks — all 5 green.

**Verification:** all six checks plus the native gate.
- `pnpm check` — 767 files, no fixes.
- `pnpm turbo check-types --force` — 5/5 tasks fresh (no cache); zero TS errors anywhere.
- `pnpm test` — 7/7 tasks; 155+ tests across api/local-db/org/sync.
- `pnpm build` — 3/3 tasks; web PWA 122 entries / 1456.30 KiB unchanged, extension 1.29 MB unchanged, server tsdown 12 files / 2.03 MB unchanged.
- `pnpm e2e` — 83/83 tests in 1m21s, no flakies.
- `npx expo-doctor` (in `apps/native`) — **16/18 baseline holds.** Both failures are pre-existing: `duplicate dependencies` (third-party react/react-dom copies from `@polar-sh/*` and `@tanstack/react-store`, per outdated-package-updates Phase 4) and `Expo SDK package versions` (minor patch drift introduced by Phase 9 of outdated-package-updates). **Zero new failures attributable to TS 6.**

**Peer-warning delta** (handover to Phase 5):
- **Cleared as predicted:** `tsdown → rolldown-plugin-dts → typescript@^6.0.0` (was the only TS-related warning under 5.9.3).
- **New warning:** `apps/native → expo → @expo/config → @expo/require-utils → ✕ unmet peer typescript@"^5.0.0 || ^5.0.0-0": found 6.0.3`. Expo SDK 55's internal `@expo/require-utils` has a strict TS 5 peer; functionally fine (expo-doctor + e2e + tests + build all pass), but flagged for Phase 5 documentation.
- **Unchanged pre-existing:** `vite-plugin-pwa → workbox-build/workbox-window 7.4.1`, `local-db → react-dom 19.2.6`.

### Phase 5 — Peer-warning cleanup ✅ Done

Audit of `pnpm install` warnings post-Phase-4 (captured from the catalog-bump install, not from a no-op re-install which doesn't replay the warning block):

| Status | Warning | Action |
|---|---|---|
| ✅ **Cleared** | `apps/server → tsdown 0.22.0 → rolldown-plugin-dts 0.25.0 → ✕ unmet peer typescript@^6.0.0: found 5.9.3` | Resolved automatically by the catalog bump — predicted in Phase 5 spec. |
| ⚠️ **New — accepted** | `apps/native → expo 55.0.23 → @expo/config → @expo/require-utils 55.0.5 → ✕ unmet peer typescript@"^5.0.0 \|\| ^5.0.0-0": found 6.0.3` | **No upstream fix available.** Verified via `npm view @expo/require-utils@latest peerDependencies` — even 56.1.0 (the latest SDK 56 release at audit time) still pins `typescript: ^5.0.0 \|\| ^5.0.0-0`. Expo has not widened the TS peer range across any 55.x or 56.x release. Functionally inert: e2e (83/83), build (3/3 with bundle sizes unchanged), and expo-doctor (16/18 baseline) all pass with TS 6.0.3. **Accepted and documented**, matching the workbox-chain acceptance pattern from `outdated-package-updates.md` Phase 5/15. |
| 🟡 **Unchanged pre-existing** | `apps/web → vite-plugin-pwa 1.3.0 → ✕ unmet peer workbox-build@^7.4.1: found 7.4.0` and `workbox-window@^7.4.1: found 7.4.0` | TS-unrelated. Documented in `outdated-package-updates.md` Phase 5/15. No change. |
| 🟡 **Unchanged pre-existing** | `packages/local-db → react-dom 19.2.6 → ✕ unmet peer react@^19.2.6: found 19.2.4` | TS-unrelated. Documented in `outdated-package-updates.md` Phase 15. No change. |

**No `pnpm.overrides` shim added.** Considered using `pnpm.peerDependencyRules.allowedVersions` to silence the Expo warning explicitly, but rejected as over-engineering — the project's established pattern is to accept transitive peer warnings as noise when no clean upstream fix exists. The audit trail in this plan provides the same intent without machinery. When Expo eventually publishes a TS-6-aware patch (likely tied to the SDK 56 cohort upgrade tracked as Phase 14b in `outdated-package-updates.md`), the warning will clear automatically.

**No code changes in this phase.** Commit is plan-doc-only.

### Phase 6 — Optional: retry zod 4.4.3

`outdated-package-updates.md` Phase 7 deferred zod `^4.3.6` → `^4.4.3` because TanStack form 1.28/1.32 + zod 4.4 hit TS2589 depth on TS 5.9. Retry the same bump on TS 6:

1. Edit `pnpm-workspace.yaml` catalog: `zod: ~4.3.6` → `^4.4.3`.
2. Run full verification loop.
3. **If green:** ship the bump as a single commit and update the deferral note in `outdated-package-updates.md` Phase 7.
4. **If still TS2589 / OOM:** revert, leave the tilde pin in place, re-defer to whenever zod or TanStack form publishes a fix. Document the result here.

---

## Critical Files Likely Touched

- `pnpm-workspace.yaml` — Phase 1 (tighten), Phase 4 (bump), Phase 6 (zod retry)
- `apps/extension/package.json` — Phase 1 (catalog migration)
- `packages/config/tsconfig.base.json` — only if Phase 2 surfaces a lib-default change (currently expected: no change)
- `apps/server/tsconfig.json` — only if composite/tsbuildinfo behavior shifts
- `biome.json` — possible ignore-list extension if `.wxt/` or `.expo/` regenerates non-conforming files (Phase 11/12 pattern)
- `docs/plans/typescript-6-upgrade.md` — Phase 2 inline triage update, Phase 5/6 result notes

## Out-of-Scope (deferred)

- **Bun / tsgo runtime swap** — current setup uses node + tsc; not relevant here.
- **TS 6 project-references / multi-file emit semantics** — only `apps/server` uses `composite: true` and it works in isolation today.
- **Tightening `exactOptionalPropertyTypes`** — base tsconfig leaves this off; a stricter sweep belongs in its own cleanup plan.

## Rollback

Each phase is a single commit. If CI fails on a pushed phase, `git revert <sha>` and reopen the phase as its own investigation. Phase 4's revert specifically restores `~5.9.3` and may also need `rm -rf */dist */*.tsbuildinfo && pnpm install` to fully reset incremental caches.
