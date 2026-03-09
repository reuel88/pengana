import type { UploadTransport } from "@pengana/sync-engine";
import { createUploadTransport } from "@pengana/todo-client";
import {
	getFileFromIndexedDB,
	removeFileFromIndexedDB,
} from "@pengana/todo-client/adapters/dexie-file-store";
import { client } from "@/utils/orpc";

export function createWebUploadTransport(): UploadTransport {
	return createUploadTransport({
		rpc: client.upload,
		async getBase64(todoId) {
			const fileData = await getFileFromIndexedDB(todoId);
			if (!fileData) {
				throw new Error(
					"File not found in storage. It may have been lost. Please re-attach the file.",
				);
			}
			return fileData.base64;
		},
		onUploaded(todoId) {
			void removeFileFromIndexedDB(todoId);
		},
		onFailed(todoId) {
			void removeFileFromIndexedDB(todoId);
		},
	});
}
