import { createIndexedDbUploadTransport as createTodoClientIndexedDbUploadTransport } from "@pengana/upload-client";
import type { UploadTransport } from "@pengana/upload-queue";

import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

export function createIndexedDbUploadTransport(): UploadTransport {
	return createTodoClientIndexedDbUploadTransport({
		rpc: client.upload,
		db: appDb,
	});
}
