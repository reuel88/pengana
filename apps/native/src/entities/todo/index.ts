export {
	createDrizzleSyncAdapter,
	createDrizzleSyncAdapter as createSyncAdapter,
} from "./adapter";
export { db } from "./db";
export { syncMeta, todos } from "./schema";

// Placeholder for web-only imports so TypeScript resolves .web.ts files correctly.
// At runtime, .web.ts files import from index.web.ts via Metro's platform resolution.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const todoDb = null as unknown;
