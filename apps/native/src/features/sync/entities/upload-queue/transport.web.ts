import type { UploadTransport } from "@pengana/sync-engine";
import { createIndexedDbUploadTransport as createTodoClientIndexedDbUploadTransport } from "@pengana/upload-client";

import { appDb } from "@/features/todo/entities/todo/db.web";
import { client } from "@/shared/api/orpc";

export function createIndexedDbUploadTransport(): UploadTransport {
	return createTodoClientIndexedDbUploadTransport({
		rpc: client.upload,
		db: appDb,
	});
}
