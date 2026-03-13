export {
	createDrizzleOrgSyncAdapter,
	createDrizzleOrgSyncAdapter as createOrgSyncAdapter,
	createDrizzleSyncAdapter,
	createDrizzleSyncAdapter as createSyncAdapter,
} from "./adapter";
export { db } from "./db";
export { syncMeta, todos } from "./schema";

// Placeholder for web-only imports so TypeScript resolves .web.ts files correctly.
// At runtime, .web.ts files import from index.web.ts via Metro's platform resolution.
import type { appDb as _appDb } from "./db.web";
export const appDb = null as unknown as typeof _appDb;
