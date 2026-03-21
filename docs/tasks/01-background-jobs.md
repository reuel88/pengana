# Task 1: Add Background Job Queue

## Status: Skipped (for now)
## Dependencies: None
## Difficulty: Medium

## Why First
This is standalone server infrastructure with zero coupling to other tasks. Adding it early means subsequent tasks (file storage migration, sync improvements) can offload work to the queue from the start.

## Current State
No background job system — billing webhooks, notifications, email sending, and cleanup all run inline within request handlers. If a webhook handler fails mid-way or an email send times out, the request fails with it.

## Goal
Add a lightweight, Postgres-backed job queue so async work is durable and retryable.

## Proposed Approach

### Pick a Queue
- **Graphile Worker** (recommended) — uses your existing PostgreSQL, no extra infrastructure. Lightweight, well-maintained, supports cron jobs.
- **BullMQ** — requires Redis. More features but adds operational complexity.

### What to Move Into Jobs
| Job | Currently Runs In | Priority |
|-----|-------------------|----------|
| Polar webhook processing | `billing.ts` route handler | High |
| Email sending (welcome, verification, password reset, invitation) | Better-Auth hooks (`packages/auth`) | High |
| Notification delivery | Inline in various handlers | Medium |
| Expired session cleanup | Not implemented | Low |
| Orphaned upload cleanup | Not implemented | Low |

### Implementation Steps
1. Install `graphile-worker` in `apps/server`
2. Create `apps/server/src/jobs/` directory with one file per job type
3. Add worker initialization to server startup (`apps/server/src/index.ts`)
4. Create a shared `enqueueJob()` helper
5. Migrate email sending out of Better-Auth hooks → enqueue email jobs instead
6. Migrate Polar webhook processing → enqueue billing jobs
7. Add scheduled cleanup jobs (sessions, orphaned uploads)

### Key Files to Modify
- `apps/server/src/index.ts` — worker startup
- `packages/auth/src/index.ts` — replace inline email sends with job enqueue
- `packages/api/src/routers/billing.ts` — replace inline webhook processing
- `packages/api/src/routers/notification.ts` — enqueue notification delivery

## Verification
- [ ] Worker starts alongside the Hono server
- [ ] Emails still send (via job queue) — test signup, password reset, invitation flows
- [ ] Polar webhooks still process correctly
- [ ] Failed jobs retry automatically
- [ ] `pnpm run test` passes
- [ ] E2E tests pass
