import type { AllowedMimeType, UploadTransport } from "@pengana/sync-engine";
import { MIME_TO_EXT } from "@pengana/sync-engine";

import { client } from "@/utils/orpc";

import { getFileForUpload, removeFileForUpload } from "./file-store";

export function createWebUploadTransport(): UploadTransport {
	return {
		async upload(input: {
			todoId: string;
			fileUri: string;
			mimeType: string;
			idempotencyKey: string;
		}): Promise<{ attachmentUrl: string }> {
			const fileData = await getFileForUpload(input.todoId);
			if (!fileData) {
				throw new Error(
					"File not found in storage. It may have been lost. Please re-attach the file.",
				);
			}

			const ext = MIME_TO_EXT[input.mimeType] ?? "bin";

			const result = await client.upload.upload({
				todoId: input.todoId,
				fileName: `attachment-${Date.now()}.${ext}`,
				mimeType: input.mimeType as AllowedMimeType,
				data: fileData.base64,
				idempotencyKey: input.idempotencyKey,
			});

			await removeFileForUpload(input.todoId);

			return result;
		},
	};
}
