import type { EntityDatabase } from "@pengana/entity-store";
import type { UploadTransport } from "@pengana/upload-queue";
import { INDEXEDDB_URI_PREFIX } from "@pengana/upload-queue";

import { getFileFromDexie } from "./dexie-file-store";
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

interface DexieUploadTransportOptions {
	rpc: UploadRpc;
	db: EntityDatabase;
}

export function createDexieUploadTransport({
	rpc,
	db,
}: DexieUploadTransportOptions): UploadTransport {
	return createUploadTransport({
		rpc,
		async getBase64(input) {
			const fileKey = input.fileUri.slice(INDEXEDDB_URI_PREFIX.length);
			const fileData = await getFileFromDexie(db, fileKey);
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
