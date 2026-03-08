import type { UploadTransport } from "@pengana/sync-engine";
import { createUploadTransport } from "@pengana/todo-client";

import { client } from "@/utils/orpc";

import { getFileForUpload, removeFileForUpload } from "./file-store";

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
			removeFileForUpload(todoId);
		},
	});
}
