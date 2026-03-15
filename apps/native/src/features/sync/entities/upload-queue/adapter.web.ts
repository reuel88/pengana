import { createWebUploadAdapter as createTodoClientWebUploadAdapter } from "@pengana/upload-client";

import { appDb } from "@/features/todo/entities/todo/db.web";

export function createWebUploadAdapter() {
	return createTodoClientWebUploadAdapter(appDb);
}
