import { createUploadLifecycleCallbacks } from "@pengana/upload-client";
import type { UploadLifecycleCallbacks } from "@pengana/upload-queue";
import { appDb } from "@/shared/db";

export function createNativeUploadLifecycleCallbacks(): UploadLifecycleCallbacks {
	return createUploadLifecycleCallbacks(appDb);
}
