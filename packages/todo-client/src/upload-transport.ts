import type { AllowedMimeType, UploadTransport } from "@pengana/sync-engine";
import { MIME_TO_EXT } from "@pengana/sync-engine";

interface UploadRpc {
	upload(input: {
		todoId: string;
		fileName: string;
		mimeType: AllowedMimeType;
		data: string;
		idempotencyKey: string;
	}): Promise<{ data: { attachmentUrl: string } }>;
}

interface UploadTransportOptions {
	rpc: UploadRpc;
	getBase64(todoId: string): Promise<string>;
	onUploaded?(todoId: string, fileUri: string): void | Promise<void>;
}

export function createUploadTransport(
	options: UploadTransportOptions,
): UploadTransport {
	return {
		async upload(input: {
			todoId: string;
			fileUri: string;
			mimeType: string;
			idempotencyKey: string;
		}): Promise<{ attachmentUrl: string }> {
			const data = await options.getBase64(input.todoId);
			if (!data) {
				throw new Error(
					"File not found. It may have been lost. Please re-attach the file.",
				);
			}

			const ext = MIME_TO_EXT[input.mimeType] ?? "bin";

			const result = await options.rpc.upload({
				todoId: input.todoId,
				fileName: `attachment-${Date.now()}.${ext}`,
				mimeType: input.mimeType as AllowedMimeType,
				data,
				idempotencyKey: input.idempotencyKey,
			});

			await options.onUploaded?.(input.todoId, input.fileUri);

			return result.data;
		},
	};
}
