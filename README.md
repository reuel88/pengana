# Pengana

A full-stack TypeScript application for collaborative todo management across web, server, mobile (React Native), browser extension, and desktop (Tauri) platforms.

## Tech Stack

- **TypeScript** - Full type safety across all platforms
- **TanStack Router** - File-based routing with type safety (web)
- **React Native + Expo** - Mobile app
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - UI components
- **Hono** - Server framework
- **oRPC** - End-to-end type-safe APIs
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database
- **Better-Auth** - Authentication
- **Polar** - Payments
- **WXT** - Browser extension framework
- **Tauri** - Desktop app
- **Turborepo** - Monorepo build system
- **Biome** - Linting and formatting

## What It Does

- **Organizations and teams** - Multi-user workspaces with invitations and role management
- **Todos with offline sync** - Shared todo flows backed by a reusable sync engine
- **Realtime updates** - WebSocket notifications prompt clients to resync
- **Attachments** - File uploads tied to todo items
- **Internationalization** - Shared i18n across web, native, extension, and server
- **Multi-platform clients** - Web, Expo native app, browser extension, and Tauri desktop shell

## Getting Started

```bash
pnpm install
```

### Environment Setup

Copy the example env files and fill in values for your local setup:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
cp apps/native/.env.example apps/native/.env
```

Required variables by app:

- `apps/server/.env` - `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, `PORT`, `NODE_ENV`, and Polar values
- `apps/web/.env` - `VITE_SERVER_URL`, `VITE_WEB_URL`
- `apps/native/.env` - `EXPO_PUBLIC_SERVER_URL`

If you want to run the browser extension locally, also copy `apps/extension/.env.example` to `apps/extension/.env`.

### Database Setup

1. Set up a PostgreSQL database.
2. Start the local database container if needed:

```bash
pnpm run db:start
```

3. Push the schema:

```bash
pnpm run db:push
```

### Development

```bash
pnpm run dev
```

- Web: [http://localhost:3001](http://localhost:3001)
- API: [http://localhost:3000](http://localhost:3000)
- Native: Expo dev server via `pnpm run dev:native`

## Project Structure

```
pengana/
├── apps/
│   ├── web/         # React web app, PWA, and Tauri desktop shell
│   ├── native/      # Expo / React Native mobile app
│   ├── server/      # Hono server for auth, RPC, uploads, and WebSockets
│   ├── extension/   # WXT browser extension client
│   └── e2e/         # Playwright end-to-end tests
├── packages/
│   ├── api/            # Shared oRPC routes, procedures, and server context
│   ├── auth/           # Better Auth configuration and auth-related hooks
│   ├── config/         # Shared TypeScript and tooling config
│   ├── db/             # Drizzle schema, migrations, and query helpers
│   ├── email-dev/      # Dev email templates and previews
│   ├── entity-store/   # Dexie-based offline entity storage and reactive hooks
│   ├── env/            # Typed environment validation per platform
│   ├── i18n/           # Shared locales and i18n bootstrapping
│   ├── org-client/     # Shared org/team/invitation client logic
│   ├── sync-client/    # RPC sync transport factory
│   ├── sync-engine/    # Offline-first sync engine, upload queue, and providers
│   ├── todo-client/    # Todo entity adapters, actions, and hooks
│   ├── ui/             # Shared UI components and styles
│   └── upload-client/  # Media management and upload queue adapters
```

## Available Scripts

- `pnpm run dev` - Start all apps in development mode
- `pnpm run build` - Build all apps
- `pnpm run dev:web` - Start web app only
- `pnpm run dev:server` - Start server only
- `pnpm run dev:native` - Start Expo dev server
- `pnpm run check-types` - TypeScript type checking
- `pnpm run db:push` - Push schema to database
- `pnpm run db:generate` - Generate database types
- `pnpm run db:migrate` - Run migrations
- `pnpm run db:studio` - Open Drizzle Studio
- `pnpm run db:start` - Start the local PostgreSQL container
- `pnpm run db:stop` - Stop the local PostgreSQL container
- `pnpm run check` - Run Biome formatting and linting
- `cd apps/web && pnpm run desktop:dev` - Start Tauri desktop app
- `cd apps/web && pnpm run desktop:build` - Build Tauri desktop app

## E2E Testing

E2E tests use Playwright against a local API and web app.

### One-time setup

Install Playwright browsers (required once per machine):

```bash
pnpm --filter @pengana/e2e exec playwright install
```

### Running tests

Ensure PostgreSQL is running before starting tests:

```bash
pnpm run db:start
```

Then run:

```bash
pnpm run e2e          # run all E2E tests
pnpm run e2e:ui       # open Playwright UI (interactive)
```

Playwright starts the API server and web app automatically before running tests.
