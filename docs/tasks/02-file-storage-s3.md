# Task 2: Migrate File Storage to S3-Compatible Object Storage

## Status: Skipped (for now)
## Dependencies: None (but benefits from Task 1 for cleanup jobs)
## Difficulty: Medium

## Why Second
Independent of package consolidation work. Changes the upload path end-to-end (client → server → storage) so it's best done before reorganizing the upload-related packages.

## Current State
- Files uploaded as base64 via `POST /rpc/upload`, decoded and written to local filesystem (`./uploads/`)
- Served via Hono `serveStatic` middleware
- Max 25MB per file, max 5 attachments per entity
- No CDN, no horizontal scaling of file storage

## Goal
Client uploads directly to S3-compatible storage via presigned URLs. Server only generates the URL and records metadata.

## Proposed Approach

### Infrastructure
- **Production**: Cloudflare R2 (S3-compatible, no egress fees) or AWS S3
- **Local dev**: MinIO in Docker (same S3 API, add to existing `docker-compose.yml`)

### New Upload Flow
```
1. Client requests presigned upload URL → POST /rpc/upload/request
2. Server generates presigned PUT URL (expires in 15min) → returns URL + file key
3. Client uploads directly to S3/R2/MinIO using the presigned URL
4. Client confirms upload complete → POST /rpc/upload/confirm
5. Server verifies the object exists, saves metadata to DB
```

### Implementation Steps
1. Add MinIO service to `packages/db/docker-compose.yml`
2. Add S3 env vars to `packages/env/src/server.ts` (`S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`)
3. Install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` in `apps/server`
4. Create `apps/server/src/storage.ts` — S3 client setup + presign helpers
5. Replace the current upload procedure:
   - `POST /rpc/upload/request` — generates presigned URL
   - `POST /rpc/upload/confirm` — verifies upload, saves metadata
6. Update media serving — return S3 URLs directly (or proxy via CDN)
7. Remove `serveStatic` for `/uploads/*` from `apps/server/src/index.ts`
8. Update client upload logic in `packages/upload-queue/` and `packages/upload-client/`
9. Write a one-time migration script to move existing local files to S3

### Key Files to Modify
- `packages/db/docker-compose.yml` — add MinIO
- `packages/env/src/server.ts` — new S3 env vars
- `packages/api/src/routers/media.ts` — new upload/confirm procedures
- `packages/upload-queue/src/` — update upload logic for presigned URLs
- `packages/upload-client/src/` — update client-side upload flow
- `apps/server/src/index.ts` — remove static file serving

## Verification
- [ ] MinIO runs in Docker alongside PostgreSQL
- [ ] Presigned URL generation works
- [ ] Client uploads directly to MinIO/S3
- [ ] Media metadata saved correctly in DB
- [ ] Existing attachments still accessible after migration
- [ ] Upload size limits still enforced
- [ ] `pnpm run test` passes
- [ ] E2E upload tests pass
