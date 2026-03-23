import { createUploadLifecycleCallbacks } from "@pengana/local-db/media";
import type { UploadLifecycleCallbacks } from "@pengana/sync/upload";
import { appDb } from "@/shared/db";

export function createNativeUploadLifecycleCallbacks(): UploadLifecycleCallbacks {
	return createUploadLifecycleCallbacks(appDb);
}
