import type { UploadTransport } from "@pengana/sync-engine";
import { readFileAsBase64 } from "../lib/file-utils";
import { getFileFromMemory, removeFileFromMemory } from "./memory-file-store";
import { createUploadTransport } from "./upload-transport";

type UploadRpc = Parameters<typeof createUploadTransport>[0]["rpc"];

export function createMemoryUploadTransport(rpc: UploadRpc): UploadTransport {
	return createUploadTransport({
		rpc,
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
		onFailed(todoId, fileUri) {
			removeFileFromMemory(todoId);
			URL.revokeObjectURL(fileUri);
		},
	});
}
