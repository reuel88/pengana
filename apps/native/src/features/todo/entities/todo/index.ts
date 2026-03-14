export {
	createDrizzleOrgSyncAdapter,
	createDrizzleOrgSyncAdapter as createOrgSyncAdapter,
	createDrizzleSyncAdapter,
	createDrizzleSyncAdapter as createSyncAdapter,
} from "./adapter";
export { syncMeta, todos } from "./schema";

import { appDb as nativeAppDb } from "./db";
import type { appDb as webAppDb } from "./db.web";

export const appDb = nativeAppDb as unknown as typeof nativeAppDb &
	typeof webAppDb;
