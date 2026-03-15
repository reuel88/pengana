import type { UploadTransport } from "@pengana/sync-engine";
import { createIndexedDbUploadTransport as createTodoClientIndexedDbUploadTransport } from "@pengana/upload-client";

import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

export function createIndexedDbUploadTransport(): UploadTransport {
	return createTodoClientIndexedDbUploadTransport({
		rpc: client.upload,
		db: appDb,
	});
}
