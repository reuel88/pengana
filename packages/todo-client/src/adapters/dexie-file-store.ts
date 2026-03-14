import type { EntityDatabase } from "@pengana/entity-store";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

import { readFileAsBase64 } from "../lib/file-utils";
import type { FileDataRecord } from "../lib/upload-queue-stores";

export async function storeFileInIndexedDB(
	db: EntityDatabase,
	entityId: string,
	file: File,
): Promise<void> {
	const base64 = await readFileAsBase64(file);
	try {
		await db.getTable<FileDataRecord>("fileData").put({
			entityId,
			base64,
			mimeType: file.type,
			fileName: file.name,
		});
	} catch (e) {
		if (isQuotaError(e)) throw new StorageFullError();
		throw e;
	}
}

export async function getFileFromIndexedDB(
	db: EntityDatabase,
	entityId: string,
): Promise<{ base64: string; mimeType: string; fileName: string } | undefined> {
	return db.getTable<FileDataRecord>("fileData").get(entityId);
}

export async function removeFileFromIndexedDB(
	db: EntityDatabase,
	entityId: string,
): Promise<void> {
	await db.getTable<FileDataRecord>("fileData").delete(entityId);
}
