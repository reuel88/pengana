import type { UploadLifecycleCallbacks } from "@pengana/sync-engine";
import { createTodoUploadLifecycleCallbacks } from "@pengana/todo-client";
import { appDb } from "@/features/todo/entities/todo";

export function createNativeUploadLifecycleCallbacks(): UploadLifecycleCallbacks {
	return createTodoUploadLifecycleCallbacks(appDb);
}
