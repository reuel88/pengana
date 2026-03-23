import { createWebUploadAdapter as createTodoClientWebUploadAdapter } from "@pengana/local-db/media";

import { appDb } from "@/shared/db/db.web";

export function createWebUploadAdapter() {
	return createTodoClientWebUploadAdapter(appDb);
}
