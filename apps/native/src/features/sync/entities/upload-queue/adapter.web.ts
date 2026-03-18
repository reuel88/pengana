import { createWebUploadAdapter as createTodoClientWebUploadAdapter } from "@pengana/upload-client";

import { appDb } from "@/shared/db/db.web";

export function createWebUploadAdapter() {
	return createTodoClientWebUploadAdapter(appDb);
}
