import { storeFileInDexie as storeFile } from "@pengana/upload-client/adapters/dexie-file-store";

import { appDb } from "@/shared/db";

export async function storeFileInDexie(
	entityId: string,
	file: File,
): Promise<void> {
	return storeFile(appDb, entityId, file);
}
