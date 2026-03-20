import type { EntityDatabase } from "@pengana/entity-store";
import type { UploadTransport } from "@pengana/upload-queue";
import { INDEXEDDB_URI_PREFIX } from "@pengana/upload-queue";

import { getFileFromIndexedDB } from "./dexie-file-store";
import { createUploadTransport } from "./upload-transport";

interface UploadRpc {
	upload(input: {
		fileName: string;
		mimeType: string;
		data: string;
		idempotencyKey: string;
		attachmentId: string;
		entityType?: string;
		entityId?: string;
		scopeType?: "personal" | "org";
	}): Promise<{ data: { url: string; mediaId: string } }>;
}

interface IndexedDbUploadTransportOptions {
	rpc: UploadRpc;
	db: EntityDatabase;
}

export function createIndexedDbUploadTransport({
	rpc,
	db,
}: IndexedDbUploadTransportOptions): UploadTransport {
	return createUploadTransport({
		rpc,
		async getBase64(input) {
			const fileKey = input.fileUri.slice(INDEXEDDB_URI_PREFIX.length);
			const fileData = await getFileFromIndexedDB(db, fileKey);
			if (!fileData) {
				throw new Error(
					"File not found in storage. It may have been lost. Please re-attach the file.",
				);
			}
			return fileData.base64;
		},
		onUploaded(_fileUri) {
			// File cleanup handled via lifecycle callbacks
		},
		onFailed(_fileUri) {
			// File cleanup handled via lifecycle callbacks
		},
	});
}
