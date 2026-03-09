import type { UploadTransport } from "@pengana/sync-engine";
import {
	createUploadTransport,
	getFileFromMemory,
	readFileAsBase64,
	removeFileFromMemory,
} from "@pengana/todo-client";

import { client } from "@/utils/orpc";

export function createWebUploadTransport(): UploadTransport {
	return createUploadTransport({
		rpc: client.upload,
		async getBase64(todoId) {
			const file = getFileFromMemory(todoId);
			if (!file) {
				throw new Error(
					"File not found in memory. It may have been lost on page refresh. Please re-attach the file.",
				);
			}
			return readFileAsBase64(file);
		},
		onUploaded(todoId, fileUri) {
			removeFileFromMemory(todoId);
			URL.revokeObjectURL(fileUri);
		},
	});
}
