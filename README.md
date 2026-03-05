# Pengana

A full-stack TypeScript application with web, server, mobile (React Native), browser extension, and desktop (Tauri) platforms.

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

## Getting Started

```bash
pnpm install
```

### Database Setup

1. Set up a PostgreSQL database.
2. Copy `apps/server/.env.example` to `apps/server/.env` and fill in your values.
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
- Native: Use Expo Go

## Project Structure

```
pengana/
├── apps/
│   ├── web/         # Web app (React + TanStack Router + PWA + Tauri desktop)
│   ├── native/      # Mobile app (React Native + Expo)
│   ├── server/      # Backend API (Hono + oRPC)
│   └── extension/   # Browser extension (WXT)
├── packages/
│   ├── api/          # API routes & business logic
│   ├── auth/         # Authentication (Better-Auth + Polar)
│   ├── db/           # Database schema & queries (Drizzle + PostgreSQL)
│   ├── env/          # Environment config
│   ├── config/       # Shared config (TypeScript, Biome)
│   ├── sync-engine/  # Offline-first sync engine
│   └── todo-client/  # Shared client-side logic
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
- `pnpm run check` - Run Biome formatting and linting
- `cd apps/web && pnpm run desktop:dev` - Start Tauri desktop app
- `cd apps/web && pnpm run desktop:build` - Build Tauri desktop app
