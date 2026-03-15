# Repository Guidelines

## Project Structure & Module Organization
`pengana` is a `pnpm` + Turborepo monorepo. App entry points live in `apps/`: `web` (Vite + React + Tauri shell), `server` (Hono), `native` (Expo), `extension` (WXT), and `e2e` (Playwright). Shared logic lives in `packages/`, including `api`, `auth`, `db`, `env`, `i18n`, `ui`, and sync/client libraries. Keep feature code close to its owning app or package; reuse shared types and business logic from `packages/*` instead of copying between apps.

## Build, Test, and Development Commands
Install once with `pnpm install`.

- `pnpm dev` runs the full workspace in watch mode through Turbo.
- `pnpm dev:web`, `pnpm dev:server`, `pnpm dev:native` start a single app.
- `pnpm build` builds all packages and apps.
- `pnpm check` runs Biome linting and formatting checks.
- `pnpm check-types` runs TypeScript checks across the monorepo.
- `pnpm test` runs package and app unit tests.
- `pnpm e2e` runs Playwright tests from `apps/e2e`.
- `pnpm db:start` and `pnpm db:push` start Postgres and apply the current schema.

## Coding Style & Naming Conventions
TypeScript is strict (`noUnusedLocals`, `noUncheckedIndexedAccess`, etc.) and Biome is the formatter/linter. Use tabs for indentation, double quotes in JS/TS, and let Biome organize imports. Prefer descriptive file names in `kebab-case`; React components and exported types use `PascalCase`; hooks use `use-*` or `useX` naming; tests use `*.test.ts` or `*.spec.ts`. Run `pnpm check` before opening a PR.

## Testing Guidelines
Unit and integration tests use Vitest in packages and selected apps. End-to-end coverage uses Playwright under `apps/e2e/tests/<target>`, for example `apps/e2e/tests/web/todos.spec.ts`. No numeric coverage gate is configured in CI, so contributors should add or update tests for every behavior change and cover regressions at the package level when possible.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style such as `feat: ...` and `refactor: ...`; keep that format and make the subject specific. PRs should include a concise summary, linked issue when applicable, test evidence (`pnpm check`, `pnpm test`, `pnpm e2e` if relevant), and screenshots or recordings for UI changes. CI currently runs `check`, `check:i18n`, `check-types`, `build`, and `test`; don’t open a PR with known failures in those paths.

# Codex Instructions

After making any code or config changes, before sending the final response, run these commands from the repo root in order:

1. `pnpm check`
2. `pnpm check-types`
3. `pnpm test`

If a command fails:
- do not ignore it
- report the failure clearly in the final response
- include the failing command and the relevant error summary
- only skip a command if the user explicitly tells you to skip it

Do not run these commands for planning-only, review-only, or explanation-only turns that do not change files.
