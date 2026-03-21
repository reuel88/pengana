import { createDrizzleUploadLifecycleCallbacks } from "@pengana/upload-client";

import { appDb } from "@/shared/db/db";
import { media } from "@/shared/db/schema";

export function createNativeUploadLifecycleCallbacks() {
	return createDrizzleUploadLifecycleCallbacks(appDb, media);
}
