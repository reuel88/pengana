# Pengana: Feature Inventory & Clean-Slate Architecture

## Context

Pengana is a multi-platform collaborative todo app with offline-first sync, seat-based billing, and organization management. It runs on web (React + Vite), desktop (Tauri), mobile (Expo/React Native), and browser extension (WXT). This document catalogs every feature and proposes how the system would be built from scratch.

---

## Complete Feature Inventory

### 1. Authentication & Account
- Email/password sign-up and sign-in
- Magic link (passwordless) authentication
- Email verification with callback flow
- Password reset (forgot + reset)
- Multi-device session management (list, revoke)
- Account deletion with confirmation
- Profile editing (name, image)

### 2. Organizations (Multi-Tenancy)
- Create organization with name, slug, logo, design preset
- Switch between organizations
- Organization appearance/branding (color presets)
- Member management (invite, remove, role assignment)
- Role hierarchy: Owner > Admin > Member
- Invitation system (send, accept, reject, cancel)
- Team management within orgs (create, add members, view)

### 3. Todo Management
- Create, read, update, complete, delete todos
- Scoped todos: personal vs. organization-wide
- Offline-first with local persistence
- Real-time sync across devices

### 4. Media & File Uploads
- Upload images (JPEG, PNG, WebP), PDFs, documents, videos
- Attach/detach media to todos (max 5 per entity)
- Media gallery (personal + org-scoped)
- Drag-and-drop upload UI
- Upload queue with retry logic
- File size limit: 25MB per file

### 5. Offline-First Sync Engine
- Local-first data in IndexedDB (web) / SQLite (native)
- Incremental sync via last-synced timestamps
- Conflict resolution (client-time vs server-time)
- Deletion tracking with soft deletes
- Media attachment reconciliation during sync
- Background sync with configurable intervals
- Event log (up to 65536 events)

### 6. Real-Time Updates
- WebSocket transport with auth (session or one-time tickets)
- Per-user connection pooling (max 5 connections)
- 30s keepalive pings
- Fallback to polling when WebSocket unavailable
- Exponential backoff reconnection (max 8s)
- Broadcast channels: per-user and per-org
- Message types: sync-notify, refresh-notify

### 7. Billing & Subscriptions
- Polar payment integration
- Seat-based pricing model
- Checkout flow with redirect
- Subscription lifecycle webhooks (created, active, updated, canceled, revoked)
- Seat assignment/revocation by admins
- Auto-seat for org owner on first write
- Customer self-service portal

### 8. Notifications
- In-app notification center
- Types: invitation accepted, org updates, system alerts
- Mark read (individual + bulk)
- Unread badge count
- Real-time delivery via WebSocket

### 9. Internationalization
- Multi-language via i18next
- RTL language support (Arabic, Hebrew)
- Browser language detection
- Server-side per-request locale
- Zod validation message translation
- Locale persistence

### 10. Theming
- Dark/light mode toggle
- System preference detection
- Organization-level branding presets

### 11. Onboarding
- xState-driven onboarding flow
- First-time org creation
- Invitation acceptance flow
- Route guards redirecting unboarded users

### 12. Developer Tooling
- Sync devtools debug panel
- Email dev inbox for local testing
- Drizzle Studio for DB inspection
- Playwright E2E tests (web, native, extension)
- Vitest unit/integration tests
- CI pipeline: lint, i18n check, type-check, build, test

### 13. Multi-Platform Support
- **Web**: React 19, Vite, TanStack Router, Dexie/IndexedDB
- **Desktop**: Tauri wrapping the web app
- **Mobile**: Expo/React Native, SQLite/Drizzle, Expo Router
- **Extension**: WXT, Dexie/IndexedDB, popup UI

### 14. API & Developer Experience
- oRPC for end-to-end type-safe RPC (internal clients)
- OpenAPI spec generation for public API (`/api-reference`)
- Envelope response pattern: `{ success, data }` / `{ success, error }`
- Multi-tier rate limiting (global, auth, sync, upload)
- Structured logging via LogTape

---

## Clean-Slate Architecture Proposal

If rebuilding from scratch with the same feature set, here's what I'd change and what I'd keep.

### What I'd Keep (Good Decisions)
- **TypeScript monorepo with pnpm + Turborepo** — proven, fast, good DX
- **Hono as the server framework** — lightweight, fast, good middleware ecosystem
- **Drizzle ORM for PostgreSQL** — type-safe, thin, migrations-first
- **Better-Auth** — handles auth complexity (org, magic link, email verify) without building from scratch
- **oRPC** — end-to-end type safety, better than tRPC for OpenAPI generation
- **Zod 4 for validation** — industry standard, great oRPC integration
- **TanStack Router (web)** — type-safe file-based routing
- **TanStack Query** — best server state management for React
- **Biome for linting/formatting** — faster than ESLint + Prettier
- **Playwright for E2E** — reliable, multi-browser

### What I'd Change

#### 1. Simplify the Custom Sync Architecture
**Current**: 6 packages (`sync-engine`, `sync-runtime`, `entity-store`, `realtime-transport`, `storage-health`, `upload-queue`) with custom adapters for Dexie and Drizzle.

**Proposed**: Keep the custom sync engine but consolidate into 2 packages:
- **`@pengana/sync`** — merge `sync-engine` + `sync-runtime` + `realtime-transport` + `storage-health` + `upload-queue` into one cohesive package with clear internal modules:
  - `core/` — sync protocol, conflict resolution, event log
  - `transport/` — WebSocket client with reconnection + fallback polling
  - `upload/` — upload queue with retry logic
  - `health/` — storage quota monitoring
- **`@pengana/local-db`** — merge `entity-store` + `todo-client` + `upload-client` into a single client-side data layer with platform adapters

**Key improvements to the sync protocol:**
- Use **CRDTs (e.g., last-writer-wins registers per field)** instead of whole-record conflict resolution — avoids losing concurrent edits to different fields
- Use **hybrid logical clocks (HLC)** instead of wall-clock timestamps — solves clock skew across devices
- Define a **single `SyncAdapter` interface** that both Dexie and Drizzle implement, reducing adapter boilerplate
- Move media reconciliation into the core sync loop rather than handling it as a separate concern

#### 2. Consolidate Client Data Packages
**Current**: `entity-store`, `todo-client`, and `upload-client` are separate packages, each with their own Dexie and Drizzle adapters.

**Proposed**: Merge into a single **`@pengana/local-db`** package that keeps both storage backends:
- Dexie (IndexedDB) for web/extension — keeps the current approach
- Drizzle (SQLite) for native — keeps the current approach
- Single `StorageAdapter` interface with Dexie and Drizzle implementations
- Todo and upload logic co-located with their adapters instead of spread across 3 packages
- Shared React hooks for both platforms in one place

#### 3. Consolidate UI Packages
**Current**: `@pengana/ui` depends on `@pengana/org-client` and `@pengana/upload-client` — UI components have business logic dependencies.

**Proposed**:
- Keep `@pengana/ui` as pure presentational components (no business logic imports)
- Move org-aware and upload-aware components into feature-level code in each app
- This makes the UI package truly reusable and prevents circular dependency risks

#### 4. Simplify the Package Graph
**Current**: 16 packages with deep interdependencies.

**Proposed** (~8 packages):
| Package | Replaces | Purpose |
|---------|----------|---------|
| `@pengana/db` | same | Drizzle schema + queries (server) |
| `@pengana/local-db` | `entity-store`, `todo-client`, `upload-client` | SQLite schema + queries (client, via WASM/expo) |
| `@pengana/api` | same | oRPC procedures |
| `@pengana/auth` | same | Better-Auth config |
| `@pengana/sync` | `sync-engine`, `sync-runtime`, `realtime-transport`, `storage-health`, `upload-queue` | Custom sync engine + real-time transport + upload queue |
| `@pengana/ui` | same, minus business deps | Pure presentational components |
| `@pengana/i18n` | same | i18n setup |
| `@pengana/env` | same | Env validation |
| `@pengana/config` | same | Shared TS/build config |

Drop: `org-client` (move to app-level features), `email-dev` (inline into server dev mode).

#### 5. File Storage
**Current**: Local filesystem (`./uploads/`).

**Proposed**: **S3-compatible object storage** (e.g., Cloudflare R2, AWS S3, MinIO for dev).
- Presigned upload URLs (client uploads directly, no base64 encoding through the server)
- CDN-ready serving
- No server disk dependency
- Scales horizontally
- Use MinIO in Docker for local dev (same API as S3)

#### 6. Background Jobs
**Current**: No background job system — billing webhooks, notifications, and cleanup run inline.

**Proposed**: Add a lightweight job queue (e.g., **[Graphile Worker](https://worker.graphile.org/)** or **[BullMQ](https://docs.bullmq.io/)**).
- Webhook processing (Polar subscription events)
- Email sending (move out of auth hooks)
- Scheduled cleanup (expired sessions, orphaned uploads)
- Notification delivery
- Keeps request handlers fast and failure-resilient

#### 7. State Management
**Current**: xState for onboarding + sync coordination, TanStack Query for server state.

**Proposed**: Keep TanStack Query. Replace xState with simpler patterns:
- Onboarding: route-guard + a simple React context with a `status` enum (no state machine needed for linear flows)
- Sync coordination: a simple pub/sub event emitter is sufficient for coordinating sync triggers
- xState adds significant bundle size and cognitive overhead for flows that are essentially linear

#### 8. Mobile Framework
**Current**: Expo with React Native.

**Keep as-is** — Expo 55 + React Native is the right choice. No change needed.

#### 9. Extension Framework
**Current**: WXT.

**Keep as-is** — WXT is the best DX for browser extensions with React.

---

### Proposed Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                    Clients                       │
│  ┌──────┐  ┌───────┐  ┌─────────┐  ┌─────────┐ │
│  │ Web  │  │Native │  │Extension│  │ Desktop │ │
│  │(Vite)│  │(Expo) │  │ (WXT)   │  │(Tauri)  │ │
│  └──┬───┘  └──┬────┘  └────┬────┘  └────┬────┘ │
│     │         │             │            │       │
│     └─────────┴──────┬──────┴────────────┘       │
│                      │                            │
│              ┌───────▼────────┐                   │
│              │ @pengana/      │                   │
│              │ local-db       │                   │
│              │ (Dexie|SQLite) │                   │
│              └───────┬────────┘                   │
│                      │                            │
│              ┌───────▼────────┐                   │
│              │  @pengana/sync │                   │
│              │  (custom engine)│                  │
│              └───────┬────────┘                   │
└──────────────────────┼────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│                    Server                         │
│  ┌────────────────────────────────────────────┐  │
│  │  Hono + oRPC                               │  │
│  │  ├── Auth (Better-Auth)                    │  │
│  │  ├── API procedures                        │  │
│  │  ├── Sync endpoint + WebSocket server       │  │
│  │  └── OpenAPI spec                          │  │
│  └────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌───────────┐  ┌───────────────┐ │
│  │PostgreSQL│  │ S3/R2     │  │ Job Queue     │ │
│  │(Drizzle) │  │ (uploads) │  │(Graphile/Bull)│ │
│  └──────────┘  └───────────┘  └───────────────┘ │
└──────────────────────────────────────────────────┘
```

### Key Wins from Clean Slate
1. **~50% fewer packages** (16 → ~9) — less dependency management, faster builds
2. **Consolidated client data layer** (3 packages → 1) — same dual-backend approach, less package sprawl
3. **Consolidated sync** (6 packages → 2) — same custom engine, dramatically simpler package graph
4. **Better conflict resolution** — HLC + per-field CRDTs instead of whole-record timestamps
5. **Direct-to-storage uploads** — better performance, no base64 through server
6. **Background jobs** — more resilient webhook/email/cleanup processing
