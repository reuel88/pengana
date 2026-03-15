import type { EntityDatabase } from "@pengana/entity-store";
import type { UploadTransport } from "@pengana/sync-engine";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";

import { getFileFromIndexedDB } from "./dexie-file-store";
import { createUploadTransport } from "./upload-transport";

interface UploadRpc {
	upload(input: {
		entityType: string;
		entityId: string;
		fileName: string;
		mimeType: string;
		data: string;
		idempotencyKey: string;
		attachmentId: string;
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
		onUploaded(_entityType, _entityId, _fileUri) {
			// File cleanup handled via lifecycle callbacks
		},
		onFailed(_entityType, _entityId, _fileUri) {
			// File cleanup handled via lifecycle callbacks
		},
	});
}
