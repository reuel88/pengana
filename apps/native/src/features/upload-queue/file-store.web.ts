import {
	getFileFromDexie as getFile,
	removeFileFromDexie as removeFile,
	storeFileInDexie as storeFile,
} from "@pengana/upload-client/adapters/dexie-file-store";

import { appDb } from "@/shared/db/db.web";

export function storeFileInDexie(attachmentId: string, file: File) {
	return storeFile(appDb, attachmentId, file);
}

export function getFileFromDexie(attachmentId: string) {
	return getFile(appDb, attachmentId);
}

export function removeFileFromDexie(attachmentId: string) {
	return removeFile(appDb, attachmentId);
}
