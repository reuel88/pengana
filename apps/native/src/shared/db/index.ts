export { media, mediaAttachments, syncMeta, todos } from "./schema";

import { appDb as nativeAppDb } from "./db";
import type { appDb as webAppDb } from "./db.web";

export const appDb = nativeAppDb as unknown as typeof nativeAppDb &
	typeof webAppDb;
