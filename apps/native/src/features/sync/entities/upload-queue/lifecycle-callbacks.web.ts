import type { UploadLifecycleCallbacks } from "@pengana/sync-engine";
import { createUploadLifecycleCallbacks } from "@pengana/todo-client";
import { appDb } from "@/features/todo/entities/todo";

export function createNativeUploadLifecycleCallbacks(): UploadLifecycleCallbacks {
	return createUploadLifecycleCallbacks(appDb);
}
