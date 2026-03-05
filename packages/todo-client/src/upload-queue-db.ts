import type { UploadItem } from "@finance-tool-poc/sync-engine";

import Dexie, { type EntityTable } from "dexie";

export interface FileDataRecord {
	todoId: string;
	base64: string;
	mimeType: string;
	fileName: string;
}

export class UploadQueueDatabase extends Dexie {
	uploadQueue!: EntityTable<UploadItem, "id">;
	fileData!: EntityTable<FileDataRecord, "todoId">;

	constructor() {
		super("UploadQueueDatabase");
		this.version(1).stores({
			uploadQueue: "id, todoId, status, createdAt",
		});
		// v2: Added fileData table for storing base64 file blobs before upload
		this.version(2).stores({
			uploadQueue: "id, todoId, status, createdAt",
			fileData: "todoId",
		});
	}
}

/** Singleton — Dexie caches the connection; creating multiple instances causes errors. */
export const uploadQueueDb = new UploadQueueDatabase();
