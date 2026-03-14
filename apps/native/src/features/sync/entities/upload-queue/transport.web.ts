import type { UploadTransport } from "@pengana/sync-engine";
import { createIndexedDbUploadTransport as createTodoClientIndexedDbUploadTransport } from "@pengana/todo-client";

import { client } from "@/shared/api/orpc";

export function createIndexedDbUploadTransport(): UploadTransport {
	return createTodoClientIndexedDbUploadTransport({
		rpc: client.upload,
	});
}
