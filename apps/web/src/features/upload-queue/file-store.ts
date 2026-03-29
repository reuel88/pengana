import type { EntityDatabase } from "@pengana/local-db/dexie";
import { storeFileInDexie } from "@pengana/local-db/media/adapters/dexie-file-store";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync/upload";

export function createIndexedDbFileStrategy(db: EntityDatabase) {
	return {
		storeFile: async (entityId: string, file: File) =>
			storeFileInDexie(db, entityId, file),
		createFileRef: (id: string) => ({
			uri: `${INDEXEDDB_URI_PREFIX}${id}`,
		}),
	};
}
