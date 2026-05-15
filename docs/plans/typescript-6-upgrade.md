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
- [x] **Phase 6** — Optional: retry zod 4.4.3 (Rung 1+2 paired, plus i18n peer-resolution dedup)

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

### Phase 6 — Optional: retry zod 4.4.3 ✅ Done (Rung 1 + Rung 2 paired)

**Outcome:** Rung 1 alone OOM'd on `native:check-types` (exit 137, V8 heap exhaustion — the same TS2589-class depth blow-up that originally deferred the bump). Dropped to Rung 2 paired with Rung 1, which produced a second, *different* failure: 13 cross-version assignability errors (`zod@4.3.6 vs zod@4.4.3`) because `@pengana/i18n` declares zod only as a peer (`>=3`) and pnpm's auto-install-peers stuck on the previously-resolved 4.3.6 even after the catalog bump. Adding `zod: catalog:` to `packages/i18n/package.json` `devDependencies` forced i18n to align with the workspace's resolved 4.4.3 — public peer contract unchanged. Third attempt all green.

**Three edits land together as a single commit:**

1. `pnpm-workspace.yaml:42` — `zod: ~4.3.6` → `^4.4.3` (Rung 1).
2. `packages/org/src/hooks/use-zod-form.ts:6` — `schema: z.ZodType<T, any, any>` → `z.ZodType<any, any, any>` (Rung 2). Updated the biome-ignore comment to record *why* the constraint is `any` rather than `T` (depth dodge — `T` still pins via `defaultValues` and `onSubmit`'s `value: T`, so callsite ergonomics are unchanged).
3. `packages/i18n/package.json:53` — added `"zod": "catalog:"` to `devDependencies` so i18n participates in workspace dedup instead of leaving its zod resolution to pnpm's auto-install-peers heuristic (which kept 4.3.6 across the bump).

**Verification (all six checks green):**
- `pnpm check` — 767 files, no fixes.
- `pnpm turbo check-types --force` — 5/5 tasks fresh, **5.0s wall time** (Phase 4 cold baseline was ~6.5s — *faster*, no depth-pressure signal).
- `pnpm test` — 7/7 tasks; 155+ tests across api/local-db/org/sync.
- `pnpm build` — 3/3 tasks. Server tsdown 2.03 MB unchanged. **Web PWA 122 entries / 1459.20 KiB (+2.9 KiB / +0.2% vs Phase 4 baseline 1456.30 KiB)** — expected drift from zod 4.4's slightly heavier emit; negligible.
- `pnpm e2e` — 83/83 in 1m17s, no flakies.
- Callsite smoke-check: `apps/web/src/features/auth/sign-in-form.tsx` and `apps/native/src/features/auth/sign-in.tsx` still type-check against `value.email`/`value.password` inside `onSubmit`, confirming `T` still pins through `defaultValues` even after the constraint widened to `any`.

**Peer-warning delta:** unchanged from Phase 4 — Expo SDK 55's `@expo/require-utils` strict-TS-5 peer is still present (accepted in Phase 5), workbox 7.4.1 and react-dom 19.2.6 unchanged. **No new warnings** introduced by the zod bump or the i18n edit. The `node_modules/.pnpm/zod@4.3.6` directory is orphan residue from the pre-edit install (no workspace consumer points at it; `pnpm why zod@4.3.6 -r` returns empty) — it'll be cleaned up by the next `pnpm store prune`.

**Why this matters as a Phase 6 outcome, not a Rung-1-only ship:** the original plan envisioned Rung 1 standing alone if TS 6's checker absorbed the depth on its own. It did not. But Rung 2's relaxation is so cheap (one-line, well-justified by the depth-dodge reason, and `T` still pins through `defaultValues`) that the original "stop at the first green rung" rule is honored — we stop at Rung 2 and don't escalate to Standard Schema V1 (Rung 3) or re-deferral (Rung 4). The i18n peer fix is mechanical (mirror the catalog version everyone else uses) and would have been needed regardless of which rung landed; it's an artifact of pnpm's peer-resolution caching, not of zod or TS.

---

#### Original planning material (kept for traceability)

`outdated-package-updates.md` Phase 7 deferred zod `^4.3.6` → `^4.4.3` because TanStack form 1.28/1.32 + zod 4.4 hit TS2589 depth on TS 5.9. Now that TS 6 is in catalog (Phase 4), retry the bump — but with a refined diagnosis from the v4.4.0 release notes.

#### Diagnosis (revised against the v4.4.0 release notes)

The [zod v4.4.0 release notes](https://github.com/colinhacks/zod/releases/tag/v4.4.0) describe a series of **runtime** soundness fixes: tuple defaults materialize correctly, `z.undefined()` keys are now required-by-default, `.merge()` throws on receiver refinements, stricter base64/CUID/httpUrl validators, record key transforms run, etc. None of those runtime changes touch our schema definitions in `packages/i18n/src/zod.ts` — every schema we ship uses only `z.object`, `z.string`, `z.email`, `z.enum`, `z.array`, `z.union`, `z.literal`. We have **zero callsites** of the reworked APIs (`.partial()`, `.default()`, `.merge()`, `z.undefined()`, `.prefault()`) in `apps/` or `packages/i18n/`.

That narrows the root cause of the TS2589 explosion: it's **not** a specific reworked API biting us — it's that zod 4.4's *internal* optionality machinery (rewritten to support those reworked APIs) produces heavier-to-resolve type structures even for plain `z.object({ ... })` schemas. The expensive types only bite when many consumers unfold them at the same compilation unit, which is exactly what happens via `useZodForm`:

- The centralized bridge is `packages/org/src/hooks/use-zod-form.ts:11` — accepts `schema: z.ZodType<T, any, any>` and casts to `any` when handing the schema to `useForm`'s validators.
- 20 callsites consume the hook: ~9 in `apps/native/src/{features,app}` (sign-in, sign-up, forgot-password, delete-account, org-form, invite-form, team-name-editor, team-member-add-form, onboarding-invite-members), ~11 in `apps/web/src/{features,routes}` (auth forms × 7, org-create, invite-member, onboarding-invite-members, org settings route).
- Each callsite re-instantiates `z.ZodType<T, any, any>` and TS must check assignability of the actual schema against that constraint. Under 4.4 the assignability check unfolds zod's internal mapped types — multiplied across 20 callsites, hits the depth limit.

The hook is *already* structured as a partial firewall (the `any` generics + `as any` cast), but the *constraint position* `z.ZodType<T, any, any>` still forces TS to walk the schema's output type against `T`. **That's the lever for the cheapest fix below.**

#### Mitigation ladder (cheapest first; stop at the first one that lands green)

Each rung is its own commit so any one of them can ship independently if the next fails.

**Rung 1 — Naive retry under TS 6.** Edit `pnpm-workspace.yaml` catalog: `zod: ~4.3.6` → `^4.4.3`. Run the full verification loop with the same forced cache bust as Phase 4 (`rm -rf apps/server/dist apps/server/*.tsbuildinfo && pnpm turbo check-types --force`). TS 6's improved checker may absorb the increased depth on its own (the recon in Phase 2 ran clean under TS 6 with TS 5.9-compatible deps — depth budget on TS 6 is empirically larger). **If green: ship as a single commit.**

**Rung 2 — Relax the constraint position in `useZodForm`.** If Rung 1 fires TS2589, change `packages/org/src/hooks/use-zod-form.ts:6`:

```diff
-  schema: z.ZodType<T, any, any>;
+  schema: z.ZodType<any, any, any>;
```

`T` is still pinned by `defaultValues` (line 4) and re-asserted by `onSubmit`'s `value: T` (line 8), so the public contract for callsites is unchanged — the cast just stops TS from walking the schema's output type against `T` at every callsite. Diff is one line; expected to be the single fix for ~20 callsites. **If green: ship Rung 1 + Rung 2 as one combined commit (zod bump + hook tweak).**

**Rung 3 — Switch the hook to Standard Schema V1.** If Rung 2 still fires TS2589 (unlikely given the existing firewall, but possible if the depth is at TanStack form's `DeepValue<TFormData, TName>` rather than zod), rewrite the hook to accept `StandardSchemaV1<unknown, T>` (TanStack form 1.32 natively supports the Standard Schema V1 interface). Standard Schema V1 is a flat interface with no zod-specific mapped types — bypasses zod's machinery entirely at the bridge. zod 4.x objects satisfy `StandardSchemaV1` natively via the `~standard` property. Diff is the hook signature only; callsites unchanged. **If green: ship as a single combined commit.**

**Rung 4 — Re-defer.** If Rung 3 fails, the depth is upstream of our control. Roll back, leave the tilde pin in place, document the failure mode (which rung failed and the exact `tsc` output), and track upstream: either zod publishing optimized type-perf fixes (search the issue tracker for "TS2589" — none open as of 2026-05-15), or TanStack form publishing a `DeepValue` rewrite that avoids unfolding the schema's output type.

#### Verification

Same as Phase 4's loop, plus:

- After Rung 1's install, **time** `pnpm turbo check-types --force` and compare against the Phase 4 baseline (~3s with cache busted, ~6.5s for the first cold run). A 2-3× slowdown without errors is a yellow flag worth investigating before merge, even if the build is "technically green" — it signals zod 4.4 is pushing close to the depth limit and a future feature addition could tip it.
- Confirm `apps/web/src/features/auth/sign-in-form.tsx` and `apps/native/src/features/auth/sign-in.tsx` (representative callsites for both apps) compile without inferring `value: any` in `onSubmit` — i.e., the `T` pinning still works after any hook tweak.

#### Critical files

- `pnpm-workspace.yaml` — Rung 1 catalog edit
- `packages/org/src/hooks/use-zod-form.ts` — Rung 2 or Rung 3 hook edit
- No changes expected in callsite files (~20 form components) — they treat the hook as a black box
- `docs/plans/outdated-package-updates.md` — update Phase 7 deferral note on success
- `docs/plans/typescript-6-upgrade.md` — record which rung landed and any timing observation

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
