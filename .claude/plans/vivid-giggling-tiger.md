# Fix: i18next import resolution in extension background build

## Context
The extension's `pnpm dev` fails because WXT/Vite can't resolve the direct `import i18next from "i18next"` in `src/utils/orpc.ts` when building the background service worker. This is a **pre-existing bug on main** — `i18next` is a dependency of `@pengana/i18n`, not of the extension itself, and pnpm's strict hoisting doesn't make it available.

## Fix
Change the import in `apps/extension/src/utils/orpc.ts` from:
```ts
import i18next from "i18next";
```
to:
```ts
import { i18next } from "@pengana/i18n";
```

`@pengana/i18n` already re-exports `i18next` as a named export (see `packages/i18n/src/index.ts:1`). The extension already depends on `@pengana/i18n`.

## Files to modify
- `apps/extension/src/utils/orpc.ts` — single import change

## Verification
- Run `cd apps/extension && pnpm dev` — should start without the Rollup resolution error
