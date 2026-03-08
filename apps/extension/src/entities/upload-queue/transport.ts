import type { UploadTransport } from "@pengana/sync-engine";
import { createUploadTransport } from "@pengana/todo-client";
import {
	getFileForUpload,
	removeFileForUpload,
} from "@pengana/todo-client/dexie-file-store";
import { client } from "@/utils/orpc";

export function createWebUploadTransport(): UploadTransport {
	return createUploadTransport({
		rpc: client.upload,
		async getBase64(todoId) {
			const fileData = await getFileForUpload(todoId);
			if (!fileData) {
				throw new Error(
					"File not found in storage. It may have been lost. Please re-attach the file.",
				);
			}
			return fileData.base64;
		},
		onUploaded(todoId) {
			void removeFileForUpload(todoId);
		},
	});
}
