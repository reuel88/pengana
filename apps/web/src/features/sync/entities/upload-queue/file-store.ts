import { storeFileInIndexedDB as storeFile } from "@pengana/upload-client/adapters/dexie-file-store";

import { appDb } from "@/shared/db";

export async function storeFileInIndexedDB(
	entityId: string,
	file: File,
): Promise<void> {
	return storeFile(appDb, entityId, file);
}
