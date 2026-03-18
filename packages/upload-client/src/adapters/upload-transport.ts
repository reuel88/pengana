import type { AllowedMimeType, UploadTransport } from "@pengana/sync-engine";
import { MIME_TO_EXT } from "@pengana/sync-engine";

export interface UploadTransportInput {
	fileUri: string;
	mimeType: string;
	idempotencyKey: string;
	entityType?: string;
	entityId?: string;
	scopeType?: "personal" | "org";
}

interface UploadRpc {
	upload(input: {
		fileName: string;
		mimeType: AllowedMimeType;
		data: string;
		idempotencyKey: string;
		attachmentId: string;
		entityType?: string;
		entityId?: string;
		scopeType?: "personal" | "org";
	}): Promise<{ data: { url: string; mediaId: string } }>;
}

interface UploadTransportOptions {
	rpc: UploadRpc;
	getBase64(input: UploadTransportInput): Promise<string>;
	onUploaded?(fileUri: string): void | Promise<void>;
	onFailed?(fileUri: string): void | Promise<void>;
}

export function createUploadTransport(
	options: UploadTransportOptions,
): UploadTransport {
	return {
		async onFailed(fileUri) {
			await options.onFailed?.(fileUri);
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
				fileName: `attachment-${Date.now()}.${ext}`,
				mimeType: input.mimeType as AllowedMimeType,
				data,
				idempotencyKey: input.idempotencyKey,
				attachmentId: input.idempotencyKey,
				entityType: input.entityType,
				entityId: input.entityId,
				scopeType: input.scopeType,
			});
			await options.onUploaded?.(input.fileUri);

			return result.data;
		},
	};
}
