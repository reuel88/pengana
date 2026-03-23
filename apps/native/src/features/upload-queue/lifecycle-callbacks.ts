import { createDrizzleUploadLifecycleCallbacks } from "@pengana/local-db/media";

import { appDb } from "@/shared/db/db";
import { media } from "@/shared/db/schema";

export function createNativeUploadLifecycleCallbacks() {
	return createDrizzleUploadLifecycleCallbacks(appDb, media);
}
