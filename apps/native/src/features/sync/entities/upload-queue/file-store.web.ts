import {
	getFileFromIndexedDB as getFile,
	removeFileFromIndexedDB as removeFile,
	storeFileInIndexedDB as storeFile,
} from "@pengana/todo-client/adapters/dexie-file-store";

import { appDb } from "@/features/todo/entities/todo/db.web";

export function storeFileInIndexedDB(entityId: string, file: File) {
	return storeFile(appDb, entityId, file);
}

export function getFileFromIndexedDB(entityId: string) {
	return getFile(appDb, entityId);
}

export function removeFileFromIndexedDB(entityId: string) {
	return removeFile(appDb, entityId);
}
