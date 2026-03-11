import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

import { readFileAsBase64 } from "../lib/file-utils";
import { uploadQueueDb } from "../lib/upload-queue-db";

export async function storeFileInIndexedDB(
	todoId: string,
	file: File,
): Promise<void> {
	const base64 = await readFileAsBase64(file);
	try {
		await uploadQueueDb.fileData.put({
			todoId,
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
	todoId: string,
): Promise<{ base64: string; mimeType: string; fileName: string } | undefined> {
	return uploadQueueDb.fileData.get(todoId);
}

export async function removeFileFromIndexedDB(todoId: string): Promise<void> {
	await uploadQueueDb.fileData.delete(todoId);
}
