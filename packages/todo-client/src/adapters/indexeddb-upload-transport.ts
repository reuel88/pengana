import type { EntityDatabase } from "@pengana/entity-store";
import type { UploadTransport } from "@pengana/sync-engine";

import {
	getFileFromIndexedDB,
	removeFileFromIndexedDB,
} from "./dexie-file-store";
import { createUploadTransport } from "./upload-transport";

interface UploadRpc {
	upload(input: {
		entityType: string;
		entityId: string;
		fileName: string;
		mimeType: string;
		data: string;
		idempotencyKey: string;
	}): Promise<{ data: { attachmentUrl: string } }>;
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
			const fileData = await getFileFromIndexedDB(db, input.entityId);
			if (!fileData) {
				throw new Error(
					"File not found in storage. It may have been lost. Please re-attach the file.",
				);
			}
			return fileData.base64;
		},
		onUploaded(_entityType, entityId) {
			void removeFileFromIndexedDB(db, entityId);
		},
		onFailed(_entityType, entityId) {
			void removeFileFromIndexedDB(db, entityId);
		},
	});
}
