import type { AllowedMimeType, UploadTransport } from "@pengana/sync-engine";
import { MIME_TO_EXT } from "@pengana/sync-engine";

export interface UploadTransportInput {
	entityType: string;
	entityId: string;
	fileUri: string;
	mimeType: string;
	idempotencyKey: string;
}

interface UploadRpc {
	upload(input: {
		entityType: string;
		entityId: string;
		fileName: string;
		mimeType: AllowedMimeType;
		data: string;
		idempotencyKey: string;
		attachmentId: string;
	}): Promise<{ data: { url: string; mediaId: string } }>;
}

interface UploadTransportOptions {
	rpc: UploadRpc;
	getBase64(input: UploadTransportInput): Promise<string>;
	onUploaded?(
		entityType: string,
		entityId: string,
		fileUri: string,
	): void | Promise<void>;
	onFailed?(
		entityType: string,
		entityId: string,
		fileUri: string,
	): void | Promise<void>;
}

export function createUploadTransport(
	options: UploadTransportOptions,
): UploadTransport {
	return {
		async onFailed(entityType, entityId, fileUri) {
			await options.onFailed?.(entityType, entityId, fileUri);
		},
		async upload(input) {
			const data = await options.getBase64(input);
			if (!data) {
				throw new Error(
					"File not found. It may have been lost. Please re-attach the file.",
				);
			}

			const ext = MIME_TO_EXT[input.mimeType] ?? "bin";

			const result = await options.rpc.upload({
				entityType: input.entityType,
				entityId: input.entityId,
				fileName: `attachment-${Date.now()}.${ext}`,
				mimeType: input.mimeType as AllowedMimeType,
				data,
				idempotencyKey: input.idempotencyKey,
				attachmentId: input.idempotencyKey,
			});
			await options.onUploaded?.(
				input.entityType,
				input.entityId,
				input.fileUri,
			);

			return result.data;
		},
	};
}
