# Pengana: Project Instructions

## Project Overview

Pengana is a collaborative todo management application built with a full-stack TypeScript monorepo. It supports multiple platforms including Web (PWA), Mobile (Expo/React Native), Browser Extension (WXT), and Desktop (Tauri).

### Key Technologies
- **Monorepo:** `pnpm` workspaces + `Turborepo`.
- **Frontend:** React, TanStack Router, React Query, TailwindCSS (v4), shadcn/ui.
- **Backend:** Hono, oRPC, WebSockets (`ws`).
- **Database:** PostgreSQL + Drizzle ORM.
- **Auth:** Better-Auth (supporting organizations and seat-based access).
- **Payments:** Polar.
- **Testing:** Playwright (E2E), Vitest.
- **Tooling:** Biome (Linting/Formatting), TypeScript.

## Architecture

The project is organized into `apps/` and `packages/`:

### Apps
- `apps/web`: React web app, PWA, and Tauri desktop shell.
- `apps/native`: Expo / React Native mobile app.
- `apps/server`: Hono server for auth, RPC, uploads, and WebSockets.
- `apps/extension`: WXT browser extension client.
- `apps/e2e`: Playwright end-to-end tests.

### Packages
- `packages/api`: Shared oRPC routes, procedures, and server context.
- `packages/auth`: Better Auth configuration and auth-related hooks.
- `packages/db`: Drizzle schema, migrations, and query helpers.
- `packages/env`: Typed environment validation per platform.
- `packages/config`: Shared TypeScript and tooling config.
- `packages/i18n`: Shared locales and i18n bootstrapping.
- `packages/org-client`: Shared org/team/invitation client logic.
- `packages/sync-engine`: Offline-first sync engine.
- `packages/todo-client`: Shared local todo and upload queue logic.
- `packages/ui`: Shared UI components and styles.

## Building and Running

### Setup
```bash
pnpm install
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
cp apps/native/.env.example apps/native/.env
```

### Database
```bash
pnpm run db:start    # Start local PostgreSQL container
pnpm run db:push     # Push schema to database
pnpm run db:studio   # Open Drizzle Studio
```

### Development
```bash
pnpm run dev         # Start all apps in development mode
pnpm run dev:web     # Start web app only
pnpm run dev:server  # Start server only
pnpm run dev:native  # Start Expo dev server
```

### Build & Verification
```bash
pnpm run build       # Build all apps
pnpm run check       # Run Biome linting and formatting
pnpm run check-types # Run TypeScript type checking
pnpm run test        # Run tests
pnpm run e2e         # Run all E2E tests
```

## Development Conventions

### Coding Standards
- **Formatter/Linter:** Biome (indentation: tab, quotes: double).
- **Styles:** Use TailwindCSS (v4) with `cn`, `clsx`, and `cva` helpers.
- **UI:** Prefer components from `packages/ui` (shadcn-based).
- **API:** Use procedures defined in `packages/api/src/index.ts`:
  - `publicProcedure`: No auth required.
  - `protectedProcedure`: Auth required.
  - `seatedProcedure`: Auth and organization seat required for write operations.

### Verification Flow
**CRITICAL:** After making any code or configuration changes, and before finalizing your response, you MUST run the following commands in order from the repository root:

1. `pnpm check`
2. `pnpm check-types`
3. `pnpm test`

If any command fails:
- Do not ignore the failure.
- Report the failure clearly.
- Include the failing command and relevant error summary.
- Only skip a command if explicitly directed by the user.

### Source Control
- Do not stage or commit changes unless explicitly requested.
- If asked to commit, follow the message style found in `git log -n 3`.
