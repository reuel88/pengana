export {
	createDrizzleSyncAdapter,
	createDrizzleSyncAdapter as createSyncAdapter,
} from "./adapter";
export { db } from "./db";
export { syncMeta, todos } from "./schema";

// Placeholder for web-only imports so TypeScript resolves .web.ts files correctly.
// At runtime, .web.ts files import from index.web.ts via Metro's platform resolution.
import type { todoDb as _todoDb } from "./db.web";
export const todoDb = null as unknown as typeof _todoDb;
