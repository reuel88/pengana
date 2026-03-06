import type { AllowedMimeType, UploadTransport } from "@pengana/sync-engine";
import { MIME_TO_EXT } from "@pengana/sync-engine";

import { client } from "@/utils/orpc";

import { getFileForUpload, removeFileForUpload } from "./file-store.web";

function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			const base64 = result.split(",")[1];
			resolve(base64);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

export function createWebUploadTransport(): UploadTransport {
	return {
		async upload(input: {
			todoId: string;
			fileUri: string;
			mimeType: string;
			idempotencyKey: string;
		}): Promise<{ attachmentUrl: string }> {
			const file = getFileForUpload(input.todoId);
			if (!file) {
				throw new Error(
					"File not found in memory. It may have been lost on page refresh. Please re-attach the file.",
				);
			}

			const data = await readFileAsBase64(file);
			const ext = MIME_TO_EXT[input.mimeType] ?? "bin";

			const result = await client.upload.upload({
				todoId: input.todoId,
				fileName: `attachment-${Date.now()}.${ext}`,
				mimeType: input.mimeType as AllowedMimeType,
				data,
				idempotencyKey: input.idempotencyKey,
			});

			removeFileForUpload(input.todoId);
			URL.revokeObjectURL(input.fileUri);

			return result;
		},
	};
}
