# API Response Conventions

## Envelope Response Pattern

All procedures return responses wrapped in a success envelope: `{ success: true, data: <handler return> }`.
This is handled automatically by the envelope middleware in `packages/api/src/index.ts`.

### RPC Path (`/rpc`) — Internal Clients
- Handlers return data directly; the envelope middleware wraps it
- RPC clients receive `{ success: true, data: ... }` — access `.data` to get the payload
- Errors thrown via `apiError(code, message)` from `packages/api/src/errors.ts`
- Used by web, native, and extension apps via `AppRouterClient` with full type safety

### OpenAPI/REST Path (`/api-reference`) — Public API
- Success responses include the envelope from the middleware: `{ success: true, data: <handler return> }`
- Error responses are wrapped by the interceptor in `apps/server/src/index.ts`: `{ success: false, error: { code: "...", message: "..." } }`
- `.output()` schemas describe the enveloped shape, so Scalar docs are accurate

## Adding New Procedures
1. Create the procedure using `publicProcedure` or `protectedProcedure` from `packages/api/src/index.ts`
2. Add `.route({ method, path, summary })` — required for OpenAPI spec generation
3. Add `.output(envelopeOutput(dataSchema))` — wraps the data schema in `{ success: true, data: ... }`
4. Return data directly from the handler — the envelope middleware wraps it automatically
5. Throw errors using `apiError(code, message)` from `packages/api/src/errors.ts`
6. Never construct `ORPCError` directly

## Error Codes
| Code | HTTP Status | Usage |
|------|-------------|-------|
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `NOT_FOUND` | 404 | Resource does not exist or user lacks access |
| `BAD_REQUEST` | 400 | Invalid input or constraint violation |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded (returned by rate-limit middleware) |
