import {
	getFileFromIndexedDB as getFile,
	removeFileFromIndexedDB as removeFile,
	storeFileInIndexedDB as storeFile,
} from "@pengana/todo-client/adapters/dexie-file-store";

import { appDb } from "@/features/todo/entities/todo/db.web";

export function storeFileInIndexedDB(attachmentId: string, file: File) {
	return storeFile(appDb, attachmentId, file);
}

export function getFileFromIndexedDB(attachmentId: string) {
	return getFile(appDb, attachmentId);
}

export function removeFileFromIndexedDB(attachmentId: string) {
	return removeFile(appDb, attachmentId);
}
