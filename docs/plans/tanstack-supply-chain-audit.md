# TanStack Supply-Chain Compromise — Infection Assessment

## Context

On **2026-05-11 ~19:20–19:26 UTC**, an attacker published 84 malicious versions across 42 `@tanstack/*` npm packages (advisory **GHSA-g7cv-rxg3-hmpx**, **CVE-2026-45321**), a "Mini Shai-Hulud" supply-chain attack. This document records the infection assessment for the `pengana` repo and the recommended hardening steps.

## Verdict: NOT INFECTED

Every TanStack version resolved in `pnpm-lock.yaml` is **below** the compromised version range. The confirmed-clean families (`react-query`, `react-form`) are also unaffected per the official advisory.

## Evidence — Installed vs. Compromised Versions

Compromised versions taken from GHSA-g7cv-rxg3-hmpx. Installed versions from `pnpm-lock.yaml`.

| Package | Installed | Compromised | Status |
|---|---|---|---|
| `@tanstack/react-router` | `1.169.2` | `1.169.5`, `1.169.8` | clean |
| `@tanstack/router-core` | `1.169.2` | `1.169.5`, `1.169.8` | clean |
| `@tanstack/react-router-devtools` | `1.166.13` | `1.166.16`, `1.166.19` | clean |
| `@tanstack/router-devtools-core` | `1.167.3` | `1.167.6`, `1.167.9` | clean |
| `@tanstack/router-plugin` | `1.167.35` | `1.167.38`, `1.167.41` | clean |
| `@tanstack/history` | `1.161.6` | `1.161.9`, `1.161.12` | clean |
| `@tanstack/react-query` | `^5.100.10` (catalog) | — | family confirmed clean |
| `@tanstack/react-query-devtools` | `5.100.10` | — | query family confirmed clean |
| `@tanstack/react-form` | `^1.32.0` (catalog) | — | form family confirmed clean |

Confirmed-clean families per advisory: `@tanstack/query*`, `@tanstack/table*`, `@tanstack/form*`, `@tanstack/virtual*`, `@tanstack/store`.

## Residual Risk

The lockfile is safe right now, but `apps/web/package.json` uses caret ranges that would resolve into the compromised window on a lockfile-less reinstall:

- `"@tanstack/react-router": "^1.169.2"` — would have resolved to `1.169.5`/`1.169.8` during the attack window
- `"@tanstack/react-router-devtools": "^1.166.13"` — same risk
- `"@tanstack/router-plugin": "^1.167.35"` — same risk

npm has deprecated the malicious versions and pulled tarballs, so a fresh install **today** is safe. The only exposure window was anyone running `pnpm install` with `--no-frozen-lockfile` (or deleting `pnpm-lock.yaml`) between **2026-05-11 19:20 UTC** and the npm pull-time.

## Recommended Actions (priority order)

1. **Verify no compromised install ran locally** (read-only checks):
   - `grep -E "1\.169\.[58]|1\.166\.(16|19)|1\.167\.(6|9|38|41)|1\.161\.(9|12)" pnpm-lock.yaml` — should return nothing.
   - Check shell history for `pnpm install` / `npm install` of TanStack between 2026-05-11 and 2026-05-12 UTC.
   - Check `~/.npm/_logs/` and `~/.local/share/pnpm/store` install logs for that window.
2. **Upgrade to pnpm 11** (the single biggest hardening win — see "pnpm 11 migration" section below).
3. **Bump to patched versions** once TanStack publishes clean re-releases (advisory notes all malicious versions are deprecated and patched releases will follow). Track:
   - https://tanstack.com/blog/incident-followup
   - https://github.com/TanStack/router/issues/7383
4. **Enforce frozen lockfile in CI** — verify the workflow uses `pnpm install --frozen-lockfile`. This is what protected this repo and should remain non-negotiable.
5. **No credential rotation required for this project** — the malicious payload exfiltrated GitHub/npm tokens via `postinstall`, but only on machines that actually installed the malicious versions. Lockfile-pinned installs were not exposed.

## pnpm 11 Migration

The repo currently pins `"packageManager": "pnpm@10.30.3"` in the root `package.json`. pnpm 11 (released 2026-04-28) ships three defaults that would have prevented this specific attack and the next one:

- **`minimumReleaseAge: 1440`** (24h) — freshly published versions don't resolve for 24 hours. The malicious TanStack versions were detected and yanked within minutes; pnpm 11 users with defaults would never have resolved them.
- **`blockExoticSubdeps: true`** — transitive deps from Git URLs / tarballs are blocked. Reduces the attack surface for typosquatting + indirect-source injection.
- **`allowBuilds` model** — replaces `onlyBuiltDependencies` / `neverBuiltDependencies` / `ignoreDepScripts` with an opt-in allowlist for `postinstall` scripts. (This was the exact execution vector for the TanStack payload.)

### Migration steps

> **Important:** pnpm 11 no longer reads the `pnpm` field in `package.json` ([release notes](https://pnpm.io/blog/releases/11.0)). All pnpm-specific settings — `overrides`, `minimumReleaseAge`, `blockExoticSubdeps`, `allowBuilds`, etc. — must live in `pnpm-workspace.yaml`. Any pre-existing `pnpm.overrides` in `package.json` will be **silently ignored** on upgrade until migrated.

1. Bump `packageManager` in root `package.json`:
   ```diff
   - "packageManager": "pnpm@10.30.3",
   + "packageManager": "pnpm@11.1.2",
   ```
2. Update Corepack / shell pnpm to 11: `corepack prepare pnpm@11.1.2 --activate` (or update via Volta/asdf).
3. Move any pre-existing `"pnpm": { ... }` block out of `package.json` and into `pnpm-workspace.yaml`, then add the v11 security defaults. The full result for this repo looks like:
   ```yaml
   # pnpm-workspace.yaml
   packages:
     - apps/*
     - packages/*

   minimumReleaseAge: 1440          # 24h quarantine on freshly-published versions
   minimumReleaseAgeExclude: []     # populate only if a specific dep needs hotfix-speed
   blockExoticSubdeps: true         # block transitive deps from Git/tarball URLs

   overrides:                       # migrated from package.json "pnpm.overrides"
     '@babel/types': ^7.29.0
     '@vitejs/plugin-react': ^6.0.0
     vite-node: ^6.0.0

   allowBuilds:                     # explicit allowlist for postinstall scripts
     esbuild: true                  # pnpm 11 writes a stub here on first install
     msw: true                      # and prompts you to set true/false per package
     sharp: true
     spawn-sync: true

   catalog:
     # ... existing catalog entries
   ```
   Tabs are invalid YAML — keep `pnpm-workspace.yaml` on 2-space indentation regardless of the JS/TS tab rule from `AGENTS.md`.
4. Run `CI=true pnpm install --no-frozen-lockfile` — rebuilds the global store in pnpm 11's new SQLite format, regenerates `pnpm-lock.yaml`, and re-applies overrides. `CI=true` bypasses pnpm 11's interactive modules-purge prompt; `--no-frozen-lockfile` is needed because the lockfile config hash changes when settings move.
5. Update CI workflows to install pnpm 11 (most use Corepack via `packageManager`, so step 1 covers them; verify GitHub Actions setup steps that hardcode a pnpm version).
6. Sanity-check the repo: `pnpm install --frozen-lockfile && pnpm check && pnpm check-types && pnpm test && pnpm build`.

### Migration risks / gotchas

- **`pnpm` field in `package.json` is dead** — pnpm 11 silently ignores it. The single biggest gotcha: a pre-existing `pnpm.overrides` block left in `package.json` will resolve without overrides applied, with no warning. Always grep for `"pnpm":` in `package.json` before upgrading and migrate every key to `pnpm-workspace.yaml`.
- **`allowBuilds` migration** — pnpm 11 removes `onlyBuiltDependencies` / `neverBuiltDependencies` / `ignoreDepScripts`. The first `pnpm install` writes stub entries for each package that requests a build script (e.g. `esbuild`, `sharp`, `msw`, `spawn-sync`) and prompts you to set `true`/`false`.
- **SQLite store format** — first install rebuilds the global pnpm store. Slow on first run; transparent after.
- **`minimumReleaseAge` for legitimate hotfixes** — if a critical patched release (e.g. for this very TanStack incident) needs to land within 24h, add the specific package name to `minimumReleaseAgeExclude`.
- **Coordination with collaborators** — anyone else on the project needs `corepack enable` so Corepack respects the new `packageManager` field. Otherwise their local pnpm 10 will mismatch.

## Files Referenced

- `pnpm-lock.yaml` — version resolution source of truth (clean)
- `pnpm-workspace.yaml` — catalog versions for `@tanstack/react-form` and `@tanstack/react-query`
- `apps/web/package.json` — direct router/devtools/plugin pins (caret ranges)
- `apps/native/package.json`, `packages/org/package.json` — only reference `react-form` / `react-query` (clean families)

## Verification

```sh
# Should print no matches:
grep -E "@tanstack/(react-router|router-core|react-router-devtools|router-devtools-core|router-plugin|history)@1\.(169\.[58]|166\.(16|19)|167\.(6|9|38|41)|161\.(9|12))" pnpm-lock.yaml

# Confirm clean versions are resolved:
grep -E "@tanstack/(react-router|router-core|router-plugin|history)@" pnpm-lock.yaml | sort -u
```

## Sources

- TanStack postmortem: https://tanstack.com/blog/npm-supply-chain-compromise-postmortem
- Advisory: GHSA-g7cv-rxg3-hmpx (CVE-2026-45321)
- Snyk write-up: https://snyk.io/blog/tanstack-npm-packages-compromised/
- StepSecurity: https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem
- pnpm 11 release notes: https://pnpm.io/blog/releases/11.0
- pnpm supply-chain mitigation guide: https://pnpm.io/supply-chain-security
- Socket on pnpm 11 defaults: https://socket.dev/blog/pnpm-11-adds-new-supply-chain-protection-defaults
